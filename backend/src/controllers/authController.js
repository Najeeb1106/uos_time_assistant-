const { db, auth, isFirebaseMode } = require('../config/firebase');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'uos-timetable-development-secret-key';

/**
 * Register a new student profile and create user auth record
 */
exports.register = async (req, res) => {
  try {
    const { email, password, fullName, program, type, batch, semester, role = 'student', department, designation, employeeId, facultyKey } = req.body;

    if (role === 'student') {
      if (!email || !password || !fullName || !program || !type || !batch || !semester) {
        return res.status(400).json({
          success: false,
          message: 'Please fill in all required fields.'
        });
      }
    } else {
      if (!email || !password || !fullName || !department || !designation || !employeeId || !facultyKey) {
        return res.status(400).json({
          success: false,
          message: 'Please fill in all required fields, including Faculty ID, Department, Designation, and Faculty Key.'
        });
      }

      const expectedKey = process.env.FACULTY_SECRET_KEY || 'UOS_FACULTY_2026';
      if (facultyKey !== expectedKey) {
        return res.status(400).json({
          success: false,
          message: 'Invalid Faculty Security Access Key. Please contact department administration.'
        });
      }
    }

    if (!email.endsWith('@uos.edu.pk')) {
      return res.status(400).json({
        success: false,
        message: 'Registration requires a valid university email address (@uos.edu.pk).'
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
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.'
      });
    }

    let userRecord;
    let uid;

    if (isFirebaseMode) {
      // Firebase Mode: Search Firestore for user with this email
      try {
        const usersRef = db.collection('users');
        // Simple scan in Firestore: since we want to support password checks on custom endpoints
        // we retrieve the document where email matches
        // In Firestore, we would normally use query:
        const snapshot = await usersRef.where('email', '==', email).get();
        if (snapshot.empty) {
          return res.status(401).json({
            success: false,
            message: 'Invalid credentials. User not found.'
          });
        }
        const userDoc = snapshot.docs[0];
        userRecord = userDoc.data();
        uid = userDoc.id;
      } catch (err) {
        console.error('Firebase Auth Login Database Scan Error:', err.message);
        // Fallback search using user email
        try {
          const authUser = await auth.getUserByEmail(email);
          uid = authUser.uid;
          const doc = await db.collection('users').doc(uid).get();
          if (doc.exists) {
            userRecord = doc.data();
          }
        } catch (e) {
          // If no doc
        }
      }
    } else {
      // Local Mode: Find user via mock auth getUserByEmail
      try {
        const mockUser = await auth.getUserByEmail(email);
        uid = mockUser.uid;
        const doc = await db.collection('users').doc(uid).get();
        if (doc.exists) {
          userRecord = doc.data();
        }
      } catch (err) {
        console.error('Local Auth Login Error:', err.message);
      }
    }

    if (!userRecord) {
      return res.status(401).json({
        success: false,
        message: 'No user record found corresponding to this email.'
      });
    }

    // Verify password match
    if (userRecord.passwordHash !== password) {
      return res.status(401).json({
        success: false,
        message: 'Authentication failed. Incorrect security password.'
      });
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

