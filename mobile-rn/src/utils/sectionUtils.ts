export type CanonicalSection = 'Regular' | 'Self Support 1' | 'Self Support 2';

/**
 * Normalizes any section/type representation to one of the 3 canonical sections:
 * 'Regular', 'Self Support 1', or 'Self Support 2'.
 * Strict exact matching with harmless whitespace, dash, roman numeral, and casing tolerance.
 */
export function normalizeSection(
  type?: string | null,
  section?: string | number | null
): CanonicalSection {
  const cleanType = String(type || '').trim();
  const cleanSec = String(section || '').trim();

  // 1. Explicit 'Self Support 2' or 'Self Support II' in the type string or section (highest priority)
  if (
    /self[\s\-_]*support[\s\-_]*(2|ii)\b/i.test(cleanType) ||
    /self[\s\-_]*support[\s\-_]*(2|ii)\b/i.test(cleanSec)
  ) {
    return 'Self Support 2';
  }

  // 2. Explicit 'Self Support 1' or 'Self Support I' in the type string or section
  if (
    /self[\s\-_]*support[\s\-_]*(1|i)\b/i.test(cleanType) ||
    /self[\s\-_]*support[\s\-_]*(1|i)\b/i.test(cleanSec)
  ) {
    return 'Self Support 1';
  }

  // 3. Generic 'Self Support' type + explicit section digit/numeral in the section field
  if (
    /self/i.test(cleanType) &&
    (cleanSec === '2' || cleanSec === '02' || /^ii$/i.test(cleanSec))
  ) {
    return 'Self Support 2';
  }
  if (
    /self/i.test(cleanType) &&
    (cleanSec === '1' || cleanSec === '01' || /^i$/i.test(cleanSec))
  ) {
    return 'Self Support 1';
  }

  // 4. Bare 'Self Support' with no usable section number — cannot determine which section.
  //    Return Regular to avoid a silent wrong-section match rather than guessing.
  if (/self/i.test(cleanType)) {
    return 'Regular';
  }

  // 5. Everything else is Regular
  return 'Regular';
}

/**
 * Derives the exact available class type/category display string for any lecture record:
 * Returns 'Regular', 'Self Support 1', 'Self Support 2', or any other valid category present in the source data.
 * Normalizes variants like 'Self Support-1', 'Self Support 1', 'Self Support I', 'Self Support 2', 'Self Support II'
 * without collapsing everything to 'Self Support'.
 */
export function getClassSectionDisplay(cls?: {
  type?: string | null;
  section?: string | number | null;
} | null): string {
  if (!cls) return 'Regular';
  const cleanType = String(cls.type || '').trim();
  const cleanSec = String(cls.section || '').trim();

  // Helper to normalize Roman numerals / digits
  const normalizeSecVal = (val: string): string => {
    const v = val.trim();
    if (/^ii$/i.test(v)) return '2';
    if (/^i$/i.test(v)) return '1';
    if (/^iii$/i.test(v)) return '3';
    return v.replace(/^0+/, '') || v;
  };

  // 1. Explicit Self Support with digit/Roman in type string (e.g. 'Self Support 1', 'Self Support-1', 'Self Support I', 'Self Support 2', 'Self Support II')
  const ssTypeMatch = cleanType.match(/self[\s\-_]*support[\s\-_]*(1|2|3|4|5|i{1,3})\b/i);
  if (ssTypeMatch) {
    return `Self Support ${normalizeSecVal(ssTypeMatch[1])}`;
  }

  // 2. Generic Self Support type + explicit section digit/Roman
  if (/self[\s\-_]*support/i.test(cleanType) || /^self$/i.test(cleanType)) {
    const secDigitMatch = cleanSec.match(/^(0*\d+|i{1,3})$/i);
    if (secDigitMatch) {
      return `Self Support ${normalizeSecVal(secDigitMatch[1])}`;
    }
    const ssSecMatch = cleanSec.match(/self[\s\-_]*support[\s\-_]*(1|2|3|4|5|i{1,3})\b/i);
    if (ssSecMatch) {
      return `Self Support ${normalizeSecVal(ssSecMatch[1])}`;
    }
    if (cleanSec && cleanSec !== '0' && !/regular/i.test(cleanSec)) {
      return `Self Support ${cleanSec}`;
    }
    return 'Self Support';
  }

  // 3. Weekend Self Support
  if (/weekend[\s\-_]*self[\s\-_]*support/i.test(cleanType)) {
    const secDigitMatch = cleanSec.match(/^(0*\d+|i{1,3})$/i);
    if (secDigitMatch) {
      return `Weekend Self Support ${normalizeSecVal(secDigitMatch[1])}`;
    }
    return 'Weekend Self Support';
  }

  // 4. Regular
  if (/regular/i.test(cleanType)) {
    if (cleanSec && cleanSec !== '0' && !/regular/i.test(cleanSec)) {
      return `Regular ${cleanSec}`;
    }
    return 'Regular';
  }

  // 5. If cleanType is non-empty, preserve original category with normalized spacing/dashes
  if (cleanType) {
    const normalized = cleanType.replace(/[\s\-_]+/g, ' ');
    if (cleanSec && cleanSec !== '0' && !normalized.includes(cleanSec)) {
      return `${normalized} ${cleanSec}`;
    }
    return normalized;
  }

  // 6. If cleanType is empty but cleanSec exists
  if (cleanSec && cleanSec !== '0') {
    const ssSecMatch = cleanSec.match(/self[\s\-_]*support[\s\-_]*(1|2|3|4|5|i{1,3})\b/i);
    if (ssSecMatch) {
      return `Self Support ${normalizeSecVal(ssSecMatch[1])}`;
    }
    if (/regular/i.test(cleanSec)) {
      return 'Regular';
    }
    return cleanSec;
  }

  return 'Regular';
}

