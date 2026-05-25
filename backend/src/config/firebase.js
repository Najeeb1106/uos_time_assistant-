const path = require('path');
const fs = require('fs');

let db;
let auth;
let bucket;
let isFirebaseMode = false;

// Check if firebase-key.json exists in this folder or if environment variables are set
const keyPath = path.join(__dirname, 'firebase-key.json');
const hasFirebaseKey = fs.existsSync(keyPath);
const hasEnvConfig = process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY;

if (hasFirebaseKey || hasEnvConfig) {
  try {
    const admin = require('firebase-admin');
    let serviceAccount;
    if (hasFirebaseKey) {
      serviceAccount = require('./firebase-key.json');
    } else {
      let privateKey = process.env.FIREBASE_PRIVATE_KEY.trim();
      // Remove any surrounding double quotes that might have been pasted
      if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
        privateKey = privateKey.substring(1, privateKey.length - 1);
      }
      serviceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey.replace(/\\n/g, '\n')
      };
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: `${serviceAccount.projectId || process.env.FIREBASE_PROJECT_ID}.appspot.com`
    });

    db = admin.firestore();
    auth = admin.auth();
    bucket = admin.storage().bucket();
    isFirebaseMode = true;
    console.log('Firebase Admin initialized successfully (Firebase Production Mode)');
  } catch (error) {
    console.error('Failed to initialize Firebase Admin, falling back to Local Mode:', error.message);
  }
}

if (!isFirebaseMode) {
  console.log('Firebase credentials not found. Initializing Local Mock Database (Local Mode)');
  
  // Make sure data directory exists
  const dataDir = path.join(__dirname, '..', '..', 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const usersFile = path.join(dataDir, 'users.json');
  const schedulesFile = path.join(dataDir, 'schedules.json');

  // Initialize files if not existing
  if (!fs.existsSync(usersFile)) fs.writeFileSync(usersFile, '{}');
  if (!fs.existsSync(schedulesFile)) fs.writeFileSync(schedulesFile, '{}');

  const readJSON = (filePath) => {
    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf8') || '{}');
    } catch (e) {
      return {};
    }
  };

  const writeJSON = (filePath, data) => {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  };

  // Mock Database Client
  db = {
    collection: (colName) => {
      const filePath = colName === 'users' ? usersFile : schedulesFile;
      return {
        doc: (docId) => {
          return {
            get: async () => {
              const data = readJSON(filePath);
              const docData = data[docId];
              return {
                exists: !!docData,
                data: () => docData
              };
            },
            set: async (newVal) => {
              const data = readJSON(filePath);
              // Store user data or schedule details appropriately
              data[docId] = { ...data[docId], ...newVal };
              writeJSON(filePath, data);
              return { success: true };
            },
            delete: async () => {
              const data = readJSON(filePath);
              delete data[docId];
              writeJSON(filePath, data);
              return { success: true };
            }
          };
        }
      };
    }
  };

  // Mock Auth Client
  const jwt = require('jsonwebtoken');
  const JWT_SECRET = process.env.JWT_SECRET || 'uos-timetable-development-secret-key';
  
  auth = {
    createUser: async ({ email, password }) => {
      const users = readJSON(usersFile);
      // Check if user already exists
      const userExists = Object.values(users).some(u => u.email === email);
      if (userExists) {
        throw new Error('The email address is already in use by another account.');
      }
      const uid = 'usr_' + Math.random().toString(36).substring(2, 11);
      users[uid] = { uid, email, password, profile: {} };
      writeJSON(usersFile, users);
      return { uid, email };
    },
    getUserByEmail: async (email) => {
      const users = readJSON(usersFile);
      const user = Object.values(users).find(u => u.email === email);
      if (!user) {
        throw new Error('There is no user record corresponding to this identifier.');
      }
      return user;
    },
    createCustomToken: async (uid) => {
      // Sign standard JWT
      return jwt.sign({ uid }, JWT_SECRET, { expiresIn: '7d' });
    },
    verifyIdToken: async (token) => {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        return { uid: decoded.uid };
      } catch (err) {
        throw new Error('ID token verification failed (Local verification): ' + err.message);
      }
    }
  };

  bucket = {
    file: (fileName) => {
      return {
        save: async (buffer) => {
          console.log(`Local Mode: Mock-saved uploaded file to storage: ${fileName} (${buffer.length} bytes)`);
          return true;
        }
      };
    }
  };
}

module.exports = { db, auth, bucket, isFirebaseMode };
