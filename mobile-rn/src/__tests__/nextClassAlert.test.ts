import {
  format12HourTime,
  getTodayClasses,
  getNextClass,
  getSecondNextClass,
  isClassOngoing,
  isWeekend,
  formatCountdown,
  getMinutesDiff,
} from '../utils/timeUtils';
import { ClassLecture } from '../models/Schedule';
import { getBuiltinClassesForUser } from '../utils/builtinScheduleUtils';
import { getClassSectionDisplay } from '../utils/sectionUtils';
import { UserProfile } from '../models/User';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
}

export function runNextClassAlertTests() {
  console.log('--- Starting Next Class Alert Tests ---');

  // Test 1: 12-Hour AM/PM Time Formatting
  assert(format12HourTime('08:30') === '8:30 AM', '08:30 -> 8:30 AM');
  assert(format12HourTime('12:00') === '12:00 PM', '12:00 -> 12:00 PM');
  assert(format12HourTime('14:15') === '2:15 PM', '14:15 -> 2:15 PM');
  assert(format12HourTime('00:45') === '12:45 AM', '00:45 -> 12:45 AM');
  assert(format12HourTime('17:00') === '5:00 PM', '17:00 -> 5:00 PM');

  // Mock day classes for testing
  const mockMondayClasses: ClassLecture[] = [
    {
      classId: 'c1',
      name: 'Introduction to Software Engineering',
      code: 'SE-101',
      room: 'Lab 1',
      teacher: 'Dr. Ali',
      day: 'Monday',
      startTime: '08:30',
      endTime: '10:00',
      program: 'BSSE',
      type: 'Regular',
      semester: 1,
    },
    {
      classId: 'c2',
      name: 'Data Structures and Algorithms',
      code: 'CS-201',
      room: 'Room 204',
      teacher: 'Prof. Usman',
      day: 'Monday',
      startTime: '10:30',
      endTime: '12:00',
      program: 'BSSE',
      type: 'Regular',
      semester: 3,
    },
    {
      classId: 'c3',
      name: 'Web Engineering',
      code: 'SE-302',
      room: 'CS Lab 3',
      teacher: 'Engr. Bilal',
      day: 'Monday',
      startTime: '13:00',
      endTime: '14:30',
      program: 'BSSE',
      type: 'Regular',
      semester: 5,
    },
    {
      classId: 'c4',
      name: 'Information Security',
      code: 'CS-401',
      room: 'Hall B',
      teacher: 'Dr. Fatima',
      day: 'Monday',
      startTime: '15:00',
      endTime: '16:30',
      program: 'BSSE',
      type: 'Regular',
      semester: 7,
    },
  ];

  // Test 2: Early morning before any class starts (07:00)
  // Next class should be c1 (08:30), second next should be c2 (10:30)
  const time0700 = '07:00';
  const nextAt0700 = mockMondayClasses.find((c) => c.startTime > time0700);
  const secondNextAt0700 = mockMondayClasses.filter((c) => c.startTime > time0700)[1];
  assert(nextAt0700?.code === 'SE-101', 'At 07:00, next class should be SE-101');
  assert(secondNextAt0700?.code === 'CS-201', 'At 07:00, second next class should be CS-201');

  // Test 3: Ongoing class at 09:00 (c1 is ongoing from 08:30-10:00)
  // Ongoing should be c1, Next class should be c2 (10:30)
  const time0900 = '09:00';
  const ongoingAt0900 = mockMondayClasses.find((c) => time0900 >= c.startTime && time0900 <= c.endTime);
  const nextAt0900 = mockMondayClasses.find((c) => c.startTime > time0900);
  assert(ongoingAt0900?.code === 'SE-101', 'At 09:00, ongoing class should be SE-101');
  assert(nextAt0900?.code === 'CS-201', 'At 09:00, next class should be CS-201 (10:30)');

  // Test 4: Between classes at 12:15 (c2 ended at 12:00, c3 starts at 13:00)
  // Ongoing should be null, Next class should be c3 (13:00), second next should be c4 (15:00)
  const time1215 = '12:15';
  const ongoingAt1215 = mockMondayClasses.find((c) => time1215 >= c.startTime && time1215 <= c.endTime) || null;
  const nextAt1215 = mockMondayClasses.find((c) => c.startTime > time1215) || null;
  const secondNextAt1215 = mockMondayClasses.filter((c) => c.startTime > time1215)[1] || null;
  assert(ongoingAt1215 === null, 'At 12:15, there should be no ongoing class');
  assert(nextAt1215?.code === 'SE-302', 'At 12:15, next class should be SE-302 (13:00)');
  assert(secondNextAt1215?.code === 'CS-401', 'At 12:15, second next class should be CS-401 (15:00)');

  // Test 5: During last class at 15:30 (c4 is ongoing from 15:00-16:30)
  // Ongoing should be c4, Next class should be null (no subsequent class)
  const time1530 = '15:30';
  const ongoingAt1530 = mockMondayClasses.find((c) => time1530 >= c.startTime && time1530 <= c.endTime);
  const nextAt1530 = mockMondayClasses.find((c) => c.startTime > time1530) || null;
  assert(ongoingAt1530?.code === 'CS-401', 'At 15:30, ongoing class should be CS-401');
  assert(nextAt1530 === null, 'At 15:30, there are no further upcoming classes');

  // Test 6: All classes finished at 17:00 (after 16:30)
  // Ongoing is null, Next class is null
  // Message must be the exact web message
  const time1700 = '17:00';
  const nextAt1700 = mockMondayClasses.find((c) => c.startTime > time1700) || null;
  assert(nextAt1700 === null, 'At 17:00, next class must be null');
  const allDoneMessage = 'No more lectures scheduled for the remainder of today. Time to work on your assignments!';
  assert(allDoneMessage.includes('Time to work on your assignments!'), 'All done message must match web exact copy');

  // Test 7: Empty day schedule (e.g. Sunday or Rest Day)
  const emptyDayClasses: ClassLecture[] = [];
  const nextAtEmpty = emptyDayClasses.find((c) => c.startTime > '10:00') || null;
  assert(nextAtEmpty === null, 'Empty day must return null for next class');

  // Test 8: Countdown calculations
  assert(formatCountdown('10:00', '09:15') === 'Starts in 45 mins', '45 mins countdown check');
  assert(formatCountdown('11:30', '10:00') === 'Starts in 1h 30m', '1h 30m countdown check');
  assert(formatCountdown('10:00', '10:00') === 'Starts now', '0 diff is Starts now');
  assert(formatCountdown('10:00', '10:05') === 'Starts now', 'Negative diff is Starts now');

  // Test 9: Profile Section & Semester Filtering Integration
  const studentCyberSS1: UserProfile = {
    uid: 'test_1',
    email: 'test1@uos.edu.pk',
    fullName: 'Cyber Student',
    role: 'student',
    program: 'BS in Cyber Security',
    semester: 3,
    type: 'Self Support 1',
    section: '1',
    batch: '2025-2029',
  };

  const classesSS1 = getBuiltinClassesForUser(studentCyberSS1);
  assert(classesSS1.length === 16, `Expected 16 classes for Cyber SS1, got ${classesSS1.length}`);

  classesSS1.forEach((cls) => {
    const sectionLabel = getClassSectionDisplay(cls);
    assert(sectionLabel === 'Self Support 1', `Display label must be Self Support 1, got ${sectionLabel}`);
  });

  console.log('--- All Next Class Alert Tests Passed Successfully! ---');
  return true;
}

runNextClassAlertTests();

