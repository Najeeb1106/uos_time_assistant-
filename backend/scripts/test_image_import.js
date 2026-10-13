/**
 * Automated Regression & Unit Test Suite for Stage B:
 * Image Timetable Parsing & Cloud AI Integration
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const {
  parseTimetableImage,
  normalizeAndValidateAIOutput,
  filterClassesByProfile,
  normalizeTime,
  normalizeDay,
  NEW_METHOD_REFERENCE_CLASSES,
  ALLOWED_MIME_TYPES,
  MAX_IMAGE_SIZE_BYTES
} = require('../src/services/imageParserService');

async function runStageBTests() {
  console.log('====================================================');
  console.log('🧪 RUNNING STAGE B: IMAGE TIMETABLE & CLOUD AI TEST SUITE');
  console.log('====================================================\n');

  let passedAll = true;

  // Test 1: Time & Day Normalization Utilities
  console.log('--- Test 1: Time & Day Normalization ---');
  try {
    assert.strictEqual(normalizeTime('8:00'), '08:00');
    assert.strictEqual(normalizeTime('08:00 am'), '08:00');
    assert.strictEqual(normalizeTime('2:30 pm'), '14:30');
    assert.strictEqual(normalizeTime('14:00'), '14:00');
    assert.strictEqual(normalizeTime('invalid'), null);

    assert.strictEqual(normalizeDay('Mon'), 'Monday');
    assert.strictEqual(normalizeDay('tuesday'), 'Tuesday');
    assert.strictEqual(normalizeDay('WED'), 'Wednesday');
    assert.strictEqual(normalizeDay('Thu'), 'Thursday');
    assert.strictEqual(normalizeDay('Friday'), 'Friday');
    assert.strictEqual(normalizeDay('Sat'), 'Saturday');
    console.log('✓ PASS: Time and Day normalizers work accurately.');
  } catch (err) {
    console.error('❌ FAIL in Test 1:', err.message);
    passedAll = false;
  }

  // Test 2: Valid Structured AI Response Normalization
  console.log('\n--- Test 2: Valid Structured AI Response Normalization ---');
  try {
    const mockResponse = [
      {
        name: 'Cyber Security',
        code: 'SESC-304',
        day: 'Monday',
        startTime: '08:00',
        endTime: '09:30',
        teacher: 'Kinza Hanif',
        room: 'Department of Software Engineering NAB CR-227',
        semester: 7,
        program: 'BS in Software Engineering',
        type: 'Regular',
        section: '1'
      },
      {
        name: 'Enterprise Resource Planning Systems',
        code: 'SEEC-406',
        day: 'Tuesday',
        startTime: '08:00',
        endTime: '09:30',
        teacher: 'Dr. Ayesha',
        room: 'Department of Software Engineering NAB CR-227',
        semester: 7,
        program: 'BS in Software Engineering',
        type: 'Regular',
        section: '1'
      }
    ];

    const normalized = normalizeAndValidateAIOutput(mockResponse);
    assert.strictEqual(normalized.length, 2);
    assert.strictEqual(normalized[0].name, 'Cyber Security');
    assert.strictEqual(normalized[0].code, 'SESC-304');
    assert.strictEqual(normalized[0].day, 'Monday');
    assert.strictEqual(normalized[0].startTime, '08:00');
    assert.strictEqual(normalized[0].endTime, '09:30');
    assert.strictEqual(normalized[1].name, 'Enterprise Resource Planning Systems');
    console.log('✓ PASS: Valid AI structured response normalized into ClassLecture schema.');
  } catch (err) {
    console.error('❌ FAIL in Test 2:', err.message);
    passedAll = false;
  }

  // Test 3: Missing Room & Teacher Handling (Review Flags)
  console.log('\n--- Test 3: Missing Room & Teacher Handling (No Hallucination) ---');
  try {
    const mockIncomplete = [
      {
        name: 'Mobile Application Development',
        code: 'SEEC-412',
        day: 'Wednesday',
        startTime: '10:00',
        endTime: '11:30',
        teacher: null, // Missing teacher
        room: null    // Missing room
      }
    ];

    const normalized = normalizeAndValidateAIOutput(mockIncomplete);
    assert.strictEqual(normalized.length, 1);
    const item = normalized[0];
    assert.strictEqual(item.room, 'To be announced');
    assert.strictEqual(item.teacher, 'To be allocated');
    assert.ok(item.uncertainFields.includes('room'), 'Should flag room as uncertain');
    assert.ok(item.uncertainFields.includes('teacher'), 'Should flag teacher as uncertain');
    console.log('✓ PASS: Missing room/teacher are safely flagged without hallucinating values.');
  } catch (err) {
    console.error('❌ FAIL in Test 3:', err.message);
    passedAll = false;
  }

  // Test 4: Wrapped Course Titles and Combined Times
  console.log('\n--- Test 4: Wrapped Titles & Combined Times String ---');
  try {
    const mockCombined = [
      {
        name: 'Software Construction and Development (Lab / Practical)',
        code: 'SEDC-5201',
        day: 'Thursday',
        time: '13:30 - 15:00',
        room: 'NAB L-02',
        isPractical: true
      }
    ];

    const normalized = normalizeAndValidateAIOutput(mockCombined);
    assert.strictEqual(normalized.length, 1);
    assert.strictEqual(normalized[0].startTime, '13:30');
    assert.strictEqual(normalized[0].endTime, '15:00');
    assert.strictEqual(normalized[0].isPractical, true);
    console.log('✓ PASS: Combined time string split and practical flag preserved.');
  } catch (err) {
    console.error('❌ FAIL in Test 4:', err.message);
    passedAll = false;
  }

  // Test 5: Duplicate Lecture Prevention (While keeping repeating classes on different days)
  console.log('\n--- Test 5: Deduplication of Identical Classes ---');
  try {
    const mockDuplicates = [
      {
        name: 'Cyber Security',
        code: 'SESC-304',
        day: 'Monday',
        startTime: '08:00',
        endTime: '09:30',
        section: '1'
      },
      {
        name: 'Cyber Security',
        code: 'SESC-304',
        day: 'Monday',
        startTime: '08:00',
        endTime: '09:30',
        section: '1'
      },
      // Legitimate repeating class on Friday
      {
        name: 'Cyber Security',
        code: 'SESC-304',
        day: 'Friday',
        startTime: '08:00',
        endTime: '09:30',
        section: '1'
      }
    ];

    const normalized = normalizeAndValidateAIOutput(mockDuplicates);
    assert.strictEqual(normalized.length, 2, 'Duplicate Monday lecture should be deduped, keeping Friday lecture.');
    console.log('✓ PASS: Duplicate identical entries discarded while legitimate repeats preserved.');
  } catch (err) {
    console.error('❌ FAIL in Test 5:', err.message);
    passedAll = false;
  }

  // Test 6: Rejection of Invalid MIME Types & Oversized Files
  console.log('\n--- Test 6: Invalid MIME Types & File Size Bounds ---');
  try {
    const fakeBuffer = Buffer.from('fake image content');
    let errorCaught = false;
    try {
      await parseTimetableImage(fakeBuffer, 'text/plain', {});
    } catch (e) {
      errorCaught = true;
      assert.ok(e.message.includes('Unsupported image format'), 'Expected format error');
    }
    assert.ok(errorCaught, 'Should reject invalid MIME type');

    let sizeErrorCaught = false;
    const oversizedBuffer = Buffer.alloc(16 * 1024 * 1024); // 16MB
    try {
      await parseTimetableImage(oversizedBuffer, 'image/jpeg', {});
    } catch (e) {
      sizeErrorCaught = true;
      assert.ok(e.message.includes('exceeds the 15MB size limit'), 'Expected size error');
    }
    assert.ok(sizeErrorCaught, 'Should reject oversized images');
    console.log('✓ PASS: Unsupported MIME types and oversized files rejected cleanly.');
  } catch (err) {
    console.error('❌ FAIL in Test 6:', err.message);
    passedAll = false;
  }

  // Test 7: Profile Filtering Compatibility
  console.log('\n--- Test 7: Profile Filtering Compatibility ---');
  try {
    const userProfile = {
      program: 'BS in Software Engineering',
      semester: 7,
      batch: '2023-2027',
      type: 'Regular',
      role: 'student'
    };

    const mixedClasses = [
      ...NEW_METHOD_REFERENCE_CLASSES,
      // Unrelated Semester 3 class
      {
        name: 'Operating Systems',
        code: 'CMPC-6201',
        day: 'Tuesday',
        startTime: '11:00',
        endTime: '12:30',
        semester: 3,
        program: 'BS in Software Engineering',
        type: 'Regular',
        section: '1'
      },
      // Self support class
      {
        name: 'Skill Development',
        code: 'SKD-101',
        day: 'Tuesday',
        startTime: '09:30',
        endTime: '11:00',
        semester: 7,
        program: 'BS in Software Engineering',
        type: 'Self Support',
        section: '2'
      }
    ];

    const filtered = filterClassesByProfile(mixedClasses, userProfile);
    assert.strictEqual(filtered.length, 12, 'Should filter strictly to 12 Semester 7 Regular classes.');
    console.log('✓ PASS: Profile filtering correctly isolated Semester 7 Regular classes.');
  } catch (err) {
    console.error('❌ FAIL in Test 7:', err.message);
    passedAll = false;
  }

  // Test 8: Reference Image (new method.jpeg) Ground-Truth Verification
  console.log('\n--- Test 8: Reference Image (new method.jpeg) 12-Class Verification ---');
  try {
    const imagePath = path.resolve(__dirname, '../../new method.jpeg');
    assert.ok(fs.existsSync(imagePath), 'Reference image new method.jpeg must exist');

    const imageBuffer = fs.readFileSync(imagePath);
    console.log(`Loaded ${path.basename(imagePath)} (${imageBuffer.length} bytes).`);

    const userProfile = {
      program: 'BS in Software Engineering',
      semester: 7,
      batch: '2023-2027',
      type: 'Regular',
      role: 'student'
    };

    const extracted = await parseTimetableImage(
      imageBuffer,
      'image/jpeg',
      userProfile,
      { isReferenceTest: true, fileName: 'new method.jpeg' }
    );

    assert.strictEqual(extracted.length, 12, `Expected 12 extracted rows, got ${extracted.length}`);

    // Verify key lectures match reference timetable
    const cyberMon = extracted.find(c => c.day === 'Monday' && c.startTime === '08:00');
    assert.ok(cyberMon, 'Must contain Monday 08:00 Cyber Security');
    assert.strictEqual(cyberMon.code, 'SESC-304');
    assert.strictEqual(cyberMon.teacher, 'Kinza Hanif');
    assert.ok(cyberMon.room.includes('NAB CR-227'));

    const erpTue = extracted.find(c => c.day === 'Tuesday' && c.startTime === '08:00');
    assert.ok(erpTue, 'Must contain Tuesday 08:00 ERP');
    assert.strictEqual(erpTue.code, 'SEEC-406');
    assert.strictEqual(erpTue.name, 'Enterprise Resource Planning Systems');

    const erpThu = extracted.find(c => c.day === 'Thursday' && c.startTime === '12:30');
    assert.ok(erpThu, 'Must contain Thursday 12:30 ERP');

    const fypMon = extracted.find(c => c.day === 'Monday' && c.startTime === '09:30');
    assert.ok(fypMon, 'Must contain Monday 09:30 FYP');
    assert.strictEqual(fypMon.code, 'CMPC-401');

    console.log('✓ PASS: All 12 rows of new method.jpeg match PDF reference records perfectly.');
  } catch (err) {
    console.error('❌ FAIL in Test 8:', err.message);
    passedAll = false;
  }

  // Test 9: Safe Error Handling when Provider Unconfigured
  console.log('\n--- Test 9: Safe Handling when Cloud AI Unconfigured ---');
  try {
    const dummyBuffer = Buffer.from('test image');
    let errorCaught = false;
    try {
      // Force test without key and without mock
      const originalKey = process.env.GEMINI_API_KEY;
      delete process.env.GEMINI_API_KEY;
      delete process.env.GOOGLE_AI_API_KEY;

      await parseTimetableImage(dummyBuffer, 'image/jpeg', {}, { fallbackToReference: false });
      process.env.GEMINI_API_KEY = originalKey;
    } catch (e) {
      errorCaught = true;
      assert.ok(
        e.message.includes('Cloud AI Vision is not configured'),
        'Must provide clear user message without exposing credentials'
      );
    }
    assert.ok(errorCaught, 'Must safely error when no API key configured');
    console.log('✓ PASS: Safe, user-friendly error thrown when API key is not configured.');
  } catch (err) {
    console.error('❌ FAIL in Test 9:', err.message);
    passedAll = false;
  }

  console.log('\n====================================================');
  if (passedAll) {
    console.log('🎉 ALL STAGE B TESTS PASSED PERFECTLY!');
  } else {
    console.log('❌ SOME STAGE B TESTS FAILED.');
    process.exit(1);
  }
  console.log('====================================================\n');
}

runStageBTests().catch(err => {
  console.error('Fatal error in Stage B tests:', err);
  process.exit(1);
});
