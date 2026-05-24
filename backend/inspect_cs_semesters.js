const fs = require('fs');
const path = require('path');
const pdfImport = require('pdf-parse');

async function checkSemesters() {
  try {
    const pdfPath = path.join(__dirname, '..', 'Class Timetable CS.pdf');
    if (!fs.existsSync(pdfPath)) {
      console.log("PDF not found!");
      return;
    }
    const buffer = fs.readFileSync(pdfPath);
    const parser = new pdfImport.PDFParse({ data: new Uint8Array(buffer) });
    await parser.load();

    const batches = new Set();
    const semesters = new Set();
    const relations = [];

    for (let pageNum = 1; pageNum <= parser.doc.numPages; pageNum++) {
      const page = await parser.doc.getPage(pageNum);
      const textContent = await page.getTextContent();
      const text = textContent.items.map(item => item.str).join(' ');

      // Extract batch and semester using simple regexes
      const batchMatches = text.match(/\d{4}-\d{4}/g) || [];
      batchMatches.forEach(b => batches.add(b));

      const semMatches = text.match(/Semester#\d+/gi) || [];
      semMatches.forEach(s => semesters.add(s));

      // Let's look for cohort strings
      const lines = textContent.items.map(i => i.str.trim()).filter(Boolean);
      for (const line of lines) {
        if (line.includes('2023-2027')) {
          relations.push(`Page ${pageNum}: ${line}`);
        }
      }
    }

    console.log("Batches found:", Array.from(batches));
    console.log("Semesters found:", Array.from(semesters));
    console.log("\n2023-2027 mentions in PDF:");
    console.log(relations);

  } catch (error) {
    console.error(error);
  }
}

checkSemesters();
