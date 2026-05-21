const fs = require('fs');
const path = require('path');

const text = fs.readFileSync(path.join(__dirname, 'raw_timetable_text.txt'), 'utf8');

// Let's grab the text around line 180 to 215
const lines = text.split('\n');
console.log('--- LINE BY LINE INSPECTION ---');
for (let i = 180; i < 215; i++) {
  if (lines[i] !== undefined) {
    const rawLine = lines[i];
    const escaped = rawLine.replace(/\t/g, '\\t').replace(/\r/g, '\\r');
    console.log(`${i + 1}: "${escaped}"`);
  }
}
