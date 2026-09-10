import { parseLocation } from '../utils/locationUtils';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
}

export function runLocationUtilsTests() {
  // Test 1: Department of Software Engineering NAB CR-227
  const r1 = parseLocation('Department of Software Engineering NAB CR-227');
  assert(r1.department === 'Department of Software Engineering', 'r1 department must match');
  assert(r1.roomNumber === 'NAB CR-227', 'r1 roomNumber must match');
  assert(r1.full === 'Department of Software Engineering NAB CR-227', 'r1 full must match');

  // Test 2: Department of Software Engineering NAB CR-226
  const r2 = parseLocation('Department of Software Engineering NAB CR-226');
  assert(r2.department === 'Department of Software Engineering', 'r2 department must match');
  assert(r2.roomNumber === 'NAB CR-226', 'r2 roomNumber must match');

  // Test 3: Department of Software Engineering MAB L-03
  const r3 = parseLocation('Department of Software Engineering MAB L-03');
  assert(r3.department === 'Department of Software Engineering', 'r3 department must match');
  assert(r3.roomNumber === 'MAB L-03', 'r3 roomNumber must match');

  // Test 4: SEEC format
  const r4 = parseLocation('Department of Electrical Engineering SEEC-406');
  assert(r4.department === 'Department of Electrical Engineering', 'r4 department must match');
  assert(r4.roomNumber === 'SEEC-406', 'r4 roomNumber must match');

  // Test 5: Maryam Hall & Smart Lab
  const r5 = parseLocation('Department of Information Technology Maryam Hall CR-5');
  assert(r5.department === 'Department of Information Technology', 'r5 department must match');
  assert(r5.roomNumber === 'Maryam Hall CR-5', 'r5 roomNumber must match');

  const r6 = parseLocation('Department of Computer Science Smart Lab');
  assert(r6.department === 'Department of Computer Science', 'r6 department must match');
  assert(r6.roomNumber === 'Smart Lab', 'r6 roomNumber must match');

  // Test 6: CR and L variations
  const r7 = parseLocation('Department of Islamic Studies CR-NO-75');
  assert(r7.department === 'Department of Islamic Studies', 'r7 department must match');
  assert(r7.roomNumber === 'CR-NO-75', 'r7 roomNumber must match');

  const r8 = parseLocation('Institute of Chemistry CR- 174');
  assert(r8.department === 'Institute of Chemistry', 'r8 department must match');
  assert(r8.roomNumber === 'CR- 174', 'r8 roomNumber must match');

  // Test 7: Standalone departments
  const r9 = parseLocation('Department of Social Work');
  assert(r9.department === 'Department of Social Work', 'r9 department must match');
  assert(r9.roomNumber === '', 'r9 roomNumber must be empty');

  // Test 8: Standalone halls
  const r10 = parseLocation('Physics Hall');
  assert(r10.department === 'Physics Hall', 'r10 department must match');
  assert(r10.roomNumber === '', 'r10 roomNumber must be empty');

  // Test 9: Null / empty / unknown
  const r11 = parseLocation('');
  assert(r11.department === 'TBA' && r11.roomNumber === '', 'empty location fallback');

  const r12 = parseLocation(null);
  assert(r12.department === 'TBA' && r12.roomNumber === '', 'null location fallback');

  const r13 = parseLocation('Unknown');
  assert(r13.department === 'Unknown' && r13.roomNumber === '', 'unknown location fallback');

  return true;
}

// Execute tests
runLocationUtilsTests();
console.log('✓ All locationUtils tests passed successfully!');
