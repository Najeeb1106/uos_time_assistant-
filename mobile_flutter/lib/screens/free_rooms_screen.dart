import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../theme/colors.dart';
import '../components/glass_container.dart';
import '../providers/schedule_provider.dart';

class FreeRoomsScreen extends StatefulWidget {
  FreeRoomsScreen({super.key});

  @override
  State<FreeRoomsScreen> createState() => _FreeRoomsScreenState();
}

class _FreeRoomsScreenState extends State<FreeRoomsScreen> {
  // Filters
  String _selectedDay = 'Monday';
  TimeOfDay _selectedTime = TimeOfDay(hour: 8, minute: 30);
  String _searchQuery = '';
  String _roomFilter = 'All'; // 'All', 'Classrooms', 'Labs'
  String _statusFilter = 'All'; // 'All', 'Free', 'Occupied'
  String? _expandedRoom;

  final List<String> _days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  @override
  void initState() {
    super.initState();
    // Default filters on load
    final now = DateTime.now();
    final dayNames = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    final currentDay = dayNames[now.weekday];
    
    setState(() {
      _selectedDay = currentDay;
      _selectedTime = TimeOfDay(hour: now.hour, minute: now.minute);
    });
  }

  void _resetToNow() {
    final now = DateTime.now();
    final dayNames = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    final currentDay = dayNames[now.weekday];
    
    setState(() {
      _selectedDay = currentDay;
      _selectedTime = TimeOfDay(hour: now.hour, minute: now.minute);
    });
  }

  String _formatTimeOfDay(TimeOfDay time) {
    final hrs = time.hour.toString().padLeft(2, '0');
    final mins = time.minute.toString().padLeft(2, '0');
    return '$hrs:$mins';
  }

  bool _isLab(String roomName) {
    final name = roomName.toLowerCase();
    return name.contains('lab') || name.contains('l-') || name.contains('l0');
  }

