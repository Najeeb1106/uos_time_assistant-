const fs = require('fs');
const path = require('path');

const text = fs.readFileSync(path.join(__dirname, 'raw_timetable_text.txt'), 'utf8');
const lines = text.split('\n');

console.log('--- SECTION 1 DETAIL ---');
for (let i = 180; i < 217; i++) {
  const line = lines[i] || '';
  console.log(`${i + 1}: ${JSON.stringify(line)}`);
}
