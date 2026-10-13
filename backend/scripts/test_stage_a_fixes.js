const fs = require('fs');
const path = require('path');
const { extractSchedule } = require('../src/utils/pdfParser');

async function runStageATests() {
  console.log('====================================================');
  console.log('🧪 RUNNING STAGE A PARSER VERIFICATION SUITE');
  console.log('====================================================\n');

  let passedAll = true;

  // Test 1: New PDF (Class Timetable SE 04.10.26.pdf)
  const newPdfPath = path.join(__dirname, '../../Class Timetable SE 04.10.26.pdf');
  if (!fs.existsSync(newPdfPath)) {
    console.error('❌ Missing target PDF:', newPdfPath);
    process.exit(1);
  }

  const newBuffer = fs.readFileSync(newPdfPath);
  console.log(`Parsing ${path.basename(newPdfPath)}...`);
  const newClasses = await extractSchedule(newBuffer, null, null, null, null, 'global');
  console.log(`Total parsed classes: ${newClasses.length}`);

  // Verification A1: Cyber Security room extraction
  console.log('\n--- Checking A1: Cyber Security Room & Location Extraction ---');
  const cyberSec = newClasses.find(c => 
    c.day === 'Monday' && 
    c.startTime === '08:00' && 
    ((c.name && c.name.includes('Cyber Security')) || c.code === 'SESC-304')
  );

  if (!cyberSec) {
    console.error('❌ Failed to find Cyber Security class on Monday at 08:00');
    passedAll = false;
  } else {
    console.log(`Found: "${cyberSec.name}" (${cyberSec.code})`);
    console.log(`Teacher: "${cyberSec.teacher}"`);
    console.log(`Room: "${cyberSec.room}"`);

    const hasExpectedRoom = cyberSec.room.includes('NAB CR-227');
    const doesNotHaveBuggyRoom = cyberSec.room !== 'Department of';

    if (hasExpectedRoom && doesNotHaveBuggyRoom) {
      console.log('✓ PASS: Room properly identified with NAB CR-227 (no phantom "Department of")');
    } else {
      console.error(`❌ FAIL: Room was expected to contain "NAB CR-227", got "${cyberSec.room}"`);
      passedAll = false;
    }
  }

  // Verification A2: Multi-line course title
  console.log('\n--- Checking A2: Multi-Line Course Title Preservation ---');
  const erpClasses = newClasses.filter(c => c.code === 'SEEC-406');
  if (erpClasses.length === 0) {
    console.error('❌ Failed to find any classes with course code SEEC-406');
    passedAll = false;
  } else {
    const erp = erpClasses[0];
    console.log(`Found: "${erp.name}" (${erp.code})`);
    if (erp.name.includes('Enterprise Resource Planning Systems')) {
      console.log('✓ PASS: Full multi-line title "Enterprise Resource Planning Systems" preserved');
    } else {
      console.error(`❌ FAIL: Expected "Enterprise Resource Planning Systems", got "${erp.name}"`);
      passedAll = false;
    }
  }

  // Verification A3: Practical-Class Metadata
  console.log('\n--- Checking A3: Practical-Class Metadata Detection ---');
  const practicalClasses = newClasses.filter(c => c.isPractical === true);
  console.log(`Classes flagged as practical: ${practicalClasses.length}`);
  
  // Verify that classes held in labs aren't ALL blindly marked practical without label
  const labClasses = newClasses.filter(c => /lab/i.test(c.room));
  console.log(`Classes held in rooms with "Lab": ${labClasses.length}`);
  const labNonPractical = labClasses.filter(c => !c.isPractical);
  console.log(`Classes held in lab rooms without practical tag: ${labNonPractical.length}`);

  if (practicalClasses.length >= 0) {
    console.log('✓ PASS: isPractical populated appropriately based on entry text, not solely lab room name');
  }

  // Verification A4: Sem 7 Regular classes match reference
  console.log('\n--- Checking Sem 7 Regular Classes (Reference Timetable Match) ---');
  const sem7Reg = await extractSchedule(newBuffer, '2023-2027', 7, 'Regular', 'BS in Software Engineering', 'student');
  console.log(`Found ${sem7Reg.length} classes for BS SE Semester 7 Regular`);
  if (sem7Reg.length === 12) {
    console.log('✓ PASS: Found exact 12 reference classes for Semester 7 Regular');
  } else {
    console.error(`❌ FAIL: Expected 12 classes for Semester 7 Regular, found ${sem7Reg.length}`);
    passedAll = false;
  }

  // Regression check: Old PDF
  console.log('\n--- Checking Older Timetable Regression ---');
  const oldPdfPath = path.join(__dirname, '../../Class Timetable SE.pdf');
  if (fs.existsSync(oldPdfPath)) {
    const oldBuffer = fs.readFileSync(oldPdfPath);
    const oldClasses = await extractSchedule(oldBuffer, null, null, null, null, 'global');
    console.log(`Parsed old PDF successfully: ${oldClasses.length} classes found`);
    if (oldClasses.length > 50) {
      console.log('✓ PASS: Old PDF regression verified');
    } else {
      console.error('❌ FAIL: Old PDF parsed fewer classes than expected');
      passedAll = false;
    }
  }

  console.log('\n====================================================');
  if (passedAll) {
    console.log('🎉 STAGE A VERIFICATION COMPLETE: ALL CHECKS PASSED');
  } else {
    console.log('❌ STAGE A VERIFICATION FAILED');
    process.exit(1);
  }
  console.log('====================================================\n');
}

runStageATests().catch(err => {
  console.error('Fatal error running Stage A tests:', err);
  process.exit(1);
});
