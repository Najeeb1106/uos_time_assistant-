const fs = require('fs');
const path = require('path');
const pdfImport = require('pdf-parse');

async function inspectCSPdf() {
  try {
    const pdfPath = path.join(__dirname, '..', 'Class Timetable CS.pdf');
    if (!fs.existsSync(pdfPath)) {
      console.error(`❌ PDF not found at ${pdfPath}`);
      return;
    }
    const pdfBuffer = fs.readFileSync(pdfPath);
    console.log(`Loaded CS PDF: ${pdfPath} (${pdfBuffer.length} bytes)`);

    const parser = new pdfImport.PDFParse({ data: new Uint8Array(pdfBuffer) });
    await parser.load();
    console.log("PDF Pages count:", parser.doc.numPages);
    
    // Collect all text items from all pages to see what programs are mentioned
    const programSet = new Set();
    const allLines = [];
    
    for (let pageNum = 1; pageNum <= parser.doc.numPages; pageNum++) {
      const page = await parser.doc.getPage(pageNum);
      const textContent = await page.getTextContent();
      const items = textContent.items
        .map(item => ({ str: item.str.trim(), x: item.transform[4], y: item.transform[5], width: item.width }))
        .filter(item => item.str !== '');
        
      for (const item of items) {
        // Look for typical department headings or course details
        // Timetable header patterns usually say: "BS ..." or "MS ..." or "M.Sc ..." etc.
        if (item.str.includes('Semester') || item.str.includes('BS') || item.str.includes('MS') || item.str.includes('MCS') || item.str.includes('Computer Science') || item.str.includes('Software')) {
          programSet.add(item.str);
        }
      }
    }
    
    console.log("\n--- Unique matched headers / text containing program info ---");
    console.log(Array.from(programSet));
    
  } catch (error) {
    console.error("Error inspecting:", error);
  }
}

inspectCSPdf();
