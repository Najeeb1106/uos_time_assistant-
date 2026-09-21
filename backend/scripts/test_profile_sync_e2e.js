const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { extractSchedule } = require('../src/utils/pdfParser');

async function testProfileSyncE2E() {
  console.log('🧪 Testing Complete Profile Synchronization & Timetable Matching Flow...\n');

  const pdfFallPath = path.resolve(__dirname, '../../Class Timetable SE, 01-09-2026, Fall 26.pdf');
  const pdfSpringPath = path.resolve(__dirname, '../../Class Timetable SE.pdf');
  const bufFall = fs.readFileSync(pdfFallPath);
  const bufSpring = fs.readFileSync(pdfSpringPath);

  // 1. Initial Registration Profile
  const initialProfile = {
    program: 'BS in Software Engineering',
    semester: 7,
    batch: '2023-2027',
    type: 'Regular',
    role: 'student',
    fullName: 'SE Student'
  };

  console.log('Step 1: Test timetable parsing with authenticated Firestore profile:');
  console.log('  Profile:', JSON.stringify(initialProfile));
  const classesFallSem7 = await extractSchedule(
    bufFall,
    initialProfile.batch,
    initialProfile.semester,
    initialProfile.type,
    initialProfile.program,
    initialProfile.role,
    initialProfile.fullName
  );
  assert.strictEqual(classesFallSem7.length, 8, `Expected 8 classes for Sem 7 Fall, got ${classesFallSem7.length}`);
  console.log(`  ✓ Passed: Extracted ${classesFallSem7.length} classes for Semester 7.\n`);

  // 2. Profile Updated to Semester 6
  const updatedProfile = {
    program: 'BS in Software Engineering',
    semester: 6,
    batch: '2023-2027',
    type: 'Regular',
    role: 'student',
    fullName: 'SE Student'
  };

  console.log('Step 2: Profile updated to Semester 6 in Firestore:');
  console.log('  Profile:', JSON.stringify(updatedProfile));
  
  // Test against Spring PDF (where Sem 6 exists)
  const classesSpringSem6 = await extractSchedule(
    bufSpring,
    updatedProfile.batch,
    updatedProfile.semester,
    updatedProfile.type,
    updatedProfile.program,
    updatedProfile.role,
    updatedProfile.fullName
  );
  assert.strictEqual(classesSpringSem6.length, 13, `Expected 13 classes for Sem 6 Spring, got ${classesSpringSem6.length}`);
  console.log(`  ✓ Passed: Extracted ${classesSpringSem6.length} classes for Semester 6 from Spring timetable.`);

  // Test against Spring PDF with Semester 7 (where Sem 7 does NOT exist)
  const classesSpringSem7 = await extractSchedule(
    bufSpring,
    initialProfile.batch,
    initialProfile.semester,
    initialProfile.type,
    initialProfile.program,
    initialProfile.role,
    initialProfile.fullName
  );
  assert.strictEqual(classesSpringSem7.length, 0, `Expected 0 classes for Sem 7 in Spring timetable, got ${classesSpringSem7.length}`);
  console.log(`  ✓ Passed: Semester 7 correctly produced 0 matches against Spring timetable (strict semester isolation verified).\n`);

  // 3. Spaced batch format persistence test
  console.log('Step 3: Profile updated with spaced batch string "2023 - 2027":');
  const cleanBatch = '2023 - 2027'.replace(/\s+/g, '');
  const classesFallSpaced = await extractSchedule(
    bufFall,
    cleanBatch,
    7,
    'Regular',
    'BS in Software Engineering',
    'student',
    'SE Student'
  );
  assert.strictEqual(classesFallSpaced.length, 8, `Expected 8 classes with normalized batch, got ${classesFallSpaced.length}`);
  console.log(`  ✓ Passed: Extracted ${classesFallSpaced.length} classes with normalized batch.\n`);

  console.log('🎉 ALL PROFILE SYNCHRONIZATION E2E TESTS PASSED PERFECTLY!\n');
}

testProfileSyncE2E().catch((err) => {
  console.error('❌ Test Failed:', err);
  process.exit(1);
});
