import builtinData from '../constants/builtinTimetable.json';
import { normalizeProgramKey, normalizeBatch } from './builtinScheduleUtils';

/**
 * Standard selectable start years for university cohorts.
 */
export const START_YEAR_OPTIONS: string[] = [
  '2018',
  '2019',
  '2020',
  '2021',
  '2022',
  '2023',
  '2024',
  '2025',
  '2026',
  '2027',
  '2028',
  '2029',
  '2030',
];

/**
 * Standard selectable end years.
 */
export const ALL_END_YEARS: string[] = [
  '2020',
  '2021',
  '2022',
  '2023',
  '2024',
  '2025',
  '2026',
  '2027',
  '2028',
  '2029',
  '2030',
  '2031',
  '2032',
  '2033',
  '2034',
  '2035',
];

/**
 * Returns available end year options for a given start year.
 * Only years strictly greater than startYear are returned to prevent invalid intervals.
 */
export function getEndYearOptions(startYear?: string | number | null): string[] {
  if (!startYear) return ALL_END_YEARS;
  const startNum = Number(startYear);
  if (isNaN(startNum)) return ALL_END_YEARS;

  const valid = ALL_END_YEARS.filter((y) => Number(y) > startNum);
  if (valid.length > 0) return valid;

  // Fallback if startYear is at the upper edge
  return [
    String(startNum + 1),
    String(startNum + 2),
    String(startNum + 3),
    String(startNum + 4),
    String(startNum + 5),
  ];
}

/**
 * Parses a combined batch string (e.g. "2026-2030" or "2026 - 2030")
 * into its individual startYear and endYear components.
 */
export function parseBatch(batch: string | null | undefined): {
  startYear: string;
  endYear: string;
} {
  if (!batch) return { startYear: '', endYear: '' };
  const cleaned = batch.replace(/\s+/g, '');
  const parts = cleaned.split('-');
  if (parts.length >= 2 && parts[0] && parts[1]) {
    return { startYear: parts[0], endYear: parts[1] };
  }
  return { startYear: '', endYear: '' };
}

/**
 * Combines startYear and endYear into a canonical batch string (e.g. "2026-2030").
 */
export function formatBatch(
  startYear: string | number | null | undefined,
  endYear: string | number | null | undefined
): string {
  const s = String(startYear || '').trim();
  const e = String(endYear || '').trim();
  if (s && e) return `${s}-${e}`;
  if (s) return s;
  return '';
}

/**
 * Derives all unique, valid batch strings for a given program and semester
 * directly from the builtin timetable dataset.
 *
 * Returns batches sorted in descending order (newest cohort first).
 *
 * @param program - Full program name, e.g. 'BS in Artificial Intelligence'
 * @param semester - Semester number, e.g. 1 or 2
 * @returns Sorted array of unique batch strings that have real timetable data
 */
export function getValidBatches(
  program: string | null | undefined,
  semester: number | null | undefined
): string[] {
  if (!program || !semester) return [];

  const userProg = normalizeProgramKey(program);
  if (!userProg) return [];

  const sem = Number(semester);
  if (!sem || sem <= 0) return [];

  const batches = new Set<string>();

  for (const cls of builtinData as any[]) {
    if (!cls.program || !cls.batch || cls.semester === undefined) continue;
    if (Number(cls.semester) !== sem) continue;

    const clsProg = normalizeProgramKey(cls.program);
    if (!clsProg) continue;
    if (clsProg.degree !== userProg.degree || clsProg.key !== userProg.key) continue;

    const b = normalizeBatch(cls.batch);
    if (b) batches.add(b);
  }

  // Sort descending (newest batch year first)
  return Array.from(batches).sort((a, b) => b.localeCompare(a));
}

/**
 * Returns the single recommended batch for a (program, semester) pair when
 * exactly one batch exists in the timetable for that combination.
 *
 * Returns null when:
 *  - No timetable data exists for the combination (unknown program/sem)
 *  - Multiple valid batches exist (user must choose explicitly)
 *
 * @param program - Full program name
 * @param semester - Semester number
 * @returns The unique batch string, or null
 */
export function getSuggestedBatch(
  program: string | null | undefined,
  semester: number | null | undefined
): string | null {
  const valid = getValidBatches(program, semester);
  return valid.length === 1 ? valid[0] : null;
}

