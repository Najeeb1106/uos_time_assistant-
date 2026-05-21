const pdfImport = require('pdf-parse');

// ── Day Column Map ─────────────────────────────────────────────────────────
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
  let best = 'Monday', minD = Infinity;
  for (const col of DAY_COLUMNS) {
    const d = Math.abs(x - col.center);
    if (d < minD) { minD = d; best = col.day; }
  }
  return best;
}

const ROOM_X_THRESHOLD = 45;
const ROOM_GROUP_DY = 8;
const LECTURE_BLOCK_DY = 12;

const RE_CODE = /#([A-Z][A-Z0-9\-]{3,})/i;
const RE_BATCH_BSSE = /BS\s+in\s+Software\s+Engineering\s+(Regular|Self\s+Support|Weekend\s+Self\s+Support)\s*(\d*)\s*\(\s*(\d{4}-\d{4})\s*\)\s*Semester#(\d+)/i;
const RE_BATCH_MS = /MS\s+Software\s+Engineering\s*\(?(Weekend)?\)?\s*(Self\s+Support)?\s*\d*\s*\(\s*(\d{4}-\d{4})\s*\)\s*S(?:emester)?#?(\d*)/i;
const RE_SEMESTER = /Semester#(\d+)/i;
const RE_TIME = /\((\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})\)/;

function splitBlockIntoEntries(text) {
  const timeRe = /\(\d{2}:\d{2}\s*-\s*\d{2}:\d{2}\)/g;
  const matches = [...text.matchAll(timeRe)];
  if (matches.length <= 1) return [text];
  const entries = [];
  let lastEnd = 0;
  for (const m of matches) {
    const entryEnd = m.index + m[0].length;
    entries.push(text.substring(lastEnd, entryEnd).trim());
    lastEnd = entryEnd;
  }
  if (lastEnd < text.length) {
    const remainder = text.substring(lastEnd).trim();
    if (remainder) entries[entries.length - 1] += '\n' + remainder;
  }
  return entries.filter(e => e.length > 0);
}

