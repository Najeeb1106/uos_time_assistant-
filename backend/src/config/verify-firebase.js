require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const path = require('path');
const fs = require('fs');
const { db, auth, bucket, isFirebaseMode } = require('./firebase');

// ANSI Escape Codes for Rich Console Aesthetics
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const MAGENTA = '\x1b[35m';

async function runDiagnostics() {
  console.clear();
  console.log(`${CYAN}==================================================${RESET}`);
  console.log(`${BOLD}${MAGENTA}       UOS Timetable - Firebase Diagnostic Utility  ${RESET}`);
  console.log(`${CYAN}==================================================${RESET}`);

  // Mode status report
  if (isFirebaseMode) {
    let projectId = process.env.FIREBASE_PROJECT_ID;
    if (!projectId) {
      try {
        const serviceAccount = require('./firebase-key.json');
        projectId = serviceAccount.projectId;
      } catch (e) {}
    }
    console.log(`${BOLD}${GREEN}[✔] MODE:${RESET} Firebase Production Mode`);
    console.log(`${BOLD}${CYAN}[i] PROJECT ID:${RESET} ${projectId || 'Unknown (Loaded via Service Account Key)'}`);
  } else {
    console.log(`${BOLD}${YELLOW}[!] MODE:${RESET} Local Mock Database Mode`);
    console.log(`${BOLD}${CYAN}[i] CREDENTIALS:${RESET} firebase-key.json not found in backend/src/config/`);
    console.log(`${BOLD}${CYAN}[i] ENV:${RESET} FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY not set`);
    console.log(`\n${YELLOW}Note: The system is running offline local mock services.${RESET}`);
    console.log(`${YELLOW}To switch to real Firebase, add your credentials as detailed in SUCCESS_BLUEPRINT.md.${RESET}`);
  }
  console.log(`${CYAN}--------------------------------------------------${RESET}\n`);

  let firestoreOk = false;
  let authOk = false;
  let storageOk = false;

  // 1. FIRESTORE DATABASE DIAGNOSTICS
  console.log(`${BOLD}${CYAN}[1/3] Launching Firestore Database Check...${RESET}`);
  const docId = `verify_${Date.now()}`;
  const verifyDocRef = db.collection('_firebase_verification_').doc(docId);
  const testPayload = {
    verified: true,
    timestamp: new Date().toISOString(),
    utility: 'verify-firebase.js',
    message: 'Firestore integration check is completely successful!'
  };

  try {
    // Attempt Write
    process.stdout.write('   -> Attempting write operation... ');
    await verifyDocRef.set(testPayload);
    console.log(`${GREEN}OK${RESET}`);

    // Attempt Read
    process.stdout.write('   -> Attempting read operation... ');
    const readDoc = await verifyDocRef.get();
    if (readDoc.exists && readDoc.data().verified === true) {
      console.log(`${GREEN}OK${RESET}`);
    } else {
      throw new Error('Verification payload mismatch or document not found.');
    }

    // Attempt Delete
    process.stdout.write('   -> Attempting delete cleanup... ');
    await verifyDocRef.delete();
    console.log(`${GREEN}OK${RESET}`);

    console.log(`${GREEN}${BOLD}[✔] Firestore Database Integration: HEALTHY${RESET}\n`);
    firestoreOk = true;
  } catch (error) {
    console.log(`${RED}FAILED${RESET}`);
    console.log(`${RED}   Error Details: ${error.message}${RESET}`);
    console.log(`${YELLOW}   Possible Remedy:${RESET}`);
    console.log(`     - Ensure Cloud Firestore is enabled in your Firebase console.`);
    console.log(`     - Validate database settings (create Native database, not Datastore).`);
    console.log(`     - If in production mode, check that security rules allow server operations.`);
    console.log(`${RED}${BOLD}[✘] Firestore Database Integration: FAILED${RESET}\n`);
  }

  // 2. FIREBASE AUTHENTICATION DIAGNOSTICS
  console.log(`${BOLD}${CYAN}[2/3] Launching Firebase Authentication Check...${RESET}`);
  const testEmail = `verify.${Date.now()}@uos.edu.pk`;
  const testPass = 'verificationPassword123!';
  let createdUid = null;

  try {
    // Attempt Account Creation
    process.stdout.write('   -> Attempting mock-user creation... ');
    const userRecord = await auth.createUser({
      email: testEmail,
      password: testPass,
      displayName: 'Verification User'
    });
    createdUid = userRecord.uid;
    console.log(`${GREEN}OK${RESET} (uid: ${createdUid})`);

    // Attempt Account Lookup
    process.stdout.write('   -> Attempting user query by email... ');
    const queriedRecord = await auth.getUserByEmail(testEmail);
    if (queriedRecord && queriedRecord.email === testEmail) {
      console.log(`${GREEN}OK${RESET}`);
    } else {
      throw new Error('Queried user record mismatch.');
    }

    // Attempt Token Operations
    process.stdout.write('   -> Attempting session token signing... ');
    const customToken = await auth.createCustomToken(createdUid);
    if (customToken) {
      console.log(`${GREEN}OK${RESET}`);
    } else {
      throw new Error('Failed to generate session signature.');
    }

    // Clean up User Record
    process.stdout.write('   -> Attempting account deletion cleanup... ');
    // Handle either real Firebase Auth deleteUser or mock Auth delete logic
    if (isFirebaseMode) {
      const admin = require('firebase-admin');
      await admin.auth().deleteUser(createdUid);
    } else {
      // Local Mock DB Auth cleanup
      await db.collection('users').doc(createdUid).delete();
    }
    console.log(`${GREEN}OK${RESET}`);

    console.log(`${GREEN}${BOLD}[✔] Firebase Authentication Integration: HEALTHY${RESET}\n`);
    authOk = true;
  } catch (error) {
    console.log(`${RED}FAILED${RESET}`);
    console.log(`${RED}   Error Details: ${error.message}${RESET}`);
    console.log(`${YELLOW}   Possible Remedy:${RESET}`);
    console.log(`     - Ensure Authentication service is activated in your Firebase console.`);
    console.log(`     - Verify that the Email/Password sign-in provider is enabled.`);
    console.log(`${RED}${BOLD}[✘] Firebase Authentication Integration: FAILED${RESET}\n`);

    // Cleanup block if creation succeeded but subsequent checks failed
    if (createdUid) {
      try {
        if (isFirebaseMode) {
          const admin = require('firebase-admin');
          await admin.auth().deleteUser(createdUid);
        } else {
          await db.collection('users').doc(createdUid).delete();
        }
      } catch (e) {}
    }
  }

  // 3. CLOUD STORAGE BUCKET DIAGNOSTICS
  console.log(`${BOLD}${CYAN}[3/3] Launching Firebase Cloud Storage Check...${RESET}`);
  const storagePath = `_verification_/ping_${Date.now()}.txt`;
  
  try {
    // Attempt File Upload
    process.stdout.write('   -> Attempting buffer save to bucket... ');
    const fileRef = bucket.file(storagePath);
    await fileRef.save(Buffer.from('Firebase Storage is running perfectly under UOS Timetable App.', 'utf8'), {
      metadata: { contentType: 'text/plain' }
    });
    console.log(`${GREEN}OK${RESET}`);

    // Attempt File Metadata check / delete
    process.stdout.write('   -> Attempting storage cleanup... ');
    if (isFirebaseMode) {
      await fileRef.delete();
    } else {
      // Mock local bucket doesn't preserve files, just outputs log
    }
    console.log(`${GREEN}OK${RESET}`);

    console.log(`${GREEN}${BOLD}[✔] Firebase Cloud Storage Integration: HEALTHY${RESET}\n`);
    storageOk = true;
  } catch (error) {
    console.log(`${RED}FAILED${RESET}`);
    console.log(`${RED}   Error Details: ${error.message}${RESET}`);
    console.log(`${YELLOW}   Possible Remedy:${RESET}`);
    console.log(`     - Check if Cloud Storage is enabled in the Firebase console.`);
    console.log(`     - Check if default bucket name is correctly initialized.`);
    console.log(`     - Verify your service account permissions include Storage Admin (usually automatic).`);
    console.log(`${RED}${BOLD}[✘] Firebase Cloud Storage Integration: FAILED${RESET}\n`);
  }

  // FINAL DIAGNOSTIC SUMMARY DASHBOARD
  console.log(`${CYAN}==================================================${RESET}`);
  console.log(`${BOLD}${CYAN}            HEALTH DIAGNOSTIC RESULTS             ${RESET}`);
  console.log(`${CYAN}==================================================${RESET}`);
  
  console.log(`Firestore Database:   ${firestoreOk ? `${GREEN}${BOLD}HEALTHY ✔${RESET}` : `${RED}${BOLD}FAILED ✘${RESET}`}`);
  console.log(`Firebase Auth:        ${authOk ? `${GREEN}${BOLD}HEALTHY ✔${RESET}` : `${RED}${BOLD}FAILED ✘${RESET}`}`);
  console.log(`Cloud Storage Bucket: ${storageOk ? `${GREEN}${BOLD}HEALTHY ✔${RESET}` : `${RED}${BOLD}FAILED ✘${RESET}`}`);
  
  console.log(`${CYAN}==================================================${RESET}`);
  
  if (firestoreOk && authOk) {
    if (storageOk) {
      console.log(`${GREEN}${BOLD}🎉 SUCCESS: Your Firebase service layers are fully operational!${RESET}`);
    } else {
      console.log(`${GREEN}${BOLD}🎉 SUCCESS: Core UOS Timetable services are fully operational! (Firestore & Auth are HEALTHY)${RESET}`);
      console.log(`${YELLOW}Note: Cloud Storage is optional and only needed if storing raw PDF files in the cloud.${RESET}`);
      console.log(`${YELLOW}You can safely run the app on the free Spark plan using Firestore + Auth!${RESET}`);
    }
    if (!isFirebaseMode) {
      console.log(`${YELLOW}Note: Currently running under local mock storage. Ready for production!${RESET}`);
    }
  } else {
    console.log(`${RED}${BOLD}⚠ WARNING: Core integrations failed. Please resolve above issues.${RESET}`);
  }
  console.log(`${CYAN}==================================================${RESET}\n`);
}

runDiagnostics().catch(err => {
  console.error(`${RED}${BOLD}Critical failure running diagnostics:${RESET}`, err);
});
