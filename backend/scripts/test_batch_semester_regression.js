const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { extractSchedule } = require('../src/utils/pdfParser');

async function runRegressionTests() {
  console.log('🚀 Running Batch & Semester Normalization Regression Suite...\n');

  const pdfFallPath = path.resolve(__dirname, '../../Class Timetable SE, 01-09-2026, Fall 26.pdf');
  const pdfSpringPath = path.resolve(__dirname, '../../Class Timetable SE.pdf');

  if (!fs.existsSync(pdfFallPath)) {
    throw new Error(`Fall PDF not found at ${pdfFallPath}`);
  }
  if (!fs.existsSync(pdfSpringPath)) {
    throw new Error(`Spring PDF not found at ${pdfSpringPath}`);
  }

  const bufFall = fs.readFileSync(pdfFallPath);
  const bufSpring = fs.readFileSync(pdfSpringPath);

  // Case A: Fall 2026 PDF with standard batch "2023-2027", semester 7
  console.log('Test A: Fall 2026 PDF, batch = "2023-2027", semester = 7, Regular');
  const resA = await extractSchedule(bufFall, '2023-2027', 7, 'Regular', 'BS in Software Engineering', 'student');
  assert.strictEqual(resA.length, 8, `Expected 8 classes, got ${resA.length}`);
  console.log(`  ✓ Passed: Found ${resA.length} classes.`);

  // Case B: Fall 2026 PDF with spaced batch "2023 - 2027"
  console.log('\nTest B: Fall 2026 PDF, batch = "2023 - 2027", semester = 7, Regular');
  const resB = await extractSchedule(bufFall, '2023 - 2027', 7, 'Regular', 'BS in Software Engineering', 'student');
  assert.strictEqual(resB.length, 8, `Expected 8 classes, got ${resB.length}`);
  console.log(`  ✓ Passed: Found ${resB.length} classes.`);

  // Case C: Fall 2026 PDF with trailing space batch "2023- 2027"
  console.log('\nTest C: Fall 2026 PDF, batch = "2023- 2027", semester = 7, Regular');
  const resC = await extractSchedule(bufFall, '2023- 2027', 7, 'Regular', 'BS in Software Engineering', 'student');
  assert.strictEqual(resC.length, 8, `Expected 8 classes, got ${resC.length}`);
  console.log(`  ✓ Passed: Found ${resC.length} classes.`);

  // Case D: Fall 2026 PDF with leading space batch "2023 -2027"
  console.log('\nTest D: Fall 2026 PDF, batch = "2023 -2027", semester = 7, Regular');
  const resD = await extractSchedule(bufFall, '2023 -2027', 7, 'Regular', 'BS in Software Engineering', 'student');
  assert.strictEqual(resD.length, 8, `Expected 8 classes, got ${resD.length}`);
  console.log(`  ✓ Passed: Found ${resD.length} classes.`);

  // Case E: Spring/old PDF with batch "2023-2027", semester 7 (must NOT match semester 6)
  console.log('\nTest E: Spring/old PDF, batch = "2023-2027", semester = 7, Regular');
  const resE = await extractSchedule(bufSpring, '2023-2027', 7, 'Regular', 'BS in Software Engineering', 'student');
  assert.strictEqual(resE.length, 0, `Expected 0 classes for Semester 7 in Spring PDF, got ${resE.length}`);
  console.log(`  ✓ Passed: Found ${resE.length} classes (no accidental cross-semester match).`);

  // Case F: Spring/old PDF with batch "2023-2027", semester 6 (must match Semester 6)
  console.log('\nTest F: Spring/old PDF, batch = "2023-2027", semester = 6, Regular');
  const resF = await extractSchedule(bufSpring, '2023-2027', 6, 'Regular', 'BS in Software Engineering', 'student');
  assert.strictEqual(resF.length, 13, `Expected 13 classes for Semester 6 in Spring PDF, got ${resF.length}`);
  console.log(`  ✓ Passed: Found ${resF.length} classes for Semester 6.`);

  // Additional Case G: String semester "7"
  console.log('\nTest G: Fall 2026 PDF with string semester "7"');
  const resG = await extractSchedule(bufFall, '2023-2027', '7', 'Regular', 'BS in Software Engineering', 'student');
  assert.strictEqual(resG.length, 8, `Expected 8 classes, got ${resG.length}`);
  console.log(`  ✓ Passed: Found ${resG.length} classes.`);

  // Additional Case H: String semester "Semester 7"
  console.log('\nTest H: Fall 2026 PDF with string semester "Semester 7"');
  const resH = await extractSchedule(bufFall, '2023-2027', 'Semester 7', 'Regular', 'BS in Software Engineering', 'student');
  assert.strictEqual(resH.length, 8, `Expected 8 classes, got ${resH.length}`);
  console.log(`  ✓ Passed: Found ${resH.length} classes.`);

  // Additional Case I: String semester "Semester#7"
  console.log('\nTest I: Fall 2026 PDF with string semester "Semester#7"');
  const resI = await extractSchedule(bufFall, '2023-2027', 'Semester#7', 'Regular', 'BS in Software Engineering', 'student');
  assert.strictEqual(resI.length, 8, `Expected 8 classes, got ${resI.length}`);
  console.log(`  ✓ Passed: Found ${resI.length} classes.`);

  console.log('\n🎉 ALL REGRESSION TESTS PASSED PERFECTLY!\n');
}

runRegressionTests().catch((err) => {
  console.error('\n❌ Regression Test Failed:', err);
  process.exit(1);
});
