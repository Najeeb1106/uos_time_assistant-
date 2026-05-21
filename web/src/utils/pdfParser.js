/**
 * Client-Side PDF Parser Utility for UOS Timetable
 * Performs coordinate-based extraction in the browser using PDF.js
 * 
 * === Architecture ===
 * The UOS timetable PDF has a rigid grid layout:
 *   - Room names are in the leftmost column (x < 45).
 *   - Day header labels (Monday-Sunday) are at known fixed x-centers.
 *   - Each lecture entry occupies a 3-line vertical block within a day column:
 *       Line 1: Course Name #CODE
 *       Line 2: BS in Software Engineering <Type> <Section> ( <Batch> ) Semester#<N>
 *       Line 3: Teacher Name (HH:MM - HH:MM)
 *   - Items in the room column at x=45-89 are actually the leftmost day-column lecture
 *     content, NOT room labels. Room labels only appear at x < 45.
 *
 * === Known PDF Layout Constants ===
 *   Room column:  x < 45
 *   Lecture area:  x >= 45  (includes the Monday column which starts around x=64)
 *   Room label grouping:  fragments within Δy < 8 belong to the same room name
 *   Lecture block grouping:  items within same day column and Δy < 12 form a 3-line block
 *   Room-to-lecture matching: each lecture block's Y is matched to the closest room band
 */

const PDFJS_VERSION = '3.4.120';
const PDFJS_CDN = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.min.js`;
const PDFJS_WORKER_CDN = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.min.js`;

// ── CDN Loader ─────────────────────────────────────────────────────────────

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(script);
  });
}

async function getPdfJs() {
  if (window.pdfjsLib) return window.pdfjsLib;
  await loadScript(PDFJS_CDN);
  const pdfjsLib = window.pdfjsLib;
  if (!pdfjsLib) throw new Error('PDF.js not found on window after script load.');
  pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_CDN;
  return pdfjsLib;
}

// ── Day-Column X-Coordinate Map ────────────────────────────────────────────

const DAY_COLUMNS = [
  { day: 'Monday',    center: 99.0  },
  { day: 'Tuesday',   center: 204.8 },
  { day: 'Wednesday', center: 309.6 },
  { day: 'Thursday',  center: 418.9 },
  { day: 'Friday',    center: 527.0 },
  { day: 'Saturday',  center: 629.0 },
  { day: 'Sunday',    center: 734.0 },
];

// Day column boundaries: midpoints between consecutive centers
const DAY_BOUNDARIES = [];
for (let i = 0; i < DAY_COLUMNS.length; i++) {
  const left = i === 0
    ? 45  // lecture area starts at x=45
    : (DAY_COLUMNS[i - 1].center + DAY_COLUMNS[i].center) / 2;
  const right = i === DAY_COLUMNS.length - 1
    ? 900 // generous right margin
    : (DAY_COLUMNS[i].center + DAY_COLUMNS[i + 1].center) / 2;
  DAY_BOUNDARIES.push({ day: DAY_COLUMNS[i].day, left, right, center: DAY_COLUMNS[i].center });
}

function getDay(x) {
  for (const col of DAY_BOUNDARIES) {
    if (x >= col.left && x < col.right) return col.day;
  }
  // Fallback: closest center
  let best = 'Monday', minD = Infinity;
  for (const col of DAY_COLUMNS) {
    const d = Math.abs(x - col.center);
    if (d < minD) { minD = d; best = col.day; }
  }
  return best;
}

// ── Room X threshold ───────────────────────────────────────────────────────
// Real room labels only appear at x < 45. Everything at x >= 45 is lecture content.
const ROOM_X_THRESHOLD = 45;

// ── Room Label Grouping Threshold ──────────────────────────────────────────
// Adjacent room text fragments with Δy < 8 are merged into one room name.
// This is tight enough to avoid merging separate rooms (gap between rooms on
// densest page is ~17 units) but loose enough to merge multi-line room names
// (typical room label spans ~13 units vertically).
const ROOM_GROUP_DY = 8;

