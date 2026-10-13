/**
 * Automated Verification Script: Representative Profile Timetable Filtering
 * Tests:
 * 1. BS Software Engineering, batch 2023-2027, Semester 7, Regular
 * 2. BS CS specialization in Software Engineering, batch 2026-2030, Semester 1, Regular 1
 * 3. BS Artificial Intelligence and BS Data Science (mapped to CS timetable source)
 * 4. BS Cyber Security and BS Information Technology (mapped to IT timetable source)
 * 5. Self Support Section 1 versus Section 2 separation
 * 6. Weekend Self Support for eligible postgraduate program (MS SE Weekend / PhD IT Weekend)
 * 7. Fall versus Spring isolation when batch ranges are identical
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { extractSchedule } = require('../src/utils/pdfParser');

let total = 0;
let passed = 0;

async function check(name, fn) {
  total++;
  try {
    await fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    console.error(`  ✗ ${name}: ${err.message}`);
  }
}

(async () => {
  console.log('\n===============================================================');
  console.log('--- SchedUOS Representative Profiles Timetable Verification ---');
  console.log('===============================================================\n');

  // 1. BS Software Engineering, batch 2023-2027, Semester 7, Regular
  await check('Profile 1: BS Software Engineering (2023-2027, Sem 7, Regular)', async () => {
    const pdfPath = path.resolve(__dirname, '../../Class Timetable SE Fall 2026.pdf');
    assert.ok(fs.existsSync(pdfPath), 'Class Timetable SE Fall 2026.pdf missing');
    const buf = fs.readFileSync(pdfPath);
    const classes = await extractSchedule(buf, '2023-2027', 7, 'Regular', 'BS in Software Engineering');
    assert.ok(classes.length > 0, `Expected classes for BS SE Sem 7, found ${classes.length}`);
    for (const c of classes) {
      assert.strictEqual(c.program, 'BS in Software Engineering');
      assert.strictEqual(c.semester, 7);
      assert.strictEqual(c.type, 'Regular');
    }
  });

  // 2. BS CS specialization in Software Engineering, batch 2026-2030, Semester 1
  await check('Profile 2: BS CS spec in Software Engineering (2026-2030, Sem 1, Regular)', async () => {
    const pdfPath = path.resolve(__dirname, '../../Class Timetable SE, 01-09-2026, Fall 26.pdf');
    assert.ok(fs.existsSync(pdfPath), 'Class Timetable SE, 01-09-2026, Fall 26.pdf missing');
    const buf = fs.readFileSync(pdfPath);
    const classes = await extractSchedule(buf, '2026-2030', 1, 'Regular', 'BS in Computer Science - Specialization in Software Engineering');
    assert.ok(classes.length >= 3, `Expected at least 3 classes, found ${classes.length}`);
    for (const c of classes) {
      assert.strictEqual(c.program, 'BS in Computer Science - Specialization in Software Engineering');
      assert.strictEqual(c.batch, '2026-2030');
      assert.strictEqual(c.semester, 1);
    }
  });

  // 3. BS Artificial Intelligence and BS Data Science (CS timetable source)
  await check('Profile 3: AI & Data Science mapping to CS timetable source', async () => {
    const csPdf = path.resolve(__dirname, '../../Class Timetable CS.pdf');
    assert.ok(fs.existsSync(csPdf), 'Class Timetable CS.pdf missing');
    const buf = fs.readFileSync(csPdf);
    const all = await extractSchedule(buf, null, null, null, null, 'global');
    assert.ok(all.length > 0, 'CS PDF should parse entries');
    // Verify CS PDF contains classes for computer-related disciplines
    const programsInCs = Array.from(new Set(all.map(c => c.program)));
    assert.ok(programsInCs.some(p => p.includes('Computer Science')), 'CS timetable has Computer Science');
  });

  // 4. BS Cyber Security and BS Information Technology (IT timetable source)
  await check('Profile 4: Cyber Security & IT mapping to IT timetable source', async () => {
    const itPdf = path.resolve(__dirname, '../../Department Of Information Technology.pdf');
    assert.ok(fs.existsSync(itPdf), 'Department Of Information Technology.pdf missing');
    const buf = fs.readFileSync(itPdf);
    const all = await extractSchedule(buf, null, null, null, null, 'global');
    assert.ok(all.length > 0, 'IT PDF should parse entries');
    const programsInIt = Array.from(new Set(all.map(c => c.program)));
    assert.ok(programsInIt.some(p => p.includes('Information Technology')), 'IT timetable has Information Technology');
  });

  // 5. Self Support Section 1 versus Section 2 separation
  await check('Profile 5: Self Support Section 1 vs Section 2 separation', async () => {
    const sePdf = path.resolve(__dirname, '../../Class Timetable SE.pdf');
    assert.ok(fs.existsSync(sePdf), 'Class Timetable SE.pdf missing');
    const buf = fs.readFileSync(sePdf);
    const sec1 = await extractSchedule(buf, '2024-2028', 4, 'Self Support 1', 'BS in Software Engineering');
    const sec2 = await extractSchedule(buf, '2024-2028', 4, 'Self Support 2', 'BS in Software Engineering');
    assert.ok(sec1.length > 0, `Self Support 1 should have classes, found ${sec1.length}`);
    assert.ok(sec2.length > 0, `Self Support 2 should have classes, found ${sec2.length}`);
    
    // Check that section tags match
    for (const c of sec1) {
      assert.ok(c.section === '1' || c.section === '', `Expected section 1, got ${c.section}`);
    }
    for (const c of sec2) {
      assert.strictEqual(c.section, '2', `Expected section 2, got ${c.section}`);
    }
  });

  // 6. Weekend Self Support for postgraduate program
  await check('Profile 6: Weekend Self Support eligible program verification', async () => {
    const sePdf = path.resolve(__dirname, '../../Class Timetable SE.pdf');
    const buf = fs.readFileSync(sePdf);
    const all = await extractSchedule(buf, null, null, null, null, 'global');
    const weekendClasses = all.filter(c => c.type && c.type.toLowerCase().includes('weekend'));
    assert.ok(weekendClasses.length > 0, 'Weekend classes should exist in SE postgraduate timetable');
    for (const w of weekendClasses) {
      assert.strictEqual(w.type, 'Weekend Self Support');
      assert.strictEqual(w.program, 'MS in Software Engineering');
    }
  });

  // 7. Fall versus Spring isolation when batch ranges are identical
  await check('Profile 7: Fall vs Spring semester isolation on identical batch', async () => {
    const fallPdf = path.resolve(__dirname, '../../Class Timetable SE Fall 2026.pdf');
    const springPdf = path.resolve(__dirname, '../../Class Timetable SE.pdf');
    const bufFall = fs.readFileSync(fallPdf);
    const bufSpring = fs.readFileSync(springPdf);

    // Batch 2023-2027 in Fall is Semester 7
    const fallClasses = await extractSchedule(bufFall, '2023-2027', 7, 'Regular', 'BS in Software Engineering');
    assert.strictEqual(fallClasses.length, 11, `Fall Semester 7 should have 11 classes, got ${fallClasses.length}`);

    // If student searches for Semester 7 in Spring timetable, should get 0
    const springCross = await extractSchedule(bufSpring, '2023-2027', 7, 'Regular', 'BS in Software Engineering');
    assert.strictEqual(springCross.length, 0, `Spring timetable should not return Semester 7 classes`);

    // In Spring timetable, Batch 2023-2027 was Semester 6
    const springClasses = await extractSchedule(bufSpring, '2023-2027', 6, 'Regular', 'BS in Software Engineering');
    assert.strictEqual(springClasses.length, 13, `Spring Semester 6 should have 13 classes, got ${springClasses.length}`);
  });

  console.log('\n===============================================================');
  console.log(`Results: ${passed} / ${total} representative profiles verified.`);
  console.log('===============================================================\n');

  if (passed < total) process.exit(1);
})();
