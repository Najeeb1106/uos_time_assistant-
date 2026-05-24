const fs = require('fs');
const path = require('path');
const { extractSchedule } = require('./src/utils/pdfParser');

async function testCSParsing() {
  console.log('🧪 Testing CS PDF Parsing...');
  try {
    const pdfPath = path.join(__dirname, '..', 'Class Timetable CS.pdf');
    if (!fs.existsSync(pdfPath)) {
      console.error(`❌ PDF not found at ${pdfPath}`);
      return;
    }
    const pdfBuffer = fs.readFileSync(pdfPath);
    console.log(`Loaded PDF: ${pdfPath} (${pdfBuffer.length} bytes)`);

    // Extract BS Computer Science
    console.log('\n--- Extracting BS Computer Science (Semester 3, Batch 2024-2028, Self Support 1) ---');
    const csClasses = await extractSchedule(pdfBuffer, '2024-2028', 3, 'Self Support 1', 'BS in Computer Science');
    console.log(`Found ${csClasses.length} classes.`);
    console.table(csClasses.map(c => ({
      name: c.name,
      code: c.code,
      day: c.day,
      time: `${c.startTime} - ${c.endTime}`,
      room: c.room,
      section: c.section
    })));

    // Extract Final Year CS Semester 8
    console.log('\n--- Extracting BS Computer Science (Semester 8, Batch 2022-2026, Self Support 1) ---');
    const finalYearClasses = await extractSchedule(pdfBuffer, '2022-2026', 8, 'Self Support 1', 'BS in Computer Science');
    console.log(`Found ${finalYearClasses.length} classes.`);
    console.table(finalYearClasses.map(c => ({
      name: c.name,
      code: c.code,
      day: c.day,
      time: `${c.startTime} - ${c.endTime}`,
      room: c.room,
      section: c.section,
      batch: c.batch,
      semester: c.semester
    })));

  } catch (err) {
    console.error('❌ CS test failed:', err.stack);
  }
}

testCSParsing();