// ── Lecture Block Grouping Threshold ───────────────────────────────────────
// Items in the same day column within Δy < 12 form a single 3-line lecture block.
// 3-line blocks typically span ~8-10 units. We use 12 for safety but not so
// large that we merge separate lecture entries (minimum gap between consecutive
// entries in the same column is ~14 units).
const LECTURE_BLOCK_DY = 12;

// ── Regex Patterns ─────────────────────────────────────────────────────────

// Code must be at least 4 chars to avoid truncated PDF artifacts like "#U…"
const RE_CODE = /#([A-Z][A-Z0-9\-]{3,})/i;

const RE_BATCH_BSSE = /BS\s+in\s+Software\s+Engineering\s+(Regular|Self\s+Support|Weekend\s+Self\s+Support)\s*(\d*)\s*\(\s*(\d{4}-\d{4})\s*\)\s*Semester#(\d+)/i;

// MS batch lines often get truncated by PDF renderer (e.g. "MS Software Engineering (Weekend) Self Support 1 ( 2026-2028 ) S…")
const RE_BATCH_MS = /MS\s+Software\s+Engineering\s*\(?(Weekend)?\)?\s*(Self\s+Support)?\s*\d*\s*\(\s*(\d{4}-\d{4})\s*\)\s*S(?:emester)?#?(\d*)/i;

const RE_SEMESTER = /Semester#(\d+)/i;

const RE_TIME = /\((\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})\)/;

// ── Main Parser ────────────────────────────────────────────────────────────

/**
 * Parses an official UOS PDF timetable from an ArrayBuffer client-side.
 * @param {ArrayBuffer} arrayBuffer - The PDF raw binary data
 * @param {Function}    onProgress  - Callback (progressPercent, statusText)
 * @returns {Promise<Array>} Array of parsed class objects
 */
