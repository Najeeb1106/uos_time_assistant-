const fs = require('fs');
const path = require('path');
const { extractSchedule } = require('./src/utils/pdfParser');

async function testCS() {
  try {
    const pdfPath = path.join(__dirname, '..', 'Class Timetable CS.pdf');
    if (!fs.existsSync(pdfPath)) {
      console.log("PDF not found!");
      return;
    }
    const buffer = fs.readFileSync(pdfPath);

    console.log("--- Testing BS in Computer Science Semester 2 Regular ---");
    const regularClasses = await extractSchedule(
      buffer,
      '2025-2029',
      '2',
      'Regular',
      'BS in Computer Science',
      'student',
      'Najeeb Ullah'
    );
    console.log("Regular S2 Classes parsed count:", regularClasses.length);
    if (regularClasses.length > 0) {
      console.log("Sample:", regularClasses[0]);
    }

    console.log("\n--- Testing BS in Computer Science Semester 2 Self Support 1 ---");
    const selfClasses = await extractSchedule(
      buffer,
      '2025-2029',
      '2',
      'Self Support 1',
      'BS in Computer Science',
      'student',
      'Najeeb Ullah'
    );
    console.log("Self S2 Classes parsed count:", selfClasses.length);
    if (selfClasses.length > 0) {
      console.log("Sample:", selfClasses[0]);
    }

  } catch (error) {
    console.error("Test failed:", error);
  }
}

testCS();
