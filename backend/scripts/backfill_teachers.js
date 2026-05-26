/**
 * Timetable Assistant: Teacher Profile Migration Script
 * 
 * Backfills existing teacher profiles by setting 'teachingId' to match 
 * their existing 'employeeId' if it is missing. Works for both Production Firebase 
 * and Local Development modes.
 */
const path = require('path');
const fs = require('fs');

// Load environment configurations
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { db, isFirebaseMode } = require('../src/config/firebase');

async function runBackfill() {
  console.log('----------------------------------------------------');
  console.log('  UOS TIMETABLE: LAUNCHING TEACHER BACKFILL SCRIPT  ');
  console.log('----------------------------------------------------');
  console.log(`Active Mode: ${isFirebaseMode ? 'Production (Firebase Firestore)' : 'Development (Local DB)'}`);

  if (isFirebaseMode) {
    try {
      console.log('Scanning production Firestore for teacher accounts...');
      const usersRef = db.collection('users');
      const snapshot = await usersRef.where('role', '==', 'teacher').get();

      if (snapshot.empty) {
        console.log('No teacher records found in production Firestore database. Migration complete.');
        return;
      }

      console.log(`Found ${snapshot.size} teacher records. Starting migration...`);
      let migratedCount = 0;

      for (const doc of snapshot.docs) {
        const userData = doc.data();
        if (!userData.teachingId && userData.employeeId) {
          console.log(`Migrating Profile: ${userData.fullName} (${userData.email})`);
          await usersRef.doc(doc.id).set({
            teachingId: userData.employeeId
          }, { merge: true });
          migratedCount++;
        }
      }

      console.log('----------------------------------------------------');
      console.log(`Migration completed successfully! Updated ${migratedCount} teacher profiles.`);
      console.log('----------------------------------------------------');
    } catch (err) {
      console.error('Fatal Error during Production Backfill:', err.message);
    }
  } else {
    try {
      console.log('Scanning Local mock database for teacher accounts...');
      const dataDir = path.join(__dirname, '..', 'data');
      const usersFile = path.join(dataDir, 'users.json');

      if (!fs.existsSync(usersFile)) {
        console.log('Local user registry is empty. Nothing to migrate.');
        return;
      }

      const users = JSON.parse(fs.readFileSync(usersFile, 'utf8') || '{}');
      let migratedCount = 0;

      for (const uid of Object.keys(users)) {
        const user = users[uid];
        // In local mock, profiles are nested under credentials
        if (user.role === 'teacher' || (user.profile && user.profile.role === 'teacher')) {
          if (!user.teachingId && user.employeeId) {
            console.log(`Migrating Local Profile: ${user.fullName || user.email}`);
            user.teachingId = user.employeeId;
            migratedCount++;
          }
        }
      }

      if (migratedCount > 0) {
        fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
      }

      console.log('----------------------------------------------------');
      console.log(`Local migration completed successfully! Updated ${migratedCount} teacher profiles.`);
      console.log('----------------------------------------------------');
    } catch (err) {
      console.error('Fatal Error during Local Backfill:', err.message);
    }
  }
}

runBackfill()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
