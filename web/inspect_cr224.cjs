const fs = require('fs');
const path = require('path');

const text = fs.readFileSync(path.join(__dirname, 'raw_timetable_text.txt'), 'utf8');
const lines = text.split('\n');

console.log('--- NAB CR-224 DETAIL ---');
for (let i = 230; i < 290; i++) {
  const line = lines[i] || '';
  const escaped = line.replace(/\t/g, '\\t').replace(/\r/g, '\\r');
  console.log(`${i + 1}: ${escaped}`);
}
