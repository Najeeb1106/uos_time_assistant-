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

    // Get page 1
    const page = await parser.doc.getPage(1);
    console.log('Got page 1!');

    const textContent = await page.getTextContent();
    console.log('Total text items on page 1:', textContent.items.length);

    console.log('\n--- FIRST 100 TEXT ITEMS WITH COORDINATES ---');
    for (let i = 0; i < Math.min(100, textContent.items.length); i++) {
      const item = textContent.items[i];
      if (item.str.trim() === '') continue;
      const x = item.transform[4];
      const y = item.transform[5];
      console.log(`Item ${i}: "${item.str}" at x=${x.toFixed(2)}, y=${y.toFixed(2)}`);
    }
  } catch (e) {
    console.error('Error occurred:', e);
  }
}

run();
