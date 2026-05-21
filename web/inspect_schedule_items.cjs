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

    const page = await parser.doc.getPage(1);
    const textContent = await page.getTextContent();

    console.log('\n--- SCHEDULE GRID ITEMS ON PAGE 1 (y < 200) ---');
    
    // Sort items by y (descending, i.e. top-to-bottom) then by x (ascending, i.e. left-to-right)
    const items = textContent.items
      .map((item, idx) => ({
        idx,
        str: item.str,
        x: item.transform[4],
        y: item.transform[5],
        width: item.width
      }))
      .filter(item => item.str.trim() !== '')
      .sort((a, b) => {
        // If y is extremely close, treat as same line
        if (Math.abs(a.y - b.y) < 2) {
          return a.x - b.x;
        }
        return b.y - a.y; // top-to-bottom
      });

    // Let's print out the sorted items
    items.forEach(item => {
      if (item.y < 200) {
        console.log(`x=${item.x.toFixed(1)}, y=${item.y.toFixed(1)} (w=${item.width.toFixed(1)}): "${item.str}"`);
      }
    });

  } catch (e) {
    console.error('Error occurred:', e);
  }
}

run();
