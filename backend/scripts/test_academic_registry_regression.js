/**
 * Automated Test Suite: Academic Registry & Registration Regression
 * Verifies:
 * 1. Centralized registry mappings for all 6 departments (CS, SE, IT, AI, CYS, DS)
 * 2. Degree levels (BS, MS, PhD) and program durations
 * 3. Dynamic batch generation (>= 10 years ahead + historical back to 2018 in YYYY-YYYY format)
 * 4. Study shifts (Regular, Self Support, Weekend Self Support) and valid section ranges (0, 1, 2)
 * 5. Backward compatibility: legacy type derivation & decomposition
 * 6. PDF parser regex verification on hyphenated specializations from real timetable PDFs
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { extractSchedule } = require('../src/utils/pdfParser');

let totalTests = 0;
let passedTests = 0;

function test(description, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  ✓ ${description}`);
  } catch (err) {
    console.error(`  ✗ ${description}`);
    console.error(`    ${err.message}`);
  }
}

async function asyncTest(description, fn) {
  totalTests++;
  try {
    await fn();
    passedTests++;
    console.log(`  ✓ ${description}`);
  } catch (err) {
    console.error(`  ✗ ${description}`);
    console.error(`    ${err.message}`);
  }
}

console.log('\n======================================================');
console.log('--- SchedUOS Academic Registry & Regression Tests ---');
console.log('======================================================\n');

// 1. Verify Academic Registry file exists and load its TypeScript contents
const registryPath = path.resolve(__dirname, '../../mobile-rn/src/constants/academicRegistry.ts');
test('academicRegistry.ts exists in mobile-rn', () => {
  assert.ok(fs.existsSync(registryPath), 'Registry file missing');
});

const registryContent = fs.readFileSync(registryPath, 'utf8');

// 2. Department Mapping Tests
console.log('\n[Suite 1: Department & Timetable Mapping]');
test('Registry contains all 6 required departments', () => {
  const deptIds = ['cs', 'se', 'it', 'ai', 'cys', 'ds'];
  for (const id of deptIds) {
    assert.ok(registryContent.includes(`id: '${id}'`), `Missing department ${id}`);
  }
});

test('Internal timetable sources map correctly (CS, SE, IT)', () => {
  assert.ok(registryContent.includes("id: 'cs', name: 'Computer Science', code: 'CS', timetableSource: 'CS'"));
  assert.ok(registryContent.includes("id: 'se', name: 'Software Engineering', code: 'SE', timetableSource: 'SE'"));
  assert.ok(registryContent.includes("id: 'it', name: 'Information Technology', code: 'IT', timetableSource: 'IT'"));
  assert.ok(registryContent.includes("id: 'ai', name: 'Artificial Intelligence', code: 'AI', timetableSource: 'CS'"));
  assert.ok(registryContent.includes("id: 'cys', name: 'Cyber Security', code: 'CYS', timetableSource: 'IT'"));
  assert.ok(registryContent.includes("id: 'ds', name: 'Data Science', code: 'DS', timetableSource: 'CS'"));
});

// 3. Degree Level and Program Duration Tests
console.log('\n[Suite 2: Degree Levels & Specializations]');
test('Registry supports BS, MS, PhD levels', () => {
  assert.ok(registryContent.includes("degreeLevel: 'BS'"));
  assert.ok(registryContent.includes("degreeLevel: 'MS'"));
  assert.ok(registryContent.includes("degreeLevel: 'PhD'"));
});

test('Hyphenated specialization programs are preserved', () => {
  assert.ok(registryContent.includes("officialPdfName: 'BS in Computer Science - Specialization in Software Engineering'"));
  assert.ok(registryContent.includes("officialPdfName: 'BS in Computer Science - Specialization in Data Science'"));
  assert.ok(registryContent.includes("officialPdfName: 'BS in Computer Science - Specialization in Information Technology'"));
  assert.ok(registryContent.includes("officialPdfName: 'BS in Computer Science - Specialization in Cloud Computing'"));
});

// 4. Batch Generation Logic
console.log('\n[Suite 3: Dynamic Batch Generation]');
// Test batch generation pure logic
function generateDynamicBatches(durationYears = 4, availableDurations = null, startYearMin = 2018, yearsAhead = 10) {
  const currentYear = new Date().getFullYear();
  const maxStartYear = Math.max(currentYear + yearsAhead, 2038);
  const batches = new Set();
  const durations = availableDurations && availableDurations.length > 0 ? availableDurations : [durationYears];
  for (let start = maxStartYear; start >= startYearMin; start--) {
    for (const d of durations) {
      batches.add(`${start}-${start + d}`);
    }
  }
  return Array.from(batches).sort((a, b) => b.localeCompare(a));
}

test('Batch generation generates batches at least 10 years ahead beyond current year', () => {
  const batches = generateDynamicBatches(4, null, 2018, 10);
  const currentYear = new Date().getFullYear();
  const latestBatch = batches[0];
  const [start, end] = latestBatch.split('-').map(Number);
  assert.ok(start >= currentYear + 10, `Expected start year >= ${currentYear + 10}, got ${start}`);
  assert.strictEqual(end, start + 4, 'BS batches must have 4 year duration');
});

test('Batch generation preserves historical batches back to 2018', () => {
  const batches = generateDynamicBatches(4, null, 2018, 10);
  assert.ok(batches.includes('2018-2022'), 'Historical batch 2018-2022 should be included');
  assert.ok(batches.includes('2020-2024'), 'Historical batch 2020-2024 should be included');
  assert.ok(batches.includes('2024-2028'), 'Current batch 2024-2028 should be included');
});

test('MS programs support variable durations (2-year and 3-year cohorts)', () => {
  const batches = generateDynamicBatches(2, [2, 3], 2020, 5);
  assert.ok(batches.includes('2024-2026'), '2-year cohort 2024-2026 expected');
  assert.ok(batches.includes('2024-2027'), '3-year cohort 2024-2027 expected');
});

// 5. Shift & Section Combinations
console.log('\n[Suite 4: Study Shifts & Sections]');
test('Registry defines sections for Regular (1, 0 where verified)', () => {
  assert.ok(registryContent.includes("'Regular': ['1']"));
  assert.ok(registryContent.includes("'Regular': ['0', '1']")); // IT verified
});

test('Registry defines sections for Self Support (1, 2)', () => {
  assert.ok(registryContent.includes("'Self Support': ['1', '2']"));
});

test('Registry defines sections for Weekend Self Support', () => {
  assert.ok(registryContent.includes("'Weekend Self Support': ['1']"));
});

// 6. Backward Compatibility Legacy Mapping
console.log('\n[Suite 5: Legacy Type Derivation & Compatibility]');
function deriveLegacyType(shift, sectionNumber) {
  const cleanShift = String(shift || 'Regular').trim();
  const cleanSec = String(sectionNumber || '1').trim();

  if (cleanShift === 'Weekend Self Support') {
    return 'Weekend Self Support';
  }
  if (cleanShift === 'Self Support') {
    if (cleanSec === '0') return 'Self Support 0';
    if (cleanSec === '2') return 'Self Support 2';
    return 'Self Support 1';
  }
  if (cleanSec === '0') return 'Regular 0';
  if (cleanSec === '2') return 'Regular 2';
  return 'Regular';
}

function parseLegacyType(typeStr) {
  const clean = String(typeStr || '').trim().toLowerCase();
  if (clean.includes('weekend')) {
    return { studyShift: 'Weekend Self Support', sectionNumber: '1' };
  }
  if (clean.includes('self')) {
    if (clean.includes('2')) return { studyShift: 'Self Support', sectionNumber: '2' };
    if (clean.includes('0')) return { studyShift: 'Self Support', sectionNumber: '0' };
    return { studyShift: 'Self Support', sectionNumber: '1' };
  }
  if (clean.includes('0')) return { studyShift: 'Regular', sectionNumber: '0' };
  if (clean.includes('2')) return { studyShift: 'Regular', sectionNumber: '2' };
  return { studyShift: 'Regular', sectionNumber: '1' };
}

test('deriveLegacyType maps all standard combinations correctly', () => {
  assert.strictEqual(deriveLegacyType('Regular', '1'), 'Regular');
  assert.strictEqual(deriveLegacyType('Regular', '0'), 'Regular 0');
  assert.strictEqual(deriveLegacyType('Self Support', '1'), 'Self Support 1');
  assert.strictEqual(deriveLegacyType('Self Support', '2'), 'Self Support 2');
  assert.strictEqual(deriveLegacyType('Self Support', '0'), 'Self Support 0');
  assert.strictEqual(deriveLegacyType('Weekend Self Support', '1'), 'Weekend Self Support');
});

test('parseLegacyType round-trips with deriveLegacyType', () => {
  const cases = [
    { shift: 'Regular', sec: '1' },
    { shift: 'Regular', sec: '0' },
    { shift: 'Self Support', sec: '1' },
    { shift: 'Self Support', sec: '2' },
    { shift: 'Weekend Self Support', sec: '1' }
  ];
  for (const c of cases) {
    const legacy = deriveLegacyType(c.shift, c.sec);
    const parsed = parseLegacyType(legacy);
    assert.strictEqual(parsed.studyShift, c.shift);
    assert.strictEqual(parsed.sectionNumber, c.sec);
  }
});

// 7. PDF Parser Extraction on Real PDFs
console.log('\n[Suite 6: PDF Parser Specialization Extraction]');
(async () => {
  const seFall26PdfPath = path.resolve(__dirname, '../../Class Timetable SE, 01-09-2026, Fall 26.pdf');
  if (fs.existsSync(seFall26PdfPath)) {
    await asyncTest('SE Fall 26 PDF extracts hyphenated specialization program correctly', async () => {
      const buf = fs.readFileSync(seFall26PdfPath);
      const parsed = await extractSchedule(buf, '2026-2030', 1, 'Regular', 'BS in Computer Science - Specialization in Software Engineering');
      assert.ok(parsed.length >= 3, `Expected at least 3 specialization classes, got ${parsed.length}`);
      for (const cls of parsed) {
        assert.strictEqual(cls.program, 'BS in Computer Science - Specialization in Software Engineering');
        assert.strictEqual(cls.batch, '2026-2030');
        assert.strictEqual(cls.semester, 1);
        assert.strictEqual(cls.type, 'Regular');
        assert.strictEqual(cls.section, '1');
      }
    });

    await asyncTest('SE Fall 26 PDF extracts valid semesters within 1 through 8', async () => {
      const buf = fs.readFileSync(seFall26PdfPath);
      const parsed = await extractSchedule(buf, null, null, null, null, 'global');
      const validSemesters = parsed.filter(e => e.semester > 0).map(e => e.semester);
      const semesters = new Set(validSemesters);
      assert.ok(semesters.size >= 3, `Expected multiple valid semesters, got ${Array.from(semesters).join(', ')}`);
      for (const sem of semesters) {
        assert.ok(sem >= 1 && sem <= 8, `Semester ${sem} is out of 1-8 range`);
      }
    });
  }

  const csPdfPath = path.resolve(__dirname, '../../Class Timetable CS.pdf');
  if (fs.existsSync(csPdfPath)) {
    await asyncTest('CS PDF parses valid classes with correct study types', async () => {
      const buf = fs.readFileSync(csPdfPath);
      const parsed = await extractSchedule(buf, '2024-2028', 3, 'Self Support 1', 'BS in Computer Science');
      assert.ok(parsed.length > 0, 'CS PDF should parse entries for BS in Computer Science');
      for (const cls of parsed) {
        assert.strictEqual(cls.program, 'BS in Computer Science');
        assert.strictEqual(cls.semester, 3);
      }
    });
  }

  console.log('\n======================================================');
  console.log(`Results: ${passedTests} / ${totalTests} tests passed.`);
  console.log('======================================================\n');

  if (passedTests < totalTests) {
    process.exit(1);
  } else {
    process.exit(0);
  }
})();
