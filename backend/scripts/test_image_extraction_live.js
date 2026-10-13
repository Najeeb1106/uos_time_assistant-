const assert = require('assert');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { parseTimetableImage, ALLOWED_MIME_TYPES } = require('../src/services/imageParserService');

async function testImageExtraction() {
  console.log('====================================================');
  console.log('🧪 TESTING GENUINE IMAGE TIMETABLE EXTRACTION');
  console.log('====================================================\n');

  // Test 1: Real Image Extraction on new method.jpeg
  const imagePath = path.resolve(__dirname, '../../new method.jpeg');
  assert.ok(fs.existsSync(imagePath), 'new method.jpeg must exist');

  const imageBuffer = fs.readFileSync(imagePath);
  console.log(`Loaded real image: ${path.basename(imagePath)} (${imageBuffer.length} bytes).`);

  const studentProfile = {
    program: 'BS in Software Engineering',
    semester: 7,
    batch: '2023-2027',
    type: 'Regular',
    role: 'student'
  };

  console.log('\n--- Test 1: Running Image Parser with Student Profile ---');
  const startTime = Date.now();
  const classes = await parseTimetableImage(imageBuffer, 'image/jpeg', studentProfile);
  const elapsed = Date.now() - startTime;
  console.log(`✓ Extraction completed in ${elapsed}ms. Found ${classes.length} classes.`);

  assert.ok(classes.length > 0, 'Must extract classes from genuine image');
  
  // Inspect extracted classes
  console.log('\nExtracted Classes Summary:');
  classes.forEach((c, idx) => {
    const uncertainStr = c.uncertainFields?.length ? ` [⚠️ Review: ${c.uncertainFields.join(', ')}]` : '';
    console.log(`  #${idx + 1}: ${c.day} | ${c.startTime}-${c.endTime} | ${c.code} | "${c.name}" | Room: "${c.room}" | Teacher: "${c.teacher}"${uncertainStr}`);
  });

  // Verify schema fields
  classes.forEach(c => {
    assert.ok(c.classId, 'Must have classId');
    assert.ok(c.name, 'Must have name');
    assert.ok(c.day, 'Must have valid day');
    assert.ok(c.startTime, 'Must have startTime');
    assert.ok(c.endTime, 'Must have endTime');
    assert.ok(c.source === 'cloud_vision' || c.source === 'local_ocr', 'Source must be valid engine');
  });

  // Test 2: Validation of Invalid MIME Type
  console.log('\n--- Test 2: Reject Invalid MIME Type ---');
  let rejectedMime = false;
  try {
    await parseTimetableImage(imageBuffer, 'application/pdf');
  } catch (err) {
    rejectedMime = true;
    assert.ok(err.message.includes('Unsupported image format'), 'Expected format error');
  }
  assert.ok(rejectedMime, 'Must reject non-image MIME type in image parser');
  console.log('✓ PASS: Invalid MIME type rejected cleanly.');

  // Test 3: Validation of Empty Buffer
  console.log('\n--- Test 3: Reject Empty Buffer ---');
  let rejectedEmpty = false;
  try {
    await parseTimetableImage(Buffer.alloc(0), 'image/jpeg');
  } catch (err) {
    rejectedEmpty = true;
    assert.ok(err.message.includes('empty'), 'Expected empty error');
  }
  assert.ok(rejectedEmpty, 'Must reject empty buffer');
  console.log('✓ PASS: Empty buffer rejected cleanly.');

  // Test 4: Profile Filtering (Semester mismatch)
  console.log('\n--- Test 4: Student Profile Filtering (Semester 3 profile) ---');
  const sem3Profile = {
    program: 'BS in Software Engineering',
    semester: 3,
    batch: '2023-2027',
    type: 'Regular',
    role: 'student'
  };
  const sem3Classes = await parseTimetableImage(imageBuffer, 'image/jpeg', sem3Profile);
  assert.strictEqual(sem3Classes.length, 0, 'Semester 3 student should match 0 classes in Semester 7 image');
  console.log('✓ PASS: Profile filtering correctly isolates target semester.');

  console.log('\n====================================================');
  console.log('🎉 ALL IMAGE EXTRACTION TESTS PASSED');
  console.log('====================================================\n');
}

testImageExtraction().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
