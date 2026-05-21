const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');

const pdfPath = path.join(__dirname, '..', 'Class Timetable SE.pdf');

console.log('Loading PDF from:', pdfPath);

if (!fs.existsSync(pdfPath)) {
  console.error('Error: PDF file does not exist at path:', pdfPath);
  process.exit(1);
}

const dataBuffer = fs.readFileSync(pdfPath);

pdf(dataBuffer).then(function(data) {
  console.log('\n--- PDF METADATA ---');
  console.log('Pages:', data.numpages);
  console.log('Info:', data.info);
  
  const text = data.text;
  console.log('\n--- TEXT LENGTH ---');
  console.log('Characters:', text.length);
  
  // Write raw text output to a file for analysis
  const debugTextPath = path.join(__dirname, 'raw_timetable_text.txt');
  fs.writeFileSync(debugTextPath, text);
  console.log('Raw text written to debug file:', debugTextPath);

  // Scan using our block regex
  console.log('\n--- SCANNING TIMETABLE ENTRIES ---');
  
  // Custom multi-line regex that captures:
  // 1. Course Name & Code (e.g., Software Engineering #CMPC-5101)
  // 2. Batch info (e.g., BS in Software Engineering Regular 1 ( 2025-2029 ) Semester#3)
  // 3. Teacher and time (e.g., Areeba Zarnab (08:00 - 09:30))
  const blockRegex = /([^\n]+?)\s*#([A-Z0-9\-]+)\s*\n([^\n]+?Semester#\d+)\s*\n([^\n]+?\(\d{2}:\d{2}\s*-\s*\d{2}:\d{2}\))/g;
  
  let match;
  let count = 0;
  const parsedItems = [];

  while ((match = blockRegex.exec(text)) !== null) {
    count++;
    const [fullBlock, name, code, batchLine, teacherLine] = match;
    
    // Parse Batch Line
    const batchMatch = batchLine.match(/BS in Software Engineering\s+(Regular|Self Support|Weekend\s+Self\s+Support)\s*(\d*)\s*\(\s*(\d{4}-\d{4})\s*\)\s*Semester#(\d+)/i);
    const programType = batchMatch ? batchMatch[1].trim() : 'Unknown';
    const section = batchMatch ? batchMatch[2].trim() : '';
    const batchYear = batchMatch ? batchMatch[3].trim() : 'Unknown';
    const semester = batchMatch ? batchMatch[4].trim() : 'Unknown';

    // Parse Teacher and Time
    const teacherMatch = teacherLine.match(/(.+?)\s*\((\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})\)/);
    const teacher = teacherMatch ? teacherMatch[1].trim() : 'Unknown';
    const startTime = teacherMatch ? teacherMatch[2] : 'Unknown';
    const endTime = teacherMatch ? teacherMatch[3] : 'Unknown';

    parsedItems.push({
      index: count,
      name: name.trim(),
      code: code.trim(),
      type: programType,
      section,
      batch: batchYear,
      semester: parseInt(semester),
      teacher,
      time: `${startTime} - ${endTime}`,
      startTime,
      endTime
    });
  }

  console.log(`Found ${count} schedule lecture entries matching the structural pattern.`);
  
  // Show first 10 parsed entries as sample
  console.log('\n--- SAMPLE PARSED ENTRIES (First 10) ---');
  console.table(parsedItems.slice(0, 10));

  // Count distribution per semester
  const distribution = {};
  parsedItems.forEach(item => {
    const key = `Semester ${item.semester} (${item.type})`;
    distribution[key] = (distribution[key] || 0) + 1;
  });

  console.log('\n--- DISTRIBUTION PER CLASS PROFILE ---');
  console.table(distribution);

}).catch(function(error) {
  console.error('PDF parsing error:', error);
});
