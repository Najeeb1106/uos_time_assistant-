const pdfImport = require('pdf-parse');

// ── Day Column Dynamic Boundaries ──────────────────────────────────────────
const ROOM_X_THRESHOLD = 45;
const ROOM_GROUP_DY = 8;
const LECTURE_BLOCK_DY = 12;

const DAY_CANONICAL = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_ALIAS_MAP = {
  'monday': 'Monday', 'mon': 'Monday',
  'tuesday': 'Tuesday', 'tue': 'Tuesday',
  'wednesday': 'Wednesday', 'wed': 'Wednesday',
  'thursday': 'Thursday', 'thu': 'Thursday',
  'friday': 'Friday', 'fri': 'Friday',
  'saturday': 'Saturday', 'sat': 'Saturday',
  'sunday': 'Sunday', 'sun': 'Sunday'
};

// Fallback 7-day default boundaries (preserved for backwards compatibility if document headers cannot be parsed)
const DEFAULT_7DAY_COLUMNS = [
  { day: 'Monday',    center: 99.0  },
  { day: 'Tuesday',   center: 204.8 },
  { day: 'Wednesday', center: 309.6 },
  { day: 'Thursday',  center: 418.9 },
  { day: 'Friday',    center: 527.0 },
  { day: 'Saturday',  center: 629.0 },
  { day: 'Sunday',    center: 734.0 },
];
const DEFAULT_7DAY_BOUNDARIES = [];
for (let i = 0; i < DEFAULT_7DAY_COLUMNS.length; i++) {
  const left = i === 0 ? ROOM_X_THRESHOLD : (DEFAULT_7DAY_COLUMNS[i - 1].center + DEFAULT_7DAY_COLUMNS[i].center) / 2;
  const right = i === DEFAULT_7DAY_COLUMNS.length - 1 ? 900 : (DEFAULT_7DAY_COLUMNS[i].center + DEFAULT_7DAY_COLUMNS[i + 1].center) / 2;
  DEFAULT_7DAY_BOUNDARIES.push({ day: DEFAULT_7DAY_COLUMNS[i].day, left, right, centerX: DEFAULT_7DAY_COLUMNS[i].center });
}

/**
 * Builds dynamic day boundaries by scanning header row text items.
 * Validates exact normalized matching, unique day names, and strict canonical day-of-week ordering.
 */
function buildDynamicBoundaries(headerRowItems, roomThreshold = ROOM_X_THRESHOLD, pageWidth = 900) {
  const detected = [];
  for (const item of headerRowItems) {
    const cleanStr = item.str.toLowerCase().replace(/[^a-z]/g, '');
    const stdName = DAY_ALIAS_MAP[cleanStr];
    if (stdName) {
      const centerX = item.x + (item.width ? item.width / 2 : 0);
      detected.push({ day: stdName, x: item.x, centerX });
    }
  }

  // Sort left-to-right by X center
  detected.sort((a, b) => a.centerX - b.centerX);

  if (detected.length < 3) return null;

  // Validate uniqueness of recognized day headers
  const uniqueNames = new Set(detected.map(d => d.day));
  if (uniqueNames.size !== detected.length) return null;

  // Validate strict canonical ordering (Mon < Tue < Wed < Thu < Fri < Sat < Sun)
  for (let k = 1; k < detected.length; k++) {
    const prevIdx = DAY_CANONICAL.indexOf(detected[k - 1].day);
    const curIdx = DAY_CANONICAL.indexOf(detected[k].day);
    if (curIdx <= prevIdx) return null;
  }

  const boundaries = [];
  for (let i = 0; i < detected.length; i++) {
    const cur = detected[i];
    const left = (i === 0) 
      ? roomThreshold 
      : (detected[i - 1].centerX + cur.centerX) / 2;
    const right = (i === detected.length - 1) 
      ? pageWidth 
      : (cur.centerX + detected[i + 1].centerX) / 2;

    boundaries.push({ day: cur.day, left, right, centerX: cur.centerX });
  }

  return boundaries;
}

function getDayFromBoundaries(x, boundaries) {
  const active = (boundaries && boundaries.length >= 3) ? boundaries : DEFAULT_7DAY_BOUNDARIES;
  for (const col of active) {
    if (x >= col.left && x < col.right) return col.day;
  }
  let best = active[0].day, minD = Infinity;
  for (const col of active) {
    const d = Math.abs(x - col.centerX);
    if (d < minD) { minD = d; best = col.day; }
  }
  return best;
}