function parseEntry(text) {
  const codeMatch = text.match(RE_CODE);
  let code = codeMatch ? codeMatch[1].trim() : '';
  code = code.replace(/[\u2026]+$/, '').trim();

  let type = 'Regular', section = '', batch = '', semester = 0;
  const bsseMatch = text.match(RE_BATCH_BSSE);
  const msMatch = text.match(RE_BATCH_MS);
  const semMatch = text.match(RE_SEMESTER);

  if (bsseMatch) {
    type = bsseMatch[1].trim(); section = bsseMatch[2].trim();
    batch = bsseMatch[3].trim(); semester = parseInt(bsseMatch[4]);
  } else if (msMatch) {
    type = msMatch[1] ? 'Weekend Self Support' : (msMatch[2] ? 'Self Support' : 'Regular');
    batch = msMatch[3] ? msMatch[3].trim() : '';
    semester = msMatch[4] && msMatch[4].length > 0 ? parseInt(msMatch[4]) : 0;
    if (semester === 0 && text.includes('MS Software Engineering')) {
      const msSemMatch = text.match(/Semester#(\d+)/i);
      semester = msSemMatch ? parseInt(msSemMatch[1]) : 0;
    }
  } else if (semMatch) {
    semester = parseInt(semMatch[1]);
    if (text.toLowerCase().includes('self support')) {
      type = text.toLowerCase().includes('weekend') ? 'Weekend Self Support' : 'Self Support';
    }
  }

  const timeMatch = text.match(RE_TIME);
  const startTime = timeMatch ? timeMatch[1] : '';
  const endTime = timeMatch ? timeMatch[2] : '';

  let teacher = 'Unknown';
  if (timeMatch) {
    const beforeTime = text.substring(0, timeMatch.index).trim();
    const segments = beforeTime.split('\n');
    const lastSeg = segments[segments.length - 1].trim();
    if (lastSeg.match(/Semester#\d+/i) || lastSeg.match(/^\d{4}-\d{4}$/)) {
      teacher = segments.length >= 2 ? segments[segments.length - 2].trim() : lastSeg;
    } else {
      teacher = lastSeg;
    }
    teacher = teacher.replace(/BS\s+in\s+Software\s+Engineering.*$/i, '').trim();
    teacher = teacher.replace(/MS\s+Software\s+Engineering.*$/i, '').trim();
    teacher = teacher.replace(/Semester#\d+.*/i, '').trim();
    if (teacher.includes('#') || teacher.length === 0) teacher = 'Unknown';
  }

  let name = 'Unknown Course';
  const hashIdx = text.indexOf('#');
  if (hashIdx !== -1) {
    const beforeHash = text.substring(0, hashIdx).trim();
    const nameParts = beforeHash.split('\n');
    name = nameParts[nameParts.length - 1].trim();
  } else {
    name = text.split('\n')[0].trim() || 'Unknown Course';
  }

  if (name.match(/^\w[\w\s.]+\(\d{2}:\d{2}/)) {
    const altCode = text.match(/#([A-Z0-9][\w-]+)/i);
    if (altCode) {
      const altIdx = text.indexOf('#' + altCode[1]);
      const altBefore = text.substring(0, altIdx).trim().split('\n');
      name = altBefore[altBefore.length - 1].trim();
    }
    if (name.match(/^\w[\w\s.]+\(\d{2}:\d{2}/)) name = 'Unknown Course';
  }

  return { name, code, type, section, batch, semester, startTime, endTime, teacher };
}

function dedup(lectures) {
  const seen = new Set();
  return lectures.filter(l => {
    const key = `${l.name}|${l.code}|${l.day}|${l.startTime}|${l.endTime}|${l.semester}|${l.type}|${l.section}|${l.teacher}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Extracts and filters schedule entries from the uploaded PDF buffer based on user profile.
 * @param {Buffer} pdfBuffer - Binary buffer of the PDF file
 * @param {string} userBatch - User's batch e.g., '2024-2028'
 * @param {number} userSemester - User's active semester e.g., 2
 * @param {string} userType - User's support type e.g., 'Regular' or 'Self Support'
 * @returns {Promise<Array>} List of filtered classes
 */
async function extractSchedule(pdfBuffer, userBatch, userSemester, userType) {
  try {
    const parser = new pdfImport.PDFParse({ data: new Uint8Array(pdfBuffer) });
    await parser.load();

    const allLectures = [];

    for (let pageNum = 1; pageNum <= parser.doc.numPages; pageNum++) {
      const page = await parser.doc.getPage(pageNum);
      const textContent = await page.getTextContent();

      const items = textContent.items
        .map(item => ({ str: item.str.trim(), x: item.transform[4], y: item.transform[5], width: item.width }))
        .filter(item => item.str !== '');

      const headerItem = items.find(i => i.str.includes('Room / Lab'));
      if (!headerItem) continue;
      const gridTopY = headerItem.y;
      const gridItems = items.filter(i => i.y < gridTopY);

      // Rooms (x < 45)
      const roomItems = gridItems.filter(i => i.x < ROOM_X_THRESHOLD).sort((a, b) => b.y - a.y);
      const rooms = [];
      let curRoom = null;
      for (const item of roomItems) {
        if (!curRoom) {
          curRoom = { parts: [item.str], yMax: item.y, yMin: item.y };
        } else if (Math.abs(curRoom.yMin - item.y) < ROOM_GROUP_DY) {
          curRoom.parts.push(item.str);
          curRoom.yMin = Math.min(curRoom.yMin, item.y);
        } else {
          rooms.push(curRoom);
          curRoom = { parts: [item.str], yMax: item.y, yMin: item.y };
        }
      }
      if (curRoom) rooms.push(curRoom);
      for (const r of rooms) {
        r.name = r.parts.join(' ').replace(/\s+/g, ' ').trim();
        r.yCenter = (r.yMax + r.yMin) / 2;
      }

      // Room bands
      for (let i = 0; i < rooms.length; i++) {
        rooms[i].bandTop = (i === 0) ? gridTopY : (rooms[i - 1].yMin + rooms[i].yMax) / 2;
        rooms[i].bandBottom = (i === rooms.length - 1) ? 0 : (rooms[i].yMin + rooms[i + 1].yMax) / 2;
      }

      // Lecture items (x >= 45)
      const lectureItems = gridItems.filter(i => i.x >= ROOM_X_THRESHOLD).sort((a, b) => b.y - a.y);
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
            if (block.some(b => Math.abs(b.y - candidate.y) < LECTURE_BLOCK_DY)) {
              block.push(candidate);
              used.add(j);
              changed = true;
            }
          }
        }

        // Sort block items top-to-bottom (descending Y = reading order)
        block.sort((a, b) => b.y - a.y);
        const fullText = block.map(b => b.str).join('\n');
        const avgY = block.reduce((s, b) => s + b.y, 0) / block.length;
        lectureBlocks.push({ text: fullText, y: avgY, day });
      }

      for (const block of lectureBlocks) {
        let roomName = 'Unknown';
        for (const room of rooms) {
          if (block.y <= room.bandTop && block.y >= room.bandBottom) {
            roomName = room.name; break;
          }
        }
        if (roomName === 'Unknown' && rooms.length > 0) {
          let minD = Infinity;
          for (const r of rooms) {
            const d = Math.abs(block.y - r.yCenter);
            if (d < minD) { minD = d; roomName = r.name; }
          }
        }

        const entries = splitBlockIntoEntries(block.text);
        for (const entry of entries) {
          const parsed = parseEntry(entry);
          allLectures.push({
            name: parsed.name, code: parsed.code, room: roomName,
            day: block.day, startTime: parsed.startTime, endTime: parsed.endTime,
            teacher: parsed.teacher, batch: parsed.batch, semester: parsed.semester,
            type: parsed.type, section: parsed.section, page: pageNum
          });
        }
      }
    }

    const final = dedup(allLectures);

    // Filter results specifically for the user
    const targetSemester = Number(userSemester);
    const targetType = (userType || 'Regular').toLowerCase();
    
    const filtered = final.filter(cls => {
      const clsSemester = Number(cls.semester);
      const clsType = (cls.type || '').toLowerCase();
      
      const semMatch = clsSemester === targetSemester;
      
      let typeMatch = false;
      if (targetType.includes('regular') && clsType.includes('regular')) {
        typeMatch = true;
      } else if (targetType.includes('self') && clsType.includes('self')) {
        const targetIsWeekend = targetType.includes('weekend');
        const clsIsWeekend = clsType.includes('weekend');
        
        if (targetIsWeekend === clsIsWeekend) {
          const targetSectionMatch = targetType.match(/\d+/);
          const clsSectionMatch = cls.section ? cls.section.trim() : '';
          
          if (targetSectionMatch && clsSectionMatch) {
            typeMatch = targetSectionMatch[0] === clsSectionMatch;
          } else {
            typeMatch = true;
          }
        }
      }

      // If user specified batch, filter by batch too, or match loosely
      const batchMatch = !userBatch || !cls.batch || cls.batch === userBatch;

      return semMatch && typeMatch && batchMatch;
    });

    return filtered;
  } catch (error) {
    throw new Error(`PDF parsing failed: ${error.message}`);
  }
}

module.exports = { extractSchedule };
