export interface ParsedLocation {
  department: string;
  roomNumber: string;
  full: string;
}

/**
 * Parses raw timetable room/location strings into structured department and building/room parts.
 *
 * Examples:
 * - "Department of Software Engineering NAB CR-227" ->
 *   { department: "Department of Software Engineering", roomNumber: "NAB CR-227", full: ... }
 * - "Department of Software Engineering MAB L-03" ->
 *   { department: "Department of Software Engineering", roomNumber: "MAB L-03", full: ... }
 * - "Department of Computer Science Smart Lab" ->
 *   { department: "Department of Computer Science", roomNumber: "Smart Lab", full: ... }
 * - "Department of Social Work" ->
 *   { department: "Department of Social Work", roomNumber: "", full: ... }
 * - "Physics Hall" ->
 *   { department: "Physics Hall", roomNumber: "", full: ... }
 */
export function parseLocation(raw?: string | null): ParsedLocation {
  if (!raw || typeof raw !== 'string') {
    return { department: 'TBA', roomNumber: '', full: 'TBA' };
  }

  const trimmed = raw.trim();
  if (trimmed === '' || trimmed === 'Unknown' || trimmed.startsWith('http')) {
    return { department: trimmed || 'TBA', roomNumber: '', full: trimmed || 'TBA' };
  }

  // Regex to separate Department / Institute / College / Faculty prefix from building and room codes:
  // Recognizes common campus building/room patterns like:
  // NAB, MAB, IKM, ALB, ABN, AKM, IAH, JBN, ARB, SEEC, Maryam Hall, Smart Lab,
  // CR-..., L-..., Hall-...
  const buildingRegex =
    /^(.*?)\s+((?:NAB|MAB|IKM|ALB|ABN|AKM|IAH|JBN|ARB|SEEC|Maryam\s+Hall|Smart\s+Lab|CR\s*-\s*(?:NO-)?\s*\d+|L\s*-\s*\d+|Hall\s*-\s*\d+).*)$/i;

  const match = trimmed.match(buildingRegex);
  if (match) {
    const dept = match[1].trim();
    const room = match[2].trim();
    if (dept.length > 0) {
      return {
        department: dept,
        roomNumber: room,
        full: trimmed,
      };
    }
  }

  return {
    department: trimmed,
    roomNumber: '',
    full: trimmed,
  };
}
