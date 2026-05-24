import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:intl/intl.dart';
import '../providers/schedule_provider.dart';
import '../providers/auth_provider.dart';
import '../theme/colors.dart';
import '../components/glass_container.dart';

class WeeklyScheduleScreen extends StatefulWidget {
  WeeklyScheduleScreen({super.key});

  @override
  State<WeeklyScheduleScreen> createState() => _WeeklyScheduleScreenState();
}

class _WeeklyScheduleScreenState extends State<WeeklyScheduleScreen> {
  String _selectedDay = 'Monday';
  String _currentTimeStr = '';
  late Timer _timer;

  final List<String> _days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  @override
  void initState() {
    super.initState();
    _updateTime();
    _timer = Timer.periodic(Duration(minutes: 1), (_) => _updateTime());

    // Default selection to current day if weekday
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final now = DateTime.now();
      final currentDay = DateFormat('EEEE').format(now);
      if (_days.contains(currentDay)) {
        setState(() {
          _selectedDay = currentDay;
        });
      }
    });
  }

  @override
  void dispose() {
    _timer.cancel();
    super.dispose();
  }

  void _updateTime() {
    final now = DateTime.now();
    final hrs = now.hour.toString().padLeft(2, '0');
    final mins = now.minute.toString().padLeft(2, '0');
    if (mounted) {
      setState(() {
        _currentTimeStr = '$hrs:$mins';
      });
    }
  }

  bool _isClassOngoing(dynamic cls) {
    final now = DateTime.now();
    final today = DateFormat('EEEE').format(now);
    if (cls['day'] != today) return false;
    final start = cls['startTime'] as String;
    final end = cls['endTime'] as String;
    return _currentTimeStr.compareTo(start) >= 0 && _currentTimeStr.compareTo(end) < 0;
  }

  List<dynamic> _getClassesForDay(List<dynamic> classes, String day) {
    return classes
        .where((c) => c['day'] == day)
        .toList()
      ..sort((a, b) => (a['startTime'] as String).compareTo(b['startTime'] as String));
  }

  void _showClassDetailModal(BuildContext context, dynamic cls, Map<String, dynamic>? currentUser) {
    showDialog(
      context: context,
      builder: (dialogCtx) {
        final isTeacher = currentUser?['role'] == 'teacher';
        
        return Center(
          child: SingleChildScrollView(
            child: Dialog(
              backgroundColor: Colors.transparent,
              child: GlassContainer(
                color: AppColors.bgSecondary,
                borderRadius: 20,
                padding: const EdgeInsets.all(24.0),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Header badges
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: AppColors.accentPrimary.withOpacity(0.15),
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Text(
                                cls['code'] ?? '',
                                style: TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w700,
                                  color: AppColors.accentPrimary,
                                ),
                              ),
                            ),
                            SizedBox(width: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: AppColors.accentSecondary.withOpacity(0.15),
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Text(
                                cls['type'] ?? '',
                                style: TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w700,
                                  color: AppColors.accentSecondary,
                                ),
                              ),
                            ),
                          ],
                        ),
                        GestureDetector(
                          onTap: () => Navigator.of(dialogCtx).pop(),
                          child: Icon(LucideIcons.x, color: AppColors.textMuted, size: 20),
                        ),
                      ],
                    ),
                    SizedBox(height: 20),

                    // Course Name
                    Text(
                      cls['name'] ?? '',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w800,
                        color: AppColors.textPrimary,
                        height: 1.25,
                      ),
                    ),
                    SizedBox(height: 20),
                    Divider(color: AppColors.glassBorder),
                    SizedBox(height: 16),

                    // Details grid list
                    _buildModalDetailRow(
                      icon: LucideIcons.clock,
                      iconColor: AppColors.accentPrimary,
                      label: 'DAY & TIME',
                      value: "${cls['day']} • ${cls['startTime']} - ${cls['endTime']}",
                    ),
                    SizedBox(height: 16),

                    _buildModalDetailRow(
                      icon: LucideIcons.mapPin,
                      iconColor: AppColors.accentSecondary,
                      label: 'ROOM LOCATION',
                      value: cls['room'] ?? '',
                    ),
                    SizedBox(height: 16),

                    if (isTeacher)
                      _buildModalDetailRow(
                        icon: LucideIcons.bookOpen,
                        iconColor: AppColors.accentSecondary,
                        label: 'TARGET COHORT',
                        value: cls['program'] ?? '',
                      )
                    else
                      _buildModalDetailRow(
                        icon: LucideIcons.user,
                        iconColor: AppColors.textSecondary,
                        label: 'INSTRUCTOR',
                        value: cls['teacher'] ?? '',
                      ),
                    SizedBox(height: 16),

                    _buildModalDetailRow(
                      icon: LucideIcons.bookOpen,
                      iconColor: AppColors.textMuted,
                      label: isTeacher ? 'SESSION & SEMESTER' : 'BATCH & TARGET',
                      value: "${cls['batch'] != null && cls['batch'].toString().isNotEmpty ? '${cls['batch']} • ' : ''}Semester ${cls['semester']}",
                    ),
                  ],
                ),
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildModalDetailRow({
    required IconData icon,
    required Color iconColor,
    required String label,
    required String value,
  }) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, color: iconColor, size: 18),
        SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: TextStyle(
                  fontSize: 10,
                  color: AppColors.textMuted,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 0.5,
                ),
              ),
              SizedBox(height: 2),
              Text(
                value,
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textPrimary,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final scheduleProvider = Provider.of<ScheduleProvider>(context);
    final user = Provider.of<AuthProvider>(context).user;
    
    final classes = scheduleProvider.classes;
    final dayClasses = _getClassesForDay(classes, _selectedDay);

    return Scaffold(
      backgroundColor: AppColors.bgPrimary,
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Sub-Header
          Padding(
            padding: EdgeInsets.symmetric(horizontal: 20.0, vertical: 10.0),
            child: Text(
              'Weekly Schedule',
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.w800,
                color: AppColors.textPrimary,
                letterSpacing: -0.5,
              ),
            ),
          ),
          
          // Day Selection Tabs Bar (Horizontal matching web day tabs selector)
          Container(
            height: 48,
            margin: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
            padding: const EdgeInsets.all(4.0),
            decoration: BoxDecoration(
              color: AppColors.bgSecondary,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppColors.glassBorder),
            ),
            child: Row(
              children: _days.map((day) {
                final isSelected = _selectedDay == day;
                final now = DateTime.now();
                final today = DateFormat('EEEE').format(now);
                final isToday = day == today;

                return Expanded(
                  child: GestureDetector(
                    onTap: () => setState(() => _selectedDay = day),
                    child: Container(
                      decoration: BoxDecoration(
                        color: isSelected ? AppColors.bgTertiary : Colors.transparent,
                        borderRadius: BorderRadius.circular(8),
                        border: isSelected
                            ? Border.all(color: AppColors.glassBorder)
                            : null,
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        day.substring(0, 3), // e.g. Mon, Tue
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                          color: isSelected 
                              ? AppColors.textPrimary 
                              : (isToday ? AppColors.accentPrimary : AppColors.textSecondary),
                        ),
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
          ),
          SizedBox(height: 10),

          // Main timeline list
          Expanded(
            child: classes.isEmpty
                ? Center(
                    child: Padding(
                      padding: const EdgeInsets.all(24.0),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [Icon(LucideIcons.calendar, color: AppColors.textMuted, size: 48),
                          SizedBox(height: 16),
                          Text(
                            'Schedule Empty',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w700,
                              color: AppColors.textPrimary,
                            ),
                          ),
                          SizedBox(height: 6),
                          Text(
                            'There are no classes inside the database yet. Parse and save a timetable PDF in the Web dashboard first!',
                            style: TextStyle(
                              fontSize: 12,
                              color: AppColors.textSecondary,
                            ),
                            textAlign: TextAlign.center,
                          ),],
                      ),
                    ),
                  )
                : dayClasses.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [Icon(LucideIcons.smile, color: AppColors.success, size: 36),
                            SizedBox(height: 12),
                            Text(
                              'Free Day!',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w700,
                                color: AppColors.textPrimary,
                              ),
                            ),
                            SizedBox(height: 4),
                            Text(
                              'No classes scheduled for this day.',
                              style: TextStyle(
                                fontSize: 12,
                                color: AppColors.textSecondary,
                              ),
                            ),],
                        ),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 8.0),
                        itemCount: dayClasses.length,
                        itemBuilder: (context, idx) {
                          final cls = dayClasses[idx];
                          final isOngoing = _isClassOngoing(cls);

                          return Container(
                            margin: const EdgeInsets.only(bottom: 12.0),
                            child: InkWell(
                              onTap: () => _showClassDetailModal(context, cls, user),
                              borderRadius: BorderRadius.circular(12),
                              child: GlassContainer(
                                padding: const EdgeInsets.all(14),
                                color: isOngoing ? AppColors.accentGlow : AppColors.glassBg,
                                border: isOngoing 
                                    ? Border.all(color: AppColors.accentPrimary, width: 1.5) 
                                    : null,
                                child: Row(
                                  children: [
                                    // Time Column
                                    Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          cls['startTime'] ?? '',
                                          style: TextStyle(
                                            fontSize: 15,
                                            fontWeight: FontWeight.w800,
                                            color: isOngoing ? AppColors.accentPrimary : AppColors.textPrimary,
                                          ),
                                        ),
                                        SizedBox(height: 2),
                                        Text(
                                          cls['endTime'] ?? '',
                                          style: TextStyle(
                                            fontSize: 11,
                                            fontWeight: FontWeight.w600,
                                            color: AppColors.textMuted,
                                          ),
                                        ),
                                      ],
                                    ),
                                    SizedBox(width: 16),
                                    // Divider Line
                                    Container(
                                      width: 1,
                                      height: 36,
                                      color: isOngoing 
                                          ? AppColors.accentPrimary.withOpacity(0.3) 
                                          : AppColors.glassBorder,
                                    ),
                                    SizedBox(width: 16),
                                    // Details Column
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            cls['code'] ?? '',
                                            style: TextStyle(
                                              fontSize: 10,
                                              fontWeight: FontWeight.w700,
                                              color: isOngoing ? AppColors.accentSecondary : AppColors.textMuted,
                                            ),
                                          ),
                                          SizedBox(height: 2),
                                          Text(
                                            cls['name'] ?? '',
                                            style: TextStyle(
                                              fontSize: 14,
                                              fontWeight: FontWeight.w700,
                                              color: AppColors.textPrimary,
                                            ),
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                          ),
                                        ],
                                      ),
                                    ),
                                    // Room Badge
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                                      decoration: BoxDecoration(
                                        color: AppColors.bgPrimary.withOpacity(0.4),
                                        borderRadius: BorderRadius.circular(8),
                                        border: Border.all(color: AppColors.glassBorder),
                                      ),
                                      child: Row(
                                        children: [
                                          Icon(LucideIcons.mapPin, color: AppColors.accentPrimary, size: 12),
                                          SizedBox(width: 4),
                                          Text(
                                            cls['room'].toString().split(' ').last,
                                            style: TextStyle(
                                              fontSize: 11,
                                              fontWeight: FontWeight.w700,
                                              color: AppColors.textPrimary,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
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
}