  Future<void> _selectTime(BuildContext context) async {
    final TimeOfDay? picked = await showTimePicker(
      context: context,
      initialTime: _selectedTime,
      builder: (BuildContext context, Widget? child) {
        return Theme(
          data: ThemeData.dark().copyWith(
            colorScheme: ColorScheme.dark(
              primary: AppColors.accentPrimary,
              onPrimary: Colors.white,
              surface: AppColors.bgSecondary,
              onSurface: AppColors.textPrimary,
            ), dialogTheme: DialogThemeData(backgroundColor: AppColors.bgSecondary),
          ),
          child: child!,
        );
      },
    );
    if (picked != null && picked != _selectedTime) {
      setState(() {
        _selectedTime = picked;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final scheduleProvider = Provider.of<ScheduleProvider>(context);
    final globalClasses = scheduleProvider.globalClasses;
    final isLoaded = scheduleProvider.isGlobalLoaded;

    if (!isLoaded) {
      return Scaffold(
        backgroundColor: AppColors.bgPrimary,
        body: Center(
          child: CircularProgressIndicator(
            valueColor: AlwaysStoppedAnimation<Color>(AppColors.accentPrimary),
          ),
        ),
      );
    }

    // 1. Get unique rooms list
    final uniqueRooms = Set<String>.from(
      globalClasses.map((c) => c['room'].toString())
    )
        .where((room) => room.isNotEmpty && room != 'Unknown')
        .toList()
      ..sort((a, b) => a.compareTo(b));

    final timeStr = _formatTimeOfDay(_selectedTime);

    // 2. Compute status of each room at the selected filters
    final List<Map<String, dynamic>> roomStatuses = uniqueRooms.map((room) {
      final roomDayClasses = globalClasses.cast<Map<String, dynamic>>().where(
        (c) => c['room'] == room && c['day'] == _selectedDay
      ).toList()
        ..sort((a, b) => (a['startTime'] as String).compareTo(b['startTime'] as String));

      // Find if active class exists
      final activeClass = roomDayClasses.firstWhere(
        (c) {
          final start = c['startTime'] as String;
          final end = c['endTime'] as String;
          return timeStr.compareTo(start) >= 0 && timeStr.compareTo(end) < 0;
        },
        orElse: () => {},
      );

      // Find next class today
      final nextClass = roomDayClasses.firstWhere(
        (c) => (c['startTime'] as String).compareTo(timeStr) > 0,
        orElse: () => {},
      );

      final isFree = activeClass.isEmpty;

      return {
        'room': room,
        'isFree': isFree,
        'activeClass': activeClass,
        'nextClass': nextClass,
        'schedule': roomDayClasses,
        'todayClassesCount': roomDayClasses.length,
        'category': _isLab(room) ? 'Labs' : 'Classrooms',
      };
    }).toList();

    // 3. Apply search, category, and status filters
    final displayedRooms = roomStatuses.where((item) {
      final matchesSearch = item['room'].toString().toLowerCase().contains(_searchQuery.toLowerCase());
      
      final matchesCategory = _roomFilter == 'All' || item['category'] == _roomFilter;
      
      final matchesStatus = _statusFilter == 'All' || 
          (_statusFilter == 'Free' && item['isFree'] == true) || 
          (_statusFilter == 'Occupied' && item['isFree'] == false);

      return matchesSearch && matchesCategory && matchesStatus;
    }).toList();

    // Statistics counts
    final totalRooms = roomStatuses.length;
    final freeCount = roomStatuses.where((r) => r['isFree'] == true).length;
    final occupiedCount = totalRooms - freeCount;

    return Scaffold(
      backgroundColor: AppColors.bgPrimary,
      body: Column(
        children: [
          // Screen sub-header and Use Current Time button
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 8.0),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Free Rooms',
                  style: TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.w800,
                    color: AppColors.textPrimary,
                    letterSpacing: -0.5,
                  ),
                ),
                GestureDetector(
                  onTap: _resetToNow,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: AppColors.bgSecondary,
                      border: Border.all(color: AppColors.glassBorder),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      children: [Icon(LucideIcons.rotateCcw, color: AppColors.textSecondary, size: 12),
                        SizedBox(width: 6),
                        Text(
                          'Reset to Now',
                          style: TextStyle(
                            fontSize: 11,
                            color: AppColors.textSecondary,
                            fontWeight: FontWeight.w700,
                          ),
                        ),],
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Filters and controls layout (Dashboard controls equivalent)
          Container(
            margin: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 6.0),
            child: Column(
              children: [
                // Day & Time selection controls
                Row(
                  children: [
                    // Day Selector Dropdown
                    Expanded(
                      flex: 4,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12),
                        decoration: BoxDecoration(
                          color: AppColors.bgSecondary,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: AppColors.glassBorder),
                        ),
                        child: Theme(
                          data: Theme.of(context).copyWith(canvasColor: AppColors.bgSecondary),
                          child: DropdownButtonHideUnderline(
                            child: DropdownButton<String>(
                              value: _selectedDay,
                              isExpanded: true,
                              style: TextStyle(color: AppColors.textPrimary, fontSize: 13, fontWeight: FontWeight.w600),
                              icon: Icon(LucideIcons.chevronDown, color: AppColors.textMuted, size: 16),
                              items: _days.map((day) => DropdownMenuItem(
                                value: day,
                                child: Text(day),
                              )).toList(),
                              onChanged: (val) => setState(() => _selectedDay = val!),
                            ),
                          ),
                        ),
                      ),
                    ),
                    SizedBox(width: 8),

                    // Time Picker Trigger Input
                    Expanded(
                      flex: 3,
                      child: GestureDetector(
                        onTap: () => _selectTime(context),
                        child: Container(
                          height: 48,
                          padding: const EdgeInsets.symmetric(horizontal: 12),
                          decoration: BoxDecoration(
                            color: AppColors.bgSecondary,
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: AppColors.glassBorder),
                          ),
                          alignment: Alignment.centerLeft,
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                timeStr,
                                style: TextStyle(color: AppColors.textPrimary, fontSize: 13, fontWeight: FontWeight.w700),
                              ),
                              Icon(LucideIcons.clock, color: AppColors.textMuted, size: 16),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
                SizedBox(height: 8),

                // Search Bar Input
                Container(
                  height: 40,
                  decoration: BoxDecoration(
                    color: AppColors.bgSecondary,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: AppColors.glassBorder),
                  ),
                  child: TextField(
                    onChanged: (val) => setState(() => _searchQuery = val),
                    style: TextStyle(color: AppColors.textPrimary, fontSize: 13),
                    decoration: InputDecoration(
                      hintText: 'Search rooms by name (e.g. 224, Lab)...',
                      hintStyle: TextStyle(color: AppColors.textMuted, fontSize: 12),
                      prefixIcon: Icon(LucideIcons.search, color: AppColors.textMuted, size: 16),
                      border: InputBorder.none,
                      contentPadding: EdgeInsets.symmetric(vertical: 10),
                    ),
                  ),
                ),
                SizedBox(height: 8),

                // Horizontal Filters Selector
                Row(
                  children: [
                    // Type Filter Buttons (All, Classrooms, Labs)
                    Expanded(
                      child: _buildSelectorBar(
                        selected: _roomFilter,
                        options: ['All', 'Classrooms', 'Labs'],
                        activeColor: AppColors.accentPrimary,
                        onSelected: (val) => setState(() => _roomFilter = val),
                      ),
                    ),
                    SizedBox(width: 8),
                    // Occupancy Status Buttons (All, Free, Occupied)
                    Expanded(
                      child: _buildSelectorBar(
                        selected: _statusFilter,
                        options: ['All', 'Free', 'Occupied'],
                        activeColor: AppColors.success,
                        onSelected: (val) => setState(() => _statusFilter = val),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          // Total Count Stats panel
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 4.0),
            child: Row(
              children: [
                Text(
                  '${displayedRooms.length} rooms match',
                  style: TextStyle(fontSize: 11, color: AppColors.textSecondary, fontWeight: FontWeight.bold),
                ),
                Spacer(),
                Text(
                  'Free: $freeCount  •  Occupied: $occupiedCount',
                  style: TextStyle(fontSize: 11, color: AppColors.textMuted, fontWeight: FontWeight.bold),
                ),
              ],
            ),
          ),
          SizedBox(height: 4),

          // Core List Grid of rooms
          Expanded(
            child: displayedRooms.isEmpty
                ? Center(
                    child: Text(
                      'No matching rooms found.',
                      style: TextStyle(color: AppColors.textSecondary, fontSize: 14),
                    ),
                  )
                : ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
                    itemCount: displayedRooms.length,
                    itemBuilder: (context, idx) {
                      final item = displayedRooms[idx];
                      final room = item['room'] as String;
                      final isFree = item['isFree'] as bool;
                      final category = item['category'] as String;
                      final todayClassesCount = item['todayClassesCount'] as int;
                      final activeClass = item['activeClass'] as Map<String, dynamic>;
                      final nextClass = item['nextClass'] as Map<String, dynamic>;
                      final scheduleList = item['schedule'] as List<Map<String, dynamic>>;

                      final isExpanded = _expandedRoom == room;

                      return Container(
                        margin: const EdgeInsets.only(bottom: 12.0),
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(
                            color: isFree ? AppColors.glassBorder : AppColors.danger.withOpacity(0.15),
                          ),
                        ),
                        child: GlassContainer(
                          padding: EdgeInsets.zero,
                          color: isFree ? AppColors.glassBg : AppColors.bgSecondary.withOpacity(0.4),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              
                              // Room Title & Status Header
                              Padding(
                                padding: const EdgeInsets.all(16.0),
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                            decoration: BoxDecoration(
                                              color: category == 'Labs' 
                                                  ? AppColors.accentSecondary.withOpacity(0.1) 
                                                  : AppColors.accentPrimary.withOpacity(0.1),
                                              borderRadius: BorderRadius.circular(4),
                                            ),
                                            child: Text(
                                              category == 'Labs' ? 'Lab / Laboratory' : 'Classroom',
                                              style: TextStyle(
                                                fontSize: 8,
                                                fontWeight: FontWeight.w800,
                                                color: category == 'Labs' ? AppColors.accentSecondary : AppColors.accentPrimary,
                                              ),
                                            ),
                                          ),
                                          SizedBox(height: 4),
                                          Text(
                                            room,
                                            style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: AppColors.textPrimary),
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                          ),
                                        ],
                                      ),
                                    ),
                                    SizedBox(width: 12),
                                    
                                    // Status Badge (FREE vs OCCUPIED)
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                      decoration: BoxDecoration(
                                        color: isFree ? AppColors.success.withOpacity(0.1) : AppColors.danger.withOpacity(0.1),
                                        border: Border.all(
                                          color: isFree ? AppColors.success.withOpacity(0.2) : AppColors.danger.withOpacity(0.2),
                                        ),
                                        borderRadius: BorderRadius.circular(20),
                                      ),
                                      child: Row(
                                        children: [
                                          Container(
                                            width: 5,
                                            height: 5,
                                            decoration: BoxDecoration(
                                              shape: BoxShape.circle,
                                              color: isFree ? AppColors.success : AppColors.danger,
                                            ),
                                          ),
                                          SizedBox(width: 4),
                                          Text(
                                            isFree ? 'FREE NOW' : 'OCCUPIED',
                                            style: TextStyle(
                                              fontSize: 9,
                                              fontWeight: FontWeight.w800,
                                              color: isFree ? AppColors.success : AppColors.danger,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                              ),

                              // Description & Active Lecture info
                              Padding(
                                padding: const EdgeInsets.only(left: 16.0, right: 16.0, bottom: 16.0),
                                child: isFree ? (
                                  Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        'Room is currently empty and available for study, team sessions, or meetings.',
                                        style: TextStyle(color: AppColors.textSecondary, fontSize: 12),
                                      ),
                                      if (nextClass.isNotEmpty) ...[
                                        SizedBox(height: 10),
                                        Container(
                                          width: double.infinity,
                                          padding: const EdgeInsets.all(8.0),
                                          decoration: BoxDecoration(
                                            color: AppColors.bgPrimary.withOpacity(0.4),
                                            borderRadius: BorderRadius.circular(8),
                                            border: Border.all(color: AppColors.glassBorder),
                                          ),
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              Text(
                                                'Next scheduled lecture today:',
                                                style: TextStyle(color: AppColors.textMuted, fontSize: 9, fontWeight: FontWeight.bold),
                                              ),
                                              SizedBox(height: 3),
                                              Text(
                                                "${nextClass['startTime']} - ${nextClass['endTime']} | ${nextClass['name']}",
                                                style: TextStyle(color: AppColors.textPrimary, fontSize: 11, fontWeight: FontWeight.w600),
                                                maxLines: 1,
                                                overflow: TextOverflow.ellipsis,
                                              ),
                                            ],
                                          ),
                                        ),
                                      ] else ...[
                                        SizedBox(height: 10),
                                        Container(
                                          width: double.infinity,
                                          padding: const EdgeInsets.all(8.0),
                                          decoration: BoxDecoration(
                                            color: AppColors.success.withOpacity(0.04),
                                            borderRadius: BorderRadius.circular(8),
                                            border: Border.all(color: AppColors.success.withOpacity(0.1)),
                                          ),
                                          child: Text(
                                            '✓ No further lectures scheduled today!',
                                            style: TextStyle(color: AppColors.success, fontSize: 10, fontWeight: FontWeight.bold),
                                          ),
                                        ),
                                      ]
                                    ],
                                  )
                                ) : (
                                  // Occupied Screen Card Details
                                  Container(
                                    padding: const EdgeInsets.all(10),
                                    decoration: BoxDecoration(
                                      color: AppColors.danger.withOpacity(0.02),
                                      border: Border.all(color: AppColors.danger.withOpacity(0.08)),
                                      borderRadius: BorderRadius.circular(10),
                                    ),
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Row(
                                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                          children: [
                                            Text(
                                              'ACTIVE LECTURE',
                                              style: TextStyle(color: AppColors.danger, fontSize: 8, fontWeight: FontWeight.w800),
                                            ),
                                            Text(
                                              "${activeClass['startTime']} - ${activeClass['endTime']}",
                                              style: TextStyle(color: AppColors.textSecondary, fontSize: 10, fontWeight: FontWeight.w600),
                                            ),
                                          ],
                                        ),
                                        SizedBox(height: 4),
                                        Text(
                                          activeClass['name'] ?? '',
                                          style: TextStyle(color: AppColors.textPrimary, fontSize: 13, fontWeight: FontWeight.w700),
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                        SizedBox(height: 4),
                                        Text(
                                          "Instructor: ${activeClass['teacher']} • Semester ${activeClass['semester']}",
                                          style: TextStyle(color: AppColors.textSecondary, fontSize: 10),
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                      ],
                                    ),
                                  )
                                ),
                              ),

                              // Expandable Drawer Toggle bar
                              Divider(color: AppColors.glassBorder, height: 1),
                              InkWell(
                                onTap: () {
                                  setState(() {
                                    _expandedRoom = isExpanded ? null : room;
                                  });
                                },
                                child: Padding(
                                  padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 10.0),
                                  child: Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Text(
                                        '$todayClassesCount classes today',
                                        style: TextStyle(fontSize: 11, color: AppColors.textSecondary, fontWeight: FontWeight.bold),
                                      ),
                                      Row(
                                        children: [
                                          Text(
                                            isExpanded ? 'Hide Schedule' : 'View Schedule',
                                            style: TextStyle(fontSize: 11, color: AppColors.textMuted, fontWeight: FontWeight.bold),
                                          ),
                                          SizedBox(width: 4),
                                          Icon(
                                            isExpanded ? LucideIcons.chevronUp : LucideIcons.chevronDown,
                                            color: AppColors.textMuted,
                                            size: 14,
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                ),
                              ),

                              // Expandable room timetable details
                              if (isExpanded) ...[
                                Container(
                                  padding: const EdgeInsets.all(16.0),
                                  decoration: BoxDecoration(
                                    color: AppColors.bgSecondary,
                                    border: Border(top: BorderSide(color: AppColors.glassBorder)),
                                  ),
                                  child: scheduleList.isEmpty
                                      ? Center(
                                          child: Text('Free all day', style: TextStyle(color: AppColors.textMuted, fontSize: 12)),
                                        )
                                      : Column(
                                          children: scheduleList.map((cls) {
                                            final isCurrent = activeClass['startTime'] == cls['startTime'];

                                            return Container(
                                              margin: const EdgeInsets.only(bottom: 6),
                                              padding: const EdgeInsets.all(8.0),
                                              decoration: BoxDecoration(
                                                color: isCurrent ? AppColors.accentPrimary.withOpacity(0.08) : Colors.transparent,
                                                borderRadius: BorderRadius.circular(8),
                                                border: Border.all(
                                                  color: isCurrent ? AppColors.accentPrimary : AppColors.glassBorder,
                                                  width: isCurrent ? 1.0 : 0.5,
                                                ),
                                              ),
                                              child: Row(
                                                children: [
                                                  Text(
                                                    "${cls['startTime']} - ${cls['endTime']}",
                                                    style: TextStyle(
                                                      color: isCurrent ? AppColors.accentPrimary : AppColors.textPrimary,
                                                      fontSize: 11,
                                                      fontWeight: FontWeight.w700,
                                                    ),
                                                  ),
                                                  SizedBox(width: 12),
                                                  Expanded(
                                                    child: Column(
                                                      crossAxisAlignment: CrossAxisAlignment.start,
                                                      children: [
                                                        Text(
                                                          cls['name'] ?? '',
                                                          style: TextStyle(color: AppColors.textPrimary, fontSize: 11, fontWeight: FontWeight.bold),
                                                          maxLines: 1,
                                                          overflow: TextOverflow.ellipsis,
                                                        ),
                                                        Text(
                                                          "${cls['teacher']} • Semester ${cls['semester']}",
                                                          style: TextStyle(color: AppColors.textMuted, fontSize: 9),
                                                        ),
                                                      ],
                                                    ),
                                                  ),
                                                  if (isCurrent)
                                                    Container(
                                                      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                                                      decoration: BoxDecoration(color: AppColors.accentPrimary, borderRadius: BorderRadius.circular(4)),
                                                      child: Text('NOW', style: TextStyle(color: Colors.white, fontSize: 8, fontWeight: FontWeight.bold)),
                                                    ),
                                                ],
                                              ),
                                            );
                                          }).toList(),
                                        ),
                                ),
                              ],

                            ],
                          ),
                        ),
                      );
                    },
                  ),
          ),

        ],
      ),
    );
  }

  Widget _buildSelectorBar({
    required String selected,
    required List<String> options,
    required Color activeColor,
    required ValueChanged<String> onSelected,
  }) {
    return Container(
      height: 32,
      decoration: BoxDecoration(
        color: AppColors.bgSecondary,
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: AppColors.glassBorder),
      ),
      child: Row(
        children: options.map((opt) {
          final isSelected = selected == opt;
          return Expanded(
            child: GestureDetector(
              onTap: () => onSelected(opt),
              child: Container(
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: isSelected ? activeColor.withOpacity(0.12) : Colors.transparent,
                  borderRadius: BorderRadius.circular(5),
                ),
                child: Text(
                  opt,
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                    color: isSelected ? activeColor : AppColors.textSecondary,
                  ),
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }
}
