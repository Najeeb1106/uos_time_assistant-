const fs = require('fs');
const path = require('path');
const pdfImport = require('pdf-parse');

const pdfPath = path.join(__dirname, '..', 'Class Timetable SE.pdf');
const dataBuffer = fs.readFileSync(pdfPath);

async function run() {
  try {
    const parser = new pdfImport.PDFParse({ data: new Uint8Array(dataBuffer) });
    await parser.load();
    console.log('Load successful!');

    console.log('Calling getPageTables...');
    if (typeof parser.getPageTables === 'function') {
      const tables = await parser.getPageTables();
      console.log('Page tables retrieved! Type:', typeof tables);
      if (tables) {
        console.log('Number of tables or elements:', Array.isArray(tables) ? tables.length : Object.keys(tables));
        // Let's log a sample of the first table
        const firstTable = Array.isArray(tables) ? tables[0] : tables;
        console.log('First table keys:', Object.keys(firstTable));
        if (firstTable.rows) {
          console.log('First table rows count:', firstTable.rows.length);
          console.log('First row columns count:', firstTable.rows[0].length);
          console.log('Sample row 0:', firstTable.rows[0]);
          console.log('Sample row 1:', firstTable.rows[1]);
        } else {
          console.log('Table structure:', JSON.stringify(firstTable).substring(0, 1000));
        }
      }
    } else {
      console.log('getPageTables is not a function on parser.');
    }
  } catch (e) {
    console.error('Error occurred:', e);
  }
}

run();
