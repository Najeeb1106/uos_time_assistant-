const fs = require('fs');
const path = require('path');
const { extractSchedule } = require('./src/utils/pdfParser');

async function inspectClasses() {
  try {
    const pdfPath = path.join(__dirname, '..', 'Class Timetable CS.pdf');
    const pdfBuffer = fs.readFileSync(pdfPath);
    
    // We call extractSchedule but we override semester filter internally by writing a custom loop over parsed entries.
    // Let's implement a quick extraction of ALL classes for BS in Computer Science from the PDF, without semester filter, to see what is in there!
    const { PDFParse } = require('pdf-parse');
    const parser = new PDFParse({ data: new Uint8Array(pdfBuffer) });
    await parser.load();

    const allLectures = [];
    const DAY_COLUMNS = [
      { day: 'Monday',    center: 99.0  },
      { day: 'Tuesday',   center: 204.8 },
      { day: 'Wednesday', center: 309.6 },
      { day: 'Thursday',  center: 418.9 },
      { day: 'Friday',    center: 527.0 },
      { day: 'Saturday',  center: 629.0 },
      { day: 'Sunday',    center: 734.0 },
    ];
    const DAY_BOUNDARIES = [];
    for (let i = 0; i < DAY_COLUMNS.length; i++) {
      const left = i === 0 ? 45 : (DAY_COLUMNS[i - 1].center + DAY_COLUMNS[i].center) / 2;
      const right = i === DAY_COLUMNS.length - 1 ? 900 : (DAY_COLUMNS[i].center + DAY_COLUMNS[i + 1].center) / 2;
      DAY_BOUNDARIES.push({ day: DAY_COLUMNS[i].day, left, right });
    }
    function getDay(x) {
      for (const col of DAY_BOUNDARIES) {
        if (x >= col.left && x < col.right) return col.day;
      }
      return 'Monday';
    }

    const RE_CODE = /#([A-Z][A-Z0-9\-]{3,})/i;
    const RE_BATCH_BS = /BS\s+in\s+([A-Za-z\s]+?)\s+(Regular|Self\s+Support|Weekend\s+Self\s+Support|Self)\s*(\d*)\s*\(\s*(\d{4}-\d{4})\s*\)\s*Semester#(\d+)/i;
    const RE_TIME = /\((\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})\)/;

    for (let pageNum = 1; pageNum <= parser.doc.numPages; pageNum++) {
      const page = await parser.doc.getPage(pageNum);
      const textContent = await page.getTextContent();
      const items = textContent.items
        .map(item => ({ str: item.str.trim(), x: item.transform[4], y: item.transform[5] }))
        .filter(item => item.str !== '');

      const headerItem = items.find(i => i.str.includes('Room / Lab'));
      if (!headerItem) continue;
      const gridTopY = headerItem.y;
      const gridItems = items.filter(i => i.y < gridTopY);

      const lectureItems = gridItems.filter(i => i.x >= 45).sort((a, b) => b.y - a.y);
      const used = new Set();
      const lectureBlocks = [];

      for (let i = 0; i < lectureItems.length; i++) {
        if (used.has(i)) continue;
        const seed = lectureItems[i];
        const day = getDay(seed.x);
        const block = [seed];
        used.add(i);

        let changed = true;
        while (changed) {
          changed = false;
          for (let j = 0; j < lectureItems.length; j++) {
            if (used.has(j)) continue;
            const candidate = lectureItems[j];
            if (getDay(candidate.x) !== day) continue;
            if (block.some(b => Math.abs(b.y - candidate.y) < 12)) {
              block.push(candidate);
              used.add(j);
              changed = true;
            }
          }
        }
        block.sort((a, b) => b.y - a.y);
        lectureBlocks.push({ text: block.map(b => b.str).join('\n'), y: block.reduce((s, b) => s + b.y, 0) / block.length, day });
      }

      for (const block of lectureBlocks) {
        const timeMatch = block.text.match(RE_TIME);
        const bsMatch = block.text.match(RE_BATCH_BS);
        if (bsMatch) {
          const program = bsMatch[1].trim();
          const type = bsMatch[2].trim();
          const section = bsMatch[3].trim();
          const batch = bsMatch[4].trim();
          const semester = bsMatch[5].trim();
          if (program.includes('Computer Science') && batch === '2022-2026') {
            allLectures.push({ text: block.text.replace(/\n/g, ' | '), day: block.day, program, type, section, batch, semester });
          }
        }
      }
    }

    console.log("Found matches for BS Computer Science and Batch 2022-2026:");
    console.log(allLectures);
  } catch (err) {
    console.error(err);
  }
}

inspectClasses();
