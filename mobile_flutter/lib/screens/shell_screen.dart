import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../providers/auth_provider.dart';
import '../providers/theme_provider.dart';
import '../theme/colors.dart';
import 'dashboard_screen.dart';
import 'weekly_schedule_screen.dart';
import 'free_rooms_screen.dart';
import 'login_screen.dart';
import 'profile_screen.dart';
import 'upload_screen.dart';

class ShellScreen extends StatefulWidget {
  const ShellScreen({super.key});

  @override
  State<ShellScreen> createState() => _ShellScreenState();
}

class _ShellScreenState extends State<ShellScreen> {
  int _selectedIndex = 0;
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();

  final List<Widget> _screens = [
    DashboardScreen(),
    WeeklyScheduleScreen(),
    FreeRoomsScreen(),
    UploadScreen(),
    ProfileScreen(),
  ];

  String _getPageTitle() {
    switch (_selectedIndex) {
      case 0: return 'Dashboard Overview';
      case 1: return 'Weekly timetable Grid';
      case 2: return 'Free Room Finder';
      case 3: return 'Parse Timetable PDF';
      case 4: return 'Profile Settings';
      default: return 'UOS Timetable';
    }
  }

  void _handleSignOut(BuildContext context) {
    final isDark = Provider.of<ThemeProvider>(context, listen: false).isDarkMode;
    final dialogBg = isDark ? AppColors.bgSecondary : Colors.white;
    final dialogTextPrimary = isDark ? AppColors.textPrimary : const Color(0xFF0F172A);
    final dialogTextSecondary = isDark ? AppColors.textSecondary : const Color(0xFF475569);

    showDialog(
      context: context,
      builder: (dialogCtx) => AlertDialog(
        backgroundColor: dialogBg,
        title: Text('Sign Out', style: TextStyle(color: dialogTextPrimary, fontWeight: FontWeight.bold)),
        content: Text('Are you sure you want to log out?', style: TextStyle(color: dialogTextSecondary)),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogCtx).pop(),
            child: Text('Cancel', style: TextStyle(color: dialogTextSecondary)),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.of(dialogCtx).pop();
              Provider.of<AuthProvider>(context, listen: false).logout();
              Navigator.of(context).pushReplacement(
                MaterialPageRoute(builder: (_) => LoginScreen()),
              );
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.danger,
              elevation: 0,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
            child: const Text('Sign Out', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final user = Provider.of<AuthProvider>(context).user ?? {};
    final fullName = user['fullName'] ?? 'Ahmed Ali';
    final role = user['role'] ?? 'student';
    final program = user['program'] ?? 'BS in Software Engineering';
    final semester = user['semester'] ?? 2;
    final type = user['type'] ?? 'Regular';

    final themeProvider = Provider.of<ThemeProvider>(context);
    final isDark = themeProvider.isDarkMode;

    final bgPrimary = isDark ? AppColors.bgPrimary : const Color(0xFFF8FAFC);
    final bgSecondary = isDark ? AppColors.bgSecondary : Colors.white;
    final textPrimary = isDark ? AppColors.textPrimary : const Color(0xFF0F172A);
    final textSecondary = isDark ? AppColors.textSecondary : const Color(0xFF475569);
    final textMuted = isDark ? AppColors.textMuted : const Color(0xFF64748B);
    final glassBorder = isDark ? AppColors.glassBorder : const Color(0xFFE2E8F0);
    final bgTertiary = isDark ? AppColors.bgTertiary : const Color(0xFFF1F5F9);

    return Scaffold(
      key: _scaffoldKey,
      backgroundColor: bgPrimary,
      
      // Top Header matching Web Top Header
      appBar: AppBar(
        backgroundColor: bgPrimary,
        elevation: 0,
        leading: IconButton(
          icon: Icon(LucideIcons.menu, color: textPrimary),
          onPressed: () => _scaffoldKey.currentState!.openDrawer(),
        ),
        title: Text(
          _getPageTitle(),
          style: TextStyle(
            color: textPrimary,
            fontSize: 18,
            fontWeight: FontWeight.w700,
          ),
        ),
        actions: [
          // Program Badge
          Center(
            child: Container(
              margin: const EdgeInsets.only(right: 8.0),
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: role == 'teacher'
                    ? AppColors.success.withOpacity(0.1)
                    : AppColors.accentPrimary.withOpacity(0.1),
                border: Border.all(
                  color: role == 'teacher'
                      ? AppColors.success.withOpacity(0.2)
                      : AppColors.accentPrimary.withOpacity(0.2),
                ),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                role == 'teacher' ? 'Faculty' : program.split(' in ').last,
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: role == 'teacher' ? AppColors.success : AppColors.accentPrimary,
                ),
              ),
            ),
          ),
          // AppBar Direct Logout Icon
          IconButton(
            icon: Icon(LucideIcons.logOut, color: AppColors.danger, size: 20),
            tooltip: 'Sign Out',
            onPressed: () => _handleSignOut(context),
          ),
          const SizedBox(width: 8),
        ],
      ),

      // Custom Sidebar Drawer (Exact Web Sidebar copy)
      drawer: Drawer(
        backgroundColor: bgSecondary,
        child: Column(
          children: [
            // Drawer Brand Header
            SafeArea(
              child: Container(
                padding: const EdgeInsets.all(24.0),
                child: Row(
                  children: [
                    Container(
                      width: 36,
                      height: 36,
                      decoration: BoxDecoration(
                        color: bgTertiary,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: glassBorder),
                      ),
                      padding: const EdgeInsets.all(6),
                      child: Image.asset(
                        'assets/uos.png',
                        errorBuilder: (_, __, ___) => Icon(
                          LucideIcons.calendar,
                          color: AppColors.accentPrimary,
                          size: 18,
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Text(
                      'UOS Timetable',
                      style: TextStyle(
                        fontWeight: FontWeight.w800,
                        fontSize: 18,
                        color: textPrimary,
                        letterSpacing: -0.5,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            Divider(color: glassBorder, height: 1),

            // Navigation Options
            Expanded(
              child: ListView(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 16),
                children: [
                  _buildNavItem(0, 'Dashboard', LucideIcons.layoutDashboard, textPrimary, textSecondary),
                  _buildNavItem(1, 'Weekly Schedule', LucideIcons.calendar, textPrimary, textSecondary),
                  _buildNavItem(2, 'Free Rooms', LucideIcons.doorOpen, textPrimary, textSecondary),
                  _buildNavItem(3, 'Parse Timetable PDF', LucideIcons.upload, textPrimary, textSecondary),
                  _buildNavItem(4, 'Profile Settings', LucideIcons.user, textPrimary, textSecondary),
                  
                  const SizedBox(height: 12),
                  Divider(color: glassBorder, height: 1),
                  const SizedBox(height: 12),

                  // Interactive Theme Switcher inside drawer
                  Container(
                    margin: const EdgeInsets.only(bottom: 6.0),
                    child: ListTile(
                      onTap: () => themeProvider.toggleTheme(),
                      leading: Icon(
                        isDark ? LucideIcons.sun : LucideIcons.moon,
                        color: textSecondary,
                        size: 20,
                      ),
                      title: Text(
                        isDark ? 'Light Mode' : 'Dark Mode',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w500,
                          color: textSecondary,
                        ),
                      ),
                      trailing: Switch(
                        value: isDark,
                        onChanged: (val) => themeProvider.toggleTheme(),
                        activeThumbColor: AppColors.accentPrimary,
                      ),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 20.0),
                      dense: true,
                      visualDensity: const VisualDensity(vertical: -1),
                    ),
                  ),
                ],
              ),
            ),

            // Sidebar Footer Profile info
            Divider(color: glassBorder, height: 1),
            Container(
              padding: const EdgeInsets.all(16.0),
              color: bgSecondary,
              child: Column(
                children: [
                  // User details card
                  Row(
                    children: [
                      Container(
                        width: 36,
                        height: 36,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          gradient: AppColors.primaryButtonGradient,
                          border: Border.all(color: Colors.white.withOpacity(0.15)),
                        ),
                        alignment: Alignment.center,
                        child: Text(
                          _getInitials(fullName, role),
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 12,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              fullName,
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                                color: textPrimary,
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                            Text(
                              role == 'teacher'
                                  ? 'UOS Faculty Member'
                                  : '$semester Sem • $type',
                              style: TextStyle(
                                fontSize: 10,
                                color: textMuted,
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),

                  // Sign Out Button (exact red style matching web)
                  InkWell(
                    onTap: () {
                      Navigator.of(context).pop(); // Close drawer
                      _scaffoldKey.currentState!.closeDrawer();
                      _handleSignOut(context);
                    },
                    borderRadius: BorderRadius.circular(10),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                      decoration: BoxDecoration(
                        color: Colors.transparent,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Row(
                        children: const [
                          Icon(LucideIcons.logOut, color: AppColors.danger, size: 18),
                          SizedBox(width: 12),
                          Text(
                            'Sign Out',
                            style: TextStyle(
                              color: AppColors.danger,
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),

      // Screen Router Body Slot
      body: _screens[_selectedIndex],
    );
  }

  Widget _buildNavItem(int index, String title, IconData icon, Color textPrimary, Color textSecondary) {
    final isSelected = _selectedIndex == index;
    return Container(
      margin: const EdgeInsets.only(bottom: 6.0),
      decoration: BoxDecoration(
        color: isSelected ? AppColors.accentPrimary.withOpacity(0.08) : Colors.transparent,
        borderRadius: BorderRadius.circular(8),
        border: isSelected
            ? Border(left: BorderSide(color: AppColors.accentPrimary, width: 3))
            : null,
      ),
      child: ListTile(
        onTap: () {
          setState(() {
            _selectedIndex = index;
          });
          _scaffoldKey.currentState!.closeDrawer();
        },
        leading: Icon(
          icon,
          color: isSelected ? AppColors.accentPrimary : textSecondary,
          size: 20,
        ),
        title: Text(
          title,
          style: TextStyle(
            fontSize: 13,
            fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
            color: isSelected ? textPrimary : textSecondary,
          ),
        ),
        contentPadding: EdgeInsets.only(
          left: isSelected ? 17.0 : 20.0,
          right: 20.0,
          top: 0,
          bottom: 0,
        ),
        dense: true,
        visualDensity: const VisualDensity(vertical: -1),
      ),
    );
  }

  String _getInitials(String? name, String role) {
    if (name == null || name.trim().isEmpty) {
      return role == 'teacher' ? 'TR' : 'ST';
    }
    final parts = name.trim().split(' ');
    if (parts.length == 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
}