const RE_CODE = /#([A-Z][A-Z0-9\-]{3,})/i;
const RE_BATCH_BS = /BS\s+in\s+([A-Za-z\s]+?)\s+(Regular|Self\s+Support|Weekend\s+Self\s+Support|Self)\s*(\d*)\s*\(\s*(\d{4}-\d{4})\s*\)\s*Semester#(\d+)/i;
const RE_BATCH_MS = /(MS|PhD)\s+([A-Za-z\s]+?)\s*\(?(Weekend)?\)?\s*(Regular|Self\s+Support|Weekend\s+Self\s+Support|Self)?\s*(\d*)\s*\(\s*(\d{4}-\d{4})\s*\)\s*S(?:emester)?#?(\d*)/i;
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

  let type = 'Regular', section = '', batch = '', semester = 0, program = 'Unknown';
  const bsMatch = text.match(RE_BATCH_BS);
  const msMatch = text.match(RE_BATCH_MS);
  const semMatch = text.match(RE_SEMESTER);

  if (bsMatch) {
    program = "BS in " + bsMatch[1].trim();
    type = bsMatch[2].trim();
    if (type.toLowerCase() === 'self') type = 'Self Support';
    section = bsMatch[3].trim();
    batch = bsMatch[4].trim();
    semester = parseInt(bsMatch[5]);
  } else if (msMatch) {
    program = msMatch[1].trim() + " in " + msMatch[2].trim();
    type = msMatch[3] ? 'Weekend Self Support' : (msMatch[4] ? msMatch[4].trim() : 'Regular');
    if (type.toLowerCase() === 'self') type = 'Self Support';
    section = msMatch[5].trim();
    batch = msMatch[6] ? msMatch[6].trim() : '';
    semester = msMatch[7] && msMatch[7].length > 0 ? parseInt(msMatch[7]) : 0;
    if (semester === 0 && (text.includes('MS ') || text.includes('PhD '))) {
      const msSemMatch = text.match(/Semester#(\d+)/i);
      semester = msSemMatch ? parseInt(msSemMatch[1]) : 0;
    }
  } else if (semMatch) {
    semester = parseInt(semMatch[1]);
    if (text.toLowerCase().includes('self support') || text.toLowerCase().includes('self')) {
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
    teacher = teacher.replace(/BS\s+in\s+[A-Za-z\s]+.*$/i, '').trim();
    teacher = teacher.replace(/(MS|PhD)\s+[A-Za-z\s]+.*$/i, '').trim();
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

  return { name, code, type, section, batch, semester, startTime, endTime, teacher, program };
}

function dedup(lectures) {
  const seen = new Set();
  return lectures.filter(l => {
    const key = `${l.name}|${l.code}|${l.day}|${l.startTime}|${l.endTime}|${l.semester}|${l.type}|${l.section}|${l.teacher}|${l.program}`;
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
async function extractSchedule(pdfBuffer, userBatch, userSemester, userType, userProgram, userRole = 'student', userFullName = '') {
  try {
    const parser = new pdfImport.PDFParse({ data: new Uint8Array(pdfBuffer) });
    await parser.load();

    // ── Scanned PDF / Vector Outline Timetable Fallback ───────────────────────
    let totalTextLength = 0;
    for (let pageNum = 1; pageNum <= parser.doc.numPages; pageNum++) {
      const page = await parser.doc.getPage(pageNum);
      const textContent = await page.getTextContent();
      totalTextLength += textContent.items.map(item => item.str).join(' ').length;
    }

    if (totalTextLength < 100) {
      console.log(`[pdfParser] Scanned PDF detected (totalTextLength: ${totalTextLength}).`);
      throw new Error("This PDF appears to be a scanned image or contains no extractable text. Please ensure you upload the official, digitally-exported PDF of your department timetable.");
    }

    const allLectures = [];
    let docBoundaries = null;

    for (let pageNum = 1; pageNum <= parser.doc.numPages; pageNum++) {
      const page = await parser.doc.getPage(pageNum);
      const textContent = await page.getTextContent();

      // Premium Performance Pre-Flight Check:
      // Join all text items on the page and verify if it's relevant to the current query.
      // This reduces processing time by skipping unrelated pages, preventing client-side network timeouts.
      const pageText = textContent.items.map(item => item.str).join(' ');
      let isPageRelevant = false;

      if (userRole === 'teacher') {
        const normUser = userFullName.toLowerCase().replace(/[^a-z0-9]/gi, '');
        const normPage = pageText.toLowerCase().replace(/[^a-z0-9]/gi, '');
        if (normUser.length >= 3 && normPage.includes(normUser)) {
          isPageRelevant = true;
        }
      } else {
        const hasBatch = userBatch ? pageText.includes(userBatch) : true;
        let hasProgram = true;
        if (userProgram) {
          const progKeywords = userProgram.toLowerCase()
            .replace(/\s+/g, ' ')
            .replace(/\bin\b/gi, '')
            .split(' ')
            .filter(w => w.length > 2);
          hasProgram = progKeywords.some(keyword => pageText.toLowerCase().includes(keyword));
        }
        if (hasBatch && hasProgram) {
          isPageRelevant = true;
        }
      }

      if (!isPageRelevant) {
        continue; // Instantly skip this page!
      }

      const items = textContent.items
        .map(item => ({ str: item.str.trim(), x: item.transform[4], y: item.transform[5], width: item.width }))
        .filter(item => item.str !== '');

      const headerItem = items.find(i => i.str.includes('Room / Lab'));
      if (!headerItem) continue;
      const gridTopY = headerItem.y;

      // Extract and validate page dynamic day boundaries
      const headerRowItems = items.filter(i => Math.abs(i.y - gridTopY) < 10);
      const pageBoundaries = buildDynamicBoundaries(headerRowItems);
      if (pageBoundaries) {
        docBoundaries = pageBoundaries;
      }
      const activeBoundaries = pageBoundaries || docBoundaries || DEFAULT_7DAY_BOUNDARIES;

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
        const day = getDayFromBoundaries(seed.x, activeBoundaries);
        const block = [seed];
        used.add(i);

        let changed = true;
        while (changed) {
          changed = false;
          for (let j = 0; j < lectureItems.length; j++) {
            if (used.has(j)) continue;
            const candidate = lectureItems[j];
            if (getDayFromBoundaries(candidate.x, activeBoundaries) !== day) continue;
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
          if (!parsed.startTime || !parsed.endTime) {
            continue; // Filter out empty headers and noise blocks that don't have valid start/end times
          }
          const classId = `cls_${pageNum}_${block.day.substring(0, 3)}_${parsed.startTime.replace(':', '')}_${parsed.code.replace(/[^a-zA-Z0-9]/g, '')}_${allLectures.length}`;
          allLectures.push({
            classId,
            name: parsed.name, code: parsed.code, room: roomName,
            day: block.day, startTime: parsed.startTime, endTime: parsed.endTime,
            teacher: parsed.teacher, batch: parsed.batch, semester: parsed.semester,
            type: parsed.type, section: parsed.section, program: parsed.program, page: pageNum
          });
        }
      }
    }

    const final = dedup(allLectures);

    if (userRole === 'global') {
      return final;
    }

    if (userRole === 'teacher') {
      const normalizeTeacher = (name) => {
        if (!name) return '';
        return name.toLowerCase()
          .replace(/\b(dr|prof|mr|ms|mrs|engr)\b\.?/gi, '')
          .replace(/[^a-z0-9]/gi, '')
          .trim();
      };
      const normUser = normalizeTeacher(userFullName);
      return final.filter(cls => {
        const normCls = normalizeTeacher(cls.teacher);
        if (normUser.length >= 3 && normCls.length >= 3) {
          return normCls.includes(normUser) || normUser.includes(normCls);
        }
        return false;
      });
    }

    // Filter results specifically for the user
    const targetSemester = Number(userSemester);
    const rawUserType = (userType || 'Regular').trim();
    
    // Strict normalizer for program names
    const extractProgramKey = (name) => {
      if (!name) return null;
      const clean = name.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (!clean) return null;
      let degree = 'BS';
      if (clean.startsWith('phd')) degree = 'PhD';
      else if (clean.startsWith('ms')) degree = 'MS';
      
      let key = clean;
      if (clean.includes('cyber')) key = 'cybersecurity';
      else if (clean.includes('software')) key = 'softwareengineering';
      else if (clean.includes('informationtech') || clean.includes('bsit') || clean.includes('msit') || clean.includes('phdit')) key = 'informationtechnology';
      else if (clean.includes('datascience')) key = 'datascience';
      else if (clean.includes('artificialintel') || clean.includes('ai')) key = 'artificialintelligence';
      else if (clean.includes('cloud')) key = 'cloudcomputing';
      else if (clean.includes('computer')) key = 'computerscience';
      return `${degree}_${key}`;
    };

    const targetProgramKey = extractProgramKey(userProgram);
    
    // Target Section & Type matching
    let targetIsSelf = false;
    let targetSection = null;
    if (/self\s*support\s*2/i.test(rawUserType)) {
      targetIsSelf = true;
      targetSection = '2';
    } else if (/self\s*support\s*1/i.test(rawUserType)) {
      targetIsSelf = true;
      targetSection = '1';
    } else if (/self/i.test(rawUserType)) {
      targetIsSelf = true;
    } else {
      targetIsSelf = false;
    }

    const filtered = final.filter(cls => {
      const clsSemester = Number(cls.semester);
      const clsType = (cls.type || '').toLowerCase();
      
      // 1. Semester Match
      if (targetSemester > 0 && clsSemester !== targetSemester) {
        return false;
      }
      
      // 2. Program Match
      if (targetProgramKey) {
        const clsProgKey = extractProgramKey(cls.program);
        if (!clsProgKey || clsProgKey !== targetProgramKey) {
          return false;
        }
      }
      
      // 3. Support Type Match
      const clsIsSelf = clsType.includes('self');
      if (clsIsSelf !== targetIsSelf) {
        return false;
      }

      // 4. Section Match for Self Support
      if (targetIsSelf && targetSection) {
        const clsSection = String(cls.section || '').trim();
        if (clsSection && clsSection !== targetSection) {
          return false;
        }
      }

      return true;
    });

    return filtered;
  } catch (error) {
    throw new Error(`PDF parsing failed: ${error.message}`);
  }
}

module.exports = { extractSchedule };
