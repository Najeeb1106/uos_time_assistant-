const fs = require('fs');
const path = require('path');
const { extractSchedule } = require('./src/utils/pdfParser');

async function testSelfSupportIsolation() {
  console.log('🧪 Testing E2E Self Support Isolation (Self Support 1 vs 2)...');
  try {
    const pdfPath = path.join(__dirname, '..', 'Class Timetable SE.pdf');
    if (!fs.existsSync(pdfPath)) {
      console.error(`❌ PDF not found at ${pdfPath}`);
      return;
    }
    const pdfBuffer = fs.readFileSync(pdfPath);
    console.log(`Loaded PDF: ${pdfPath} (${pdfBuffer.length} bytes)`);

    // 1. Extract Self Support 1
    console.log('\n--- 1. Extracting Self Support 1 (Semester 4, Batch 2024-2028) ---');
    const self1Classes = await extractSchedule(pdfBuffer, '2024-2028', 4, 'Self Support 1', 'BS in Software Engineering');
    console.log(`Found ${self1Classes.length} classes for Self Support 1.`);
    console.table(self1Classes.map(c => ({
      name: c.name,
      code: c.code,
      day: c.day,
      time: `${c.startTime} - ${c.endTime}`,
      room: c.room,
      section: c.section
    })));

    // 2. Extract Self Support 2
    console.log('\n--- 2. Extracting Self Support 2 (Semester 4, Batch 2024-2028) ---');
    const self2Classes = await extractSchedule(pdfBuffer, '2024-2028', 4, 'Self Support 2', 'BS in Software Engineering');
    console.log(`Found ${self2Classes.length} classes for Self Support 2.`);
    console.table(self2Classes.map(c => ({
      name: c.name,
      code: c.code,
      day: c.day,
      time: `${c.startTime} - ${c.endTime}`,
      room: c.room,
      section: c.section
    })));

    // 3. Perform assertion
    console.log('\n--- 3. Validation Check ---');
    const overlap = self1Classes.filter(c1 => self2Classes.some(c2 => c1.name === c2.name && c1.day === c2.day && c1.startTime === c2.startTime));
    console.log(`Overlapping lectures between Self 1 and Self 2: ${overlap.length}`);
    if (overlap.length === 0 && self1Classes.length > 0 && self2Classes.length > 0) {
      console.log('✅ SUCCESS! Self Support 1 and Self Support 2 schedules are 100% isolated and separated correctly.');
    } else {
      console.warn('⚠️ Note: Some overlap exists, which might be common department lectures (if any), or check separation logic.');
    }

  } catch (err) {
    console.error('❌ Self support test failed:', err.message);
  }
}

testSelfSupportIsolation();
