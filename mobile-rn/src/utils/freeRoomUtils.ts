import { ClassLecture } from '../models/Schedule';

export interface RoomStatus {
  room: string;
  isFree: boolean;
  activeClass: ClassLecture | null;
  nextClass: ClassLecture | null;
  todayClassesCount: number;
  schedule: ClassLecture[];
  category: 'Classrooms' | 'Labs';
}

/**
 * Extract unique, sorted room names from master timetable classes
 */
export function extractUniqueRooms(classes: ClassLecture[]): string[] {
  if (!classes || !Array.isArray(classes)) return [];
  const set = new Set<string>();
  classes.forEach((c) => {
    if (c.room && c.room !== 'Unknown' && c.room.trim() !== '') {
      set.add(c.room.trim());
    }
  });
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

/**
 * Classifies whether a room is a Lab or a Classroom
 */
export function isLabRoom(roomName: string): boolean {
  if (!roomName) return false;
  const name = roomName.toLowerCase();
  return name.includes('lab') || name.includes('l-') || name.includes('l0');
}

/**
 * Compute availability and schedules for all unique rooms on a specific day & time
 */
export function calculateAllRoomStatuses(
  classes: ClassLecture[],
  selectedDay: string,
  selectedTime: string
): RoomStatus[] {
  const rooms = extractUniqueRooms(classes);

  return rooms.map((room) => {
    // Get all classes in this room on selectedDay
    const roomDayClasses = classes
      .filter((c) => c.room === room && c.day === selectedDay)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

    // Active class is one where selectedTime falls within [startTime, endTime)
    const activeClass = roomDayClasses.find(
      (c) => selectedTime >= c.startTime && selectedTime < c.endTime
    ) || null;

    // Next class is the first class today starting after selectedTime
    const nextClass = roomDayClasses.find((c) => c.startTime > selectedTime) || null;

    return {
      room,
      isFree: !activeClass,
      activeClass,
      nextClass,
      todayClassesCount: roomDayClasses.length,
      schedule: roomDayClasses,
      category: isLabRoom(room) ? 'Labs' : 'Classrooms',
    };
  });
}
