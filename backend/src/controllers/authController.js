const { db, auth, isFirebaseMode } = require('../config/firebase');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const https = require('https');
const JWT_SECRET = process.env.JWT_SECRET || 'uos-timetable-development-secret-key';

// Helper to send password reset email via Firebase Identity Toolkit REST API
const sendFirebaseResetEmail = (email, apiKey) => {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      requestType: 'PASSWORD_RESET',
      email: email
    });

    const options = {
      hostname: 'identitytoolkit.googleapis.com',
      port: 443,
      path: `/v1/accounts:sendOobCode?key=${apiKey}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`Firebase REST API Error: ${data}`));
        }
      });
    });

    req.on('error', (e) => { reject(e); });
    req.write(postData);
    req.end();
  });
};

// Helper to verify credentials via Firebase Identity Toolkit REST API (signInWithPassword)
const verifyFirebasePassword = (email, password, apiKey) => {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      email: email,
      password: password,
      returnSecureToken: true
    });

    const options = {
      hostname: 'identitytoolkit.googleapis.com',
      port: 443,
      path: `/v1/accounts:signInWithPassword?key=${apiKey}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`Firebase Auth Error: ${data}`));
        }
      });
    });

    req.on('error', (e) => { reject(e); });
    req.write(postData);
    req.end();
  });
};


/**
 * Register a new student profile and create user auth record
 */
exports.register = async (req, res) => {
  try {
    const { email, password, fullName, program, type, batch, semester, role = 'student', department, designation, employeeId, teachingId } = req.body;

    if (role === 'student') {
      if (!email || !password || !fullName || !program || !type || !batch || !semester) {
        return res.status(400).json({
          success: false,
          message: 'Please fill in all required fields.'
        });
      }
    } else {
      if (!email || !password || !fullName || !department || !designation || !employeeId || !teachingId) {
        return res.status(400).json({
          success: false,
          message: 'Please fill in all required fields, including Department, Designation, Employee ID, and Teaching ID.'
        });
      }
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.'
      });
    }

    if (role === 'student' && !/^\d{4}-\d{4}$/.test(batch)) {
      return res.status(400).json({
        success: false,
        message: 'Session / Batch must be in YYYY-YYYY format (e.g., 2024-2028).'
      });
    }

    let uid;
    let authUser;

    // Check if user already exists or create auth record
    try {
      if (isFirebaseMode) {
        authUser = await auth.createUser({
          email,
          password,
          displayName: fullName
        });
        uid = authUser.uid;
      } else {
        authUser = await auth.createUser({ email, password });
        uid = authUser.uid;
      }
    } catch (err) {
      console.error('Auth User Creation Error:', err.message);
      return res.status(400).json({
        success: false,
        message: err.message || 'Failed to create authentication credentials.'
      });
    }

    const userProfile = {
      uid,
      email,
      fullName,
      role,
      // Store password metadata in database for unified server login verification across modes
      passwordHash: password, 
      createdAt: new Date().toISOString()
    };

    if (role === 'student') {
      userProfile.program = program;
      userProfile.type = type;
      userProfile.batch = batch;
      userProfile.semester = Number(semester);
    } else {
      userProfile.department = department;
      userProfile.designation = designation;
      userProfile.employeeId = employeeId;
      userProfile.teachingId = teachingId;
      userProfile.verifiedFaculty = true;
    }

    // Save profile to database (Firestore or Local JSON fallback)
    await db.collection('users').doc(uid).set(userProfile);

    // Generate secure session JWT token
    const token = jwt.sign({ uid }, JWT_SECRET, { expiresIn: '7d' });

    // Don't send password hash back
    const { passwordHash, ...cleanProfile } = userProfile;

    return res.status(201).json({
      success: true,
      message: `${role === 'teacher' ? 'Teacher' : 'Student'} account created successfully.`,
      token,
      user: cleanProfile
    });

  } catch (error) {
    console.error('Registration Controller Error:', error);
    return res.status(500).json({
      success: false,
      message: 'An internal server error occurred during registration.'
    });
  }
};

/**
 * Authenticate student, check credentials, and return token and profile
 */
