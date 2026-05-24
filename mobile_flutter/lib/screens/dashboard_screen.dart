import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:intl/intl.dart';
import '../providers/auth_provider.dart';
import '../providers/schedule_provider.dart';
import '../theme/colors.dart';
import '../components/glass_container.dart';

class DashboardScreen extends StatefulWidget {
  DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  String _currentTimeStr = '';
  late Timer _timer;

  @override
  void initState() {
    super.initState();
    _updateTime();
    _timer = Timer.periodic(Duration(minutes: 1), (_) => _updateTime());

    // Trigger schedule sync on load
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final token = Provider.of<AuthProvider>(context, listen: false).token;
      if (token != null) {
        Provider.of<ScheduleProvider>(context, listen: false).fetchScheduleFromServer(token);
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

  String _getTodayDay() {
    final now = DateTime.now();
    final formatter = DateFormat('EEEE');
    return formatter.format(now);
  }

  bool _isClassOngoing(dynamic cls) {
    final today = _getTodayDay();
    if (cls['day'] != today) return false;
    final start = cls['startTime'] as String;
    final end = cls['endTime'] as String;
    return _currentTimeStr.compareTo(start) >= 0 && _currentTimeStr.compareTo(end) < 0;
  }

  double _getOngoingClassProgress(dynamic cls) {
    try {
      final now = DateTime.now();
      final todayStr = DateFormat('yyyy-MM-dd').format(now);
      
      final startParts = (cls['startTime'] as String).split(':');
      final endParts = (cls['endTime'] as String).split(':');
      
      final startTime = DateTime.parse('${todayStr}T${startParts[0]}:${startParts[1]}:00');
      final endTime = DateTime.parse('${todayStr}T${endParts[0]}:${endParts[1]}:00');
      
      final totalSeconds = endTime.difference(startTime).inSeconds;
      final elapsedSeconds = now.difference(startTime).inSeconds;
      
      if (totalSeconds <= 0) return 0.0;
      final progress = elapsedSeconds / totalSeconds;
      return progress.clamp(0.0, 1.0);
    } catch (_) {
      return 0.5;
    }
  }

  @override
  Widget build(BuildContext context) {
    final scheduleProvider = Provider.of<ScheduleProvider>(context);
    final user = Provider.of<AuthProvider>(context).user ?? {};
    final fullName = user['fullName'] ?? 'Student';
    
    final today = _getTodayDay();
    final allSchedule = scheduleProvider.classes;

    // Filter today's classes
    final todayClasses = allSchedule
        .where((c) => c['day'] == today)
        .toList()
      ..sort((a, b) => (a['startTime'] as String).compareTo(b['startTime'] as String));

    // Determine ongoing active class
    final activeClass = todayClasses.cast<dynamic>().firstWhere(
      (c) => _isClassOngoing(c),
      orElse: () => null,
    );

    // Determine upcoming next class today
    final nextClass = todayClasses.cast<dynamic>().firstWhere(
      (c) => (c['startTime'] as String).compareTo(_currentTimeStr) > 0,
      orElse: () => null,
    );

    return Scaffold(
      backgroundColor: AppColors.bgPrimary,
      body: RefreshIndicator(
        onRefresh: () async {
          final token = Provider.of<AuthProvider>(context, listen: false).token;
          if (token != null) {
            await scheduleProvider.fetchScheduleFromServer(token);
          }
        },
        color: AppColors.accentPrimary,
        backgroundColor: AppColors.bgSecondary,
        child: SingleChildScrollView(
          physics: AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(20.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Offline Alert Banner
              if (scheduleProvider.isOffline)
                Container(
                  margin: const EdgeInsets.only(bottom: 16.0),
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  decoration: BoxDecoration(
                    color: AppColors.warning.withOpacity(0.08),
                    border: Border.all(color: AppColors.warning.withOpacity(0.2)),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    children: [
                      Icon(LucideIcons.wifiOff, color: AppColors.warning, size: 18),
                      SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          'You are viewing a locally cached timetable. Synced offline.',
                          style: TextStyle(
                            color: AppColors.warning.withOpacity(0.9),
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

              // Greeting Header
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Welcome back, $fullName 👋',
                          style: TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.w800,
                            color: AppColors.textPrimary,
                            letterSpacing: -0.5,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                        SizedBox(height: 4),
                        Text(
                          'Here is your schedule breakdown.',
                          style: TextStyle(
                            fontSize: 13,
                            color: AppColors.textSecondary,
                          ),
                        ),
                      ],
                    ),
                  ),
                  
                  // Live Sync Status
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: scheduleProvider.isOffline 
                          ? Colors.transparent 
                          : AppColors.success.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      children: [
                        Container(
                          width: 6,
                          height: 6,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: scheduleProvider.isOffline ? AppColors.textMuted : AppColors.success,
                          ),
                        ),
                        SizedBox(width: 6),
                        Text(
                          scheduleProvider.isOffline ? 'Offline' : 'Synced',
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w700,
                            color: scheduleProvider.isOffline ? AppColors.textMuted : AppColors.success,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              SizedBox(height: 24),

              // Active ongoing class card (Gradient purple layout exactly matching web)
              if (activeClass != null) ...[
                Container(
                  width: double.infinity,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(20),
                    gradient: AppColors.cardAccentGradient,
                    border: Border.all(color: AppColors.accentSecondary.withOpacity(0.2)),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.4),
                        blurRadius: 30,
                        offset: Offset(0, 10),
                      ),
                    ],
                  ),
                  padding: const EdgeInsets.all(20.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: AppColors.accentSecondary.withOpacity(0.2),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              'LECTURE IN PROGRESS',
                              style: TextStyle(
                                fontSize: 9,
                                fontWeight: FontWeight.w800,
                                color: AppColors.accentSecondary,
                                letterSpacing: 0.5,
                              ),
                            ),
                          ),
                          Text(
                            '${activeClass['startTime']} - ${activeClass['endTime']}',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: AppColors.textSecondary,
                            ),
                          ),
                        ],
                      ),
                      SizedBox(height: 16),
                      Text(
                        activeClass['name'] ?? '',
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.w800,
                          color: AppColors.textPrimary,
                          letterSpacing: -0.5,
                        ),
                      ),
                      SizedBox(height: 6),
                      Row(
                        children: [
                          Icon(LucideIcons.mapPin, color: AppColors.textSecondary, size: 14),
                          SizedBox(width: 6),
                          Text(
                            activeClass['room'] ?? '',
                            style: TextStyle(
                              fontSize: 13,
                              color: AppColors.textSecondary,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                      SizedBox(height: 20),

                      // Progress Ring represented as linear bar for mobile landscape layout
                      Text(
                        'Class Progress',
                        style: TextStyle(
                          fontSize: 11,
                          color: AppColors.textMuted,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      SizedBox(height: 6),
                      ClipRRect(
                        borderRadius: BorderRadius.circular(10),
                        child: LinearProgressIndicator(
                          value: _getOngoingClassProgress(activeClass),
                          minHeight: 6,
                          backgroundColor: Colors.white.withOpacity(0.08),
                          valueColor: AlwaysStoppedAnimation<Color>(AppColors.accentSecondary),
                        ),
                      ),
                    ],
                  ),
                ),
                SizedBox(height: 24),
              ] else if (nextClass != null) ...[
                // Next class card (Indigo themed gradient matching web fallback card)
                Container(
                  width: double.infinity,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(20),
                    color: AppColors.bgSecondary,
                    border: Border.all(color: AppColors.accentPrimary.withOpacity(0.15)),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.3),
                        blurRadius: 20,
                        offset: Offset(0, 8),
                      ),
                    ],
                  ),
                  padding: const EdgeInsets.all(20.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: AppColors.accentPrimary.withOpacity(0.15),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              'UPCOMING CLASS NEXT',
                              style: TextStyle(
                                fontSize: 9,
                                fontWeight: FontWeight.w800,
                                color: AppColors.accentPrimary,
                                letterSpacing: 0.5,
                              ),
                            ),
                          ),
                          Text(
                            '${nextClass['startTime']} - ${nextClass['endTime']}',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: AppColors.textSecondary,
                            ),
                          ),
                        ],
                      ),
                      SizedBox(height: 14),
                      Text(
                        nextClass['name'] ?? '',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w800,
                          color: AppColors.textPrimary,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      SizedBox(height: 6),
                      Row(
                        children: [
                          Icon(LucideIcons.mapPin, color: AppColors.textSecondary, size: 14),
                          SizedBox(width: 6),
                          Text(
                            nextClass['room'] ?? '',
                            style: TextStyle(
                              fontSize: 13,
                              color: AppColors.textSecondary,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                SizedBox(height: 24),
              ],

              // Today's Timeline header
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    "Today's Schedule ($today)",
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w800,
                      color: AppColors.textPrimary,
                      letterSpacing: -0.2,
                    ),
                  ),
                  Text(
                    '${todayClasses.length} lectures',
                    style: TextStyle(
                      fontSize: 12,
                      color: AppColors.textSecondary,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
              SizedBox(height: 16),

              // Timetable Empty State
              if (todayClasses.isEmpty)
                GlassContainer(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 40),
                  child: Center(
                    child: Column(
                      children: [Icon(LucideIcons.smile, color: AppColors.success, size: 40),
                        SizedBox(height: 12),
                        Text(
                          'No Lectures Scheduled Today!',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                            color: AppColors.textPrimary,
                          ),
                        ),
                        SizedBox(height: 6),
                        Text(
                          'Enjoy your free day or utilize the Free Room Finder to find study rooms.',
                          style: TextStyle(
                            fontSize: 12,
                            color: AppColors.textSecondary,
                          ),
                          textAlign: TextAlign.center,
                        ),],
                    ),
                  ),
                )
              else
                // Chronological Timeline items matching web styles
                ListView.builder(
                  shrinkWrap: true,
                  physics: NeverScrollableScrollPhysics(),
                  itemCount: todayClasses.length,
                  itemBuilder: (context, idx) {
                    final cls = todayClasses[idx];
                    final isOngoing = _isClassOngoing(cls);
                    final isPast = !isOngoing && _currentTimeStr.compareTo(cls['endTime'] as String) >= 0;

                    return Container(
                      decoration: BoxDecoration(
                        border: Border(left: BorderSide(color: AppColors.bgTertiary, width: 2)),
                      ),
                      padding: const EdgeInsets.only(left: 20, bottom: 20),
                      margin: const EdgeInsets.only(left: 8.0),
                      child: Stack(
                        clipBehavior: Clip.none,
                        children: [
                          // Custom Timeline Bullet
                          Positioned(
                            left: -26,
                            top: 4,
                            child: Container(
                              width: 10,
                              height: 10,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: isOngoing 
                                    ? AppColors.accentPrimary 
                                    : (isPast ? AppColors.bgPrimary : Colors.transparent),
                                border: Border.all(
                                  color: isOngoing ? AppColors.accentPrimary : AppColors.glassBorder,
                                  width: 2,
                                ),
                                boxShadow: isOngoing ? [
                                  BoxShadow(
                                    color: AppColors.accentPrimary.withOpacity(0.5),
                                    blurRadius: 10,
                                    spreadRadius: 1,
                                  )
                                ] : null,
                              ),
                            ),
                          ),
                          
                          // Glass card details
                          GlassContainer(
                            padding: const EdgeInsets.all(14.0),
                            color: isOngoing 
                                ? AppColors.accentGlow 
                                : (isPast ? AppColors.bgSecondary.withOpacity(0.3) : AppColors.glassBg),
                            border: isOngoing 
                                ? Border.all(color: AppColors.accentPrimary) 
                                : null,
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text(
                                      cls['code'] ?? '',
                                      style: TextStyle(
                                        fontSize: 10,
                                        fontWeight: FontWeight.w700,
                                        color: isOngoing ? AppColors.accentSecondary : AppColors.textMuted,
                                      ),
                                    ),
                                    Text(
                                      '${cls['startTime']} - ${cls['endTime']}',
                                      style: TextStyle(
                                        fontSize: 11,
                                        fontWeight: FontWeight.w600,
                                        color: AppColors.textSecondary,
                                      ),
                                    ),
                                  ],
                                ),
                                SizedBox(height: 4),
                                Text(
                                  cls['name'] ?? '',
                                  style: TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w700,
                                    color: isPast ? AppColors.textSecondary : AppColors.textPrimary,
                                  ),
                                ),
                                SizedBox(height: 8),
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text(
                                      'Instructor: ${cls['teacher']}',
                                      style: TextStyle(
                                        fontSize: 11,
                                        color: AppColors.textSecondary,
                                      ),
                                    ),
                                    Row(
                                      children: [
                                        Icon(LucideIcons.mapPin, color: AppColors.accentPrimary, size: 12),
                                        SizedBox(width: 4),
                                        Text(
                                          cls['room'] ?? '',
                                          style: TextStyle(
                                            fontSize: 11,
                                            fontWeight: FontWeight.w700,
                                            color: AppColors.textPrimary,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    );
                  },
                ),
            ],
          ),
        ),
      ),
    );
  }
}
