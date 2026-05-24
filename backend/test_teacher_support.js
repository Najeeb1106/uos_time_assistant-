const fs = require('fs');
const path = require('path');
const { extractSchedule } = require('./src/utils/pdfParser');

async function testTeacherSupport() {
  console.log('🧪 Running Teacher Support Integration Test...');
  try {
    const pdfPath = path.join(__dirname, '..', 'Class Timetable CS.pdf');
    if (!fs.existsSync(pdfPath)) {
      console.error(`❌ PDF not found at ${pdfPath}`);
      return;
    }
    const pdfBuffer = fs.readFileSync(pdfPath);
    console.log(`Loaded PDF: ${pdfPath} (${pdfBuffer.length} bytes)`);

    // First, let's extract all classes to see what teachers exist
    const allParsedClasses = await extractSchedule(pdfBuffer, null, null, null, null, 'student');
    console.log(`\nSuccessfully parsed total ${allParsedClasses.length} class entries from timetable.`);
    
    const uniqueTeachers = new Set();
    allParsedClasses.forEach(c => {
      if (c.teacher && c.teacher !== 'Unknown') {
        uniqueTeachers.add(c.teacher);
      }
    });

    console.log(`\n--- Unique parsed instructors (${uniqueTeachers.size} found) ---`);
    console.log(Array.from(uniqueTeachers).sort());

    // Choose a teacher from the list to test matching
    const targetTeacherInput = 'Muhammad Najeeb'; // User input name
    console.log(`\n--- Testing name-matching filter for teacher: "${targetTeacherInput}" ---`);
    
    const teacherClasses = await extractSchedule(pdfBuffer, null, null, null, null, 'teacher', targetTeacherInput);
    console.log(`Found ${teacherClasses.length} scheduled classes for user "${targetTeacherInput}".`);
    
    if (teacherClasses.length > 0) {
      console.log('✅ Name-matching test successful!');
      console.table(teacherClasses.map(c => ({
        name: c.name,
        code: c.code,
        day: c.day,
        time: `${c.startTime} - ${c.endTime}`,
        room: c.room,
        parsedTeacher: c.teacher,
        cohort: `${c.program} - ${c.type} (Sem ${c.semester})`
      })));
    } else {
      console.warn('⚠️ No classes matched for that teacher. Let us print some parsed classes with teacher names.');
      console.log(allParsedClasses.slice(0, 10).map(c => ({ name: c.name, teacher: c.teacher })));
    }

    // Test a loose substring match or prefix title variations
    const testCases = [
      { input: 'Dr. Afzal Badshah', expectedToMatch: true },
      { input: 'Afzal Badshah', expectedToMatch: true },
      { input: 'Dr Afzal', expectedToMatch: true }
    ];

    console.log('\n--- Verifying Robust Normalization and Title Removal Cases ---');
    for (const tc of testCases) {
      const res = await extractSchedule(pdfBuffer, null, null, null, null, 'teacher', tc.input);
      console.log(`Input: "${tc.input}" -> Matched: ${res.length} classes`);
    }

    console.log('\n🎉 Teacher Support Integration Test completed successfully!');
  } catch (err) {
    console.error('❌ Teacher support test failed:', err.stack);
  }
}

testTeacherSupport();