export async function parseTimetablePdf(arrayBuffer, onProgress = () => {}) {
  onProgress(5, 'Initializing PDF parser libraries...');
  const pdfjsLib = await getPdfJs();

  onProgress(15, 'Loading PDF document streams...');
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
  const pdf = await loadingTask.promise;
  const numPages = pdf.numPages;

  const allLectures = [];

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const pct = Math.round(15 + (pageNum / numPages) * 70);
    onProgress(pct, `Extracting coordinates on page ${pageNum} of ${numPages}...`);

    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();

    const items = textContent.items
      .map(item => ({
        str: item.str.trim(),
        x: item.transform[4],
        y: item.transform[5],
        width: item.width,
      }))
      .filter(item => item.str !== '');

    // ── 1. Find grid header ────────────────────────────────────────────
    const headerItem = items.find(i => i.str.includes('Room / Lab'));
    if (!headerItem) {
      console.warn(`Page ${pageNum}: no 'Room / Lab' header found. Skipping.`);
      continue;
    }
    const gridTopY = headerItem.y;

    // Everything below the header line is the grid body
    const gridItems = items.filter(i => i.y < gridTopY);

    // ── 2. Extract room labels (x < 45 only) ──────────────────────────
    const roomItems = gridItems
      .filter(i => i.x < ROOM_X_THRESHOLD)
      .sort((a, b) => b.y - a.y); // top-to-bottom (descending Y)

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

    // Build clean room name strings
    for (const room of rooms) {
      room.name = room.parts.join(' ').replace(/\s+/g, ' ').trim();
      room.yCenter = (room.yMax + room.yMin) / 2;
    }

    // ── 3. Compute room Y-bands for assignment ─────────────────────────
    // Each room "owns" the vertical band from its top to the midpoint
    // between it and the next room below. The lowest room extends to y=0.
    // Rooms are sorted top-to-bottom (descending Y).
    for (let i = 0; i < rooms.length; i++) {
      rooms[i].bandTop = (i === 0) ? gridTopY : (rooms[i - 1].yMin + rooms[i].yMax) / 2;
      rooms[i].bandBottom = (i === rooms.length - 1) ? 0 : (rooms[i].yMin + rooms[i + 1].yMax) / 2;
    }

    // ── 4. Extract lecture items (x >= 45) ─────────────────────────────
    const lectureItems = gridItems
      .filter(i => i.x >= ROOM_X_THRESHOLD)
      .sort((a, b) => b.y - a.y); // top-to-bottom

    // ── 5. Group into 3-line lecture blocks ─────────────────────────────
    // Group by BOTH day column AND vertical proximity.
    // A block is seeded from the first ungrouped item. All other items
    // in the same day column within LECTURE_BLOCK_DY of ANY item already
    // in the block are absorbed (transitive closure).
    const used = new Set();
    const lectureBlocks = [];

    for (let i = 0; i < lectureItems.length; i++) {
      if (used.has(i)) continue;
      const seed = lectureItems[i];
      const day = getDay(seed.x);
      const block = [seed];
      used.add(i);

      // Grow the block transitively
      let changed = true;
      while (changed) {
        changed = false;
        for (let j = 0; j < lectureItems.length; j++) {
          if (used.has(j)) continue;
          const candidate = lectureItems[j];
          if (getDay(candidate.x) !== day) continue;
          // Check proximity to ANY member of the block
          const close = block.some(b => Math.abs(b.y - candidate.y) < LECTURE_BLOCK_DY);
          if (close) {
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

    // ── 6. For each block: assign room + extract metadata ──────────────
    for (const block of lectureBlocks) {
      // Match room by Y-band
      let roomName = 'Unknown';
      for (const room of rooms) {
        if (block.y <= room.bandTop && block.y >= room.bandBottom) {
          roomName = room.name;
          break;
        }
      }
      // Fallback: closest room center
      if (roomName === 'Unknown' && rooms.length > 0) {
        let minD = Infinity;
        for (const room of rooms) {
          const d = Math.abs(block.y - room.yCenter);
          if (d < minD) { minD = d; roomName = room.name; }
        }
      }

      // ── Parse individual class entries from the block text ──────────
      // A single block can contain ONE entry (3 lines) or, rarely,
      // multiple entries that got grouped together. We split them by
      // finding each occurrence of the time pattern (HH:MM - HH:MM).
      const entries = splitBlockIntoEntries(block.text);

      for (const entry of entries) {
        const parsed = parseEntry(entry);
        allLectures.push({
          classId: 'p_' + Math.random().toString(36).substring(2, 9),
          name: parsed.name,
          code: parsed.code,
          room: roomName,
          day: block.day,
          startTime: parsed.startTime,
          endTime: parsed.endTime,
          teacher: parsed.teacher,
          batch: parsed.batch,
          semester: parsed.semester,
          type: parsed.type,
          section: parsed.section,
          page: pageNum,
        });
      }
    }
  }

  onProgress(90, 'Cleaning and deduplicating results...');

  // ── 7. Post-process: deduplicate exact copies ──────────────────────────
  const deduped = deduplicateLectures(allLectures);

  onProgress(95, 'Structuring parsed calendar timetable...');
  return deduped;
}

// ── Entry Splitter ─────────────────────────────────────────────────────────

/**
 * Splits a merged block text into individual class entries.
 * Each entry ends with a time pattern like "(08:00 - 09:30)".
 * If no time pattern is found, the entire text is one entry.
 */
function splitBlockIntoEntries(text) {
  const timeRe = /\(\d{2}:\d{2}\s*-\s*\d{2}:\d{2}\)/g;
  const matches = [...text.matchAll(timeRe)];

  if (matches.length <= 1) {
    return [text]; // single entry or no time found
  }

  // Split text at each time match boundary: each entry ends after its time
  const entries = [];
  let lastEnd = 0;
  for (const m of matches) {
    const entryEnd = m.index + m[0].length;
    entries.push(text.substring(lastEnd, entryEnd).trim());
    lastEnd = entryEnd;
  }
  // Anything remaining after the last time goes to the last entry
  if (lastEnd < text.length) {
    const remainder = text.substring(lastEnd).trim();
    if (remainder) {
      entries[entries.length - 1] += '\n' + remainder;
    }
  }

  return entries.filter(e => e.length > 0);
}

// ── Entry Parser ───────────────────────────────────────────────────────────

function parseEntry(text) {
  // Code: first #CODE occurrence (must be 4+ chars to avoid truncated artifacts)
  const codeMatch = text.match(RE_CODE);
  let code = codeMatch ? codeMatch[1].trim() : '';
  // Strip trailing ellipsis or truncation markers
  code = code.replace(/[…]+$/, '').trim();

  // Batch & semester
  let type = 'Regular', section = '', batch = '', semester = 0;

  const bsseMatch = text.match(RE_BATCH_BSSE);
  const msMatch = text.match(RE_BATCH_MS);
  const semMatch = text.match(RE_SEMESTER);

  if (bsseMatch) {
    type = bsseMatch[1].trim();
    section = bsseMatch[2].trim();
    batch = bsseMatch[3].trim();
    semester = parseInt(bsseMatch[4]);
  } else if (msMatch) {
    type = msMatch[1] ? 'Weekend Self Support' : (msMatch[2] ? 'Self Support' : 'Regular');
    batch = msMatch[3] ? msMatch[3].trim() : '';
    semester = msMatch[4] && msMatch[4].length > 0 ? parseInt(msMatch[4]) : 0;
    // MS programs are typically semester 1 or 2; if truncated, try harder
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

  // Time
  const timeMatch = text.match(RE_TIME);
  const startTime = timeMatch ? timeMatch[1] : '';
  const endTime = timeMatch ? timeMatch[2] : '';

  // Teacher: the text immediately before the time parenthesis, on the same "line"
  let teacher = 'Unknown';
  if (timeMatch) {
    const beforeTime = text.substring(0, timeMatch.index).trim();
    // The teacher name is the last logical segment before the time.
    // It can span after a newline or after the semester line.
    const segments = beforeTime.split('\n');
    const lastSeg = segments[segments.length - 1].trim();
    // If the last segment looks like a batch description, look one more back
    if (lastSeg.match(/Semester#\d+/i) || lastSeg.match(/^\d{4}-\d{4}$/)) {
      teacher = segments.length >= 2 ? segments[segments.length - 2].trim() : lastSeg;
    } else {
      teacher = lastSeg;
    }
    // Clean: remove trailing batch fragments that might be stuck
    teacher = teacher.replace(/BS\s+in\s+Software\s+Engineering.*$/i, '').trim();
    teacher = teacher.replace(/MS\s+Software\s+Engineering.*$/i, '').trim();
    teacher = teacher.replace(/Semester#\d+.*/i, '').trim();
    // If teacher still looks like a course name or contains #, it's wrong
    if (teacher.includes('#') || teacher.length === 0) {
      teacher = 'Unknown';
    }
  }

  // Course name: text before the first '#'
  let name = 'Unknown Course';
  const hashIdx = text.indexOf('#');
  if (hashIdx !== -1) {
    const beforeHash = text.substring(0, hashIdx).trim();
    const nameParts = beforeHash.split('\n');
    name = nameParts[nameParts.length - 1].trim();
  } else {
    // No hash at all — take the first line as name
    const firstLine = text.split('\n')[0].trim();
    name = firstLine || 'Unknown Course';
  }

  // Validate name: if it looks like "Teacher (time)" instead of a course name, skip
  if (name.match(/^\w[\w\s.]+\(\d{2}:\d{2}/)) {
    // The "name" is actually a teacher+time line, meaning the course info is missing
    // Try to extract from full text
    const altCode = text.match(/#([A-Z0-9][\w-]+)/i);
    if (altCode) {
      const altIdx = text.indexOf('#' + altCode[1]);
      const altBefore = text.substring(0, altIdx).trim().split('\n');
      name = altBefore[altBefore.length - 1].trim();
    }
    if (name.match(/^\w[\w\s.]+\(\d{2}:\d{2}/)) {
      name = 'Unknown Course';
    }
  }

  return { name, code, type, section, batch, semester, startTime, endTime, teacher };
}

// ── Deduplication ──────────────────────────────────────────────────────────

function deduplicateLectures(lectures) {
  const seen = new Set();
  return lectures.filter(l => {
    const key = `${l.name}|${l.code}|${l.day}|${l.startTime}|${l.endTime}|${l.semester}|${l.type}|${l.section}|${l.teacher}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