exports.login = async (req, res) => {
  try {
    const { email, password, teachingId } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.'
      });
    }

    let userRecord;
    let uid;

    // Search by email or Teaching ID (employeeId) in Firestore / Local DB
    try {
      const usersRef = db.collection('users');
      let snapshot = await usersRef.where('email', '==', email).get();
      if (snapshot.empty) {
        snapshot = await usersRef.where('employeeId', '==', email).get();
      }
      
      if (!snapshot.empty) {
        const userDoc = snapshot.docs[0];
        userRecord = userDoc.data();
        uid = userDoc.id;
      }
    } catch (err) {
      console.error('Database Login Scan Error:', err.message);
    }

    // Fallback Mock Auth search in Local Mode if db scan failed to find profile
    if (!userRecord) {
      try {
        const mockUser = await auth.getUserByEmail(email);
        uid = mockUser.uid;
        const doc = await db.collection('users').doc(uid).get();
        if (doc.exists) {
          userRecord = doc.data();
        }
      } catch (err) {
        console.warn('Fallback Auth Scan Error:', err.message);
      }
    }

    if (!userRecord) {
      return res.status(401).json({
        success: false,
        message: 'No registered student or teacher profile found matching this Email or Teaching ID.'
      });
    }

    // If teacher role, verify Teaching ID matches the profile teachingId
    if (userRecord.role === 'teacher' && teachingId) {
      if (userRecord.teachingId !== teachingId) {
        return res.status(401).json({
          success: false,
          message: 'Security mismatch: The entered Teaching ID does not correspond to this email profile.'
        });
      }
    }

    // Verify password match
    let isAuthenticated = false;
    const webApiKey = process.env.FIREBASE_WEB_API_KEY;

    if (isFirebaseMode && webApiKey) {
      try {
        const firebaseEmail = userRecord.email || email;
        console.log(`[Login] Authenticating user password with Firebase Auth Service for ${firebaseEmail}`);
        await verifyFirebasePassword(firebaseEmail, password, webApiKey);
        isAuthenticated = true;
        console.log(`[Login] Firebase Auth authenticated successfully for ${firebaseEmail}`);
        
        // Sync the new password to the Firestore user doc passwordHash to keep them in sync
        if (userRecord.passwordHash !== password) {
          await db.collection('users').doc(uid).set({ passwordHash: password }, { merge: true });
          userRecord.passwordHash = password; // update the local reference too
        }
      } catch (err) {
        console.warn('[Login] Firebase Auth service authentication failed:', err.message);
        // If it was a wrong password, fail immediately.
        if (err.message.includes('INVALID_PASSWORD') || err.message.includes('EMAIL_NOT_FOUND')) {
          return res.status(401).json({
            success: false,
            message: 'Authentication failed. Incorrect security password.'
          });
        }
        // For other network/config failures, we fall back to Firestore document check below
      }
    }

    if (!isAuthenticated) {
      // Fallback/Local mode check: verify password against stored Firestore passwordHash
      if (userRecord.passwordHash !== password) {
        return res.status(401).json({
          success: false,
          message: 'Authentication failed. Incorrect security password.'
        });
      }
    }

    // Generate secure session JWT token
    const token = jwt.sign({ uid }, JWT_SECRET, { expiresIn: '7d' });

    // Clean profile data
    const { passwordHash, ...cleanProfile } = userRecord;

    return res.status(200).json({
      success: true,
      message: 'Authentication successful.',
      token,
      user: cleanProfile
    });

  } catch (error) {
    console.error('Login Controller Error:', error);
    return res.status(500).json({
      success: false,
      message: 'An internal server error occurred during authentication.'
    });
  }
};

/**
 * Retrieve current logged-in user profile
 */
exports.getMe = async (req, res) => {
  try {
    const uid = req.user.uid;
    const userDoc = await db.collection('users').doc(uid).get();

    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found.'
      });
    }

    const { passwordHash, ...cleanProfile } = userDoc.data();

    return res.status(200).json({
      success: true,
      user: cleanProfile
    });

  } catch (error) {
    console.error('GetMe Controller Error:', error);
    return res.status(500).json({
      success: false,
      message: 'An internal server error occurred while retrieving profile.'
    });
  }
};

/**
 * Update current logged-in user profile
 */
exports.updateProfile = async (req, res) => {
  try {
    const uid = req.user.uid;
    const { fullName, program, type, batch, semester, password } = req.body;

    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found.'
      });
    }

    const existingUser = userDoc.data();
    const role = existingUser.role || 'student';

    if (role === 'student') {
      if (!fullName || !program || !type || !batch || !semester) {
        return res.status(400).json({
          success: false,
          message: 'Please fill in all required academic parameters.'
        });
      }

      if (!/^\d{4}-\d{4}$/.test(batch)) {
        return res.status(400).json({
          success: false,
          message: 'Session / Batch must be in YYYY-YYYY format (e.g., 2024-2028).'
        });
      }
    } else {
      if (!fullName) {
        return res.status(400).json({
          success: false,
          message: 'Please fill in your full name.'
        });
      }
    }

    if (password) {
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 6 characters long.'
        });
      }
      
      if (isFirebaseMode) {
        try {
          await auth.updateUser(uid, { password });
        } catch (err) {
          console.error('Firebase Auth Password Update Error:', err.message);
          return res.status(400).json({
            success: false,
            message: err.message || 'Failed to update authentication password.'
          });
        }
      }
    }

    const updateData = {
      fullName
    };

    if (role === 'student') {
      updateData.program = program;
      updateData.type = type;
      updateData.batch = batch;
      updateData.semester = Number(semester);
    }

    if (password) {
      updateData.passwordHash = password;
    }

    await db.collection('users').doc(uid).set(updateData, { merge: true });

    const updatedDoc = await db.collection('users').doc(uid).get();
    const { passwordHash, ...cleanProfile } = updatedDoc.data();

    return res.status(200).json({
      success: true,
      message: `${role === 'teacher' ? 'Teacher' : 'Student'} profile updated successfully.`,
      user: cleanProfile
    });

  } catch (error) {
    console.error('UpdateProfile Controller Error:', error);
    return res.status(500).json({
      success: false,
      message: 'An internal server error occurred while updating profile.'
    });
  }
};
// ── Reset Token Store (local JSON file or in-memory for Firebase mode) ──────
const dataDir = path.join(__dirname, '..', '..', 'data');
const tokensFile = path.join(dataDir, 'reset_tokens.json');

const readTokens = () => {
  try {
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    if (!fs.existsSync(tokensFile)) fs.writeFileSync(tokensFile, '{}');
    return JSON.parse(fs.readFileSync(tokensFile, 'utf8') || '{}');
  } catch (e) { return {}; }
};

const writeTokens = (data) => {
  try {
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(tokensFile, JSON.stringify(data, null, 2));
  } catch (e) { /* silent */ }
};

/**
 * Initiate forgot password: generate a reset token for the given email.
 * In local/dev mode the token is returned in the response so users can
 * paste it straight into the reset form (no SMTP required).
 */
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide your university email address.' });
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
    }

    // Look up user — works in both Firebase and Local mode
    let uid = null;
    try {
      const userRecord = await auth.getUserByEmail(email);
      uid = userRecord.uid;
    } catch (err) {
      // Don't reveal whether the email exists — always return success
      console.warn('[ForgotPassword] Email not found:', email);
      return res.status(200).json({
        success: true,
        message: 'If that email is registered, a reset link has been generated.',
        // In prod: send email. In dev: return nothing extra for unknown addresses.
      });
    }

    // Generate a cryptographically secure 64-char hex token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 30 * 60 * 1000; // 30 minutes

    // Persist token (local JSON file; for Firebase you would use Firestore)
    const tokens = readTokens();
    // Invalidate any existing token for this user
    for (const key of Object.keys(tokens)) {
      if (tokens[key].uid === uid) delete tokens[key];
    }
    tokens[token] = { uid, email, expiresAt };
    writeTokens(tokens);

    console.log(`[ForgotPassword] Reset token generated for ${email}: ${token}`);

    // Check if we are running in production mode
    const isProduction = process.env.NODE_ENV === 'production';
    const webApiKey = process.env.FIREBASE_WEB_API_KEY;

    if (isProduction && webApiKey) {
      try {
        console.log(`[ForgotPassword] Requesting Firebase to send native reset email to ${email}`);
        await sendFirebaseResetEmail(email, webApiKey);
        console.log(`[ForgotPassword] Firebase reset email sent successfully to ${email}`);
      } catch (err) {
        console.error('[ForgotPassword] Failed to send Firebase native reset email:', err.message);
      }
    }

    const responseData = {
      success: true,
      message: 'If that email is registered, a password reset token has been generated.'
    };

    if (!isProduction) {
      // ⚠️ Dev-only: return token in response only for local development
      responseData.devResetToken = token;
      responseData.resetUrl = `http://localhost:5173/reset-password?token=${token}`;
      responseData.message = 'Password reset token generated. Use it within 30 minutes.';
    }

    return res.status(200).json(responseData);

  } catch (error) {
    console.error('ForgotPassword Controller Error:', error);
    return res.status(500).json({ success: false, message: 'An internal server error occurred.' });
  }
};

/**
 * Complete the password reset: validate token and update password.
 */
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ success: false, message: 'Reset token and new password are required.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    const tokens = readTokens();
    const entry = tokens[token];

    if (!entry) {
      return res.status(400).json({ success: false, message: 'Invalid or already used reset token.' });
    }
    if (Date.now() > entry.expiresAt) {
      delete tokens[token];
      writeTokens(tokens);
      return res.status(400).json({ success: false, message: 'Reset token has expired. Please request a new one.' });
    }

    const { uid } = entry;

    // Update password in the user profile (passwordHash field)
    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Update password in auth layer (Firebase or local mock)
    if (isFirebaseMode) {
      try {
        await auth.updateUser(uid, { password: newPassword });
      } catch (err) {
        console.error('[ResetPassword] Firebase auth update error:', err.message);
        return res.status(400).json({ success: false, message: 'Failed to update authentication credentials.' });
      }
    }

    // Update passwordHash in users collection (used by local login)
    await db.collection('users').doc(uid).set({ passwordHash: newPassword }, { merge: true });

    // Invalidate the token so it cannot be reused
    delete tokens[token];
    writeTokens(tokens);

    console.log(`[ResetPassword] Password successfully reset for uid: ${uid}`);

    return res.status(200).json({
      success: true,
      message: 'Your password has been reset successfully. You can now sign in with your new password.',
    });

  } catch (error) {
    console.error('ResetPassword Controller Error:', error);
    return res.status(500).json({ success: false, message: 'An internal server error occurred.' });
  }
};
