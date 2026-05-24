import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../providers/auth_provider.dart';
import '../providers/schedule_provider.dart';
import '../theme/colors.dart';
import '../components/glass_container.dart';

class ProfileScreen extends StatefulWidget {
  ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  // Tab State
  String _activeTab = 'academic'; // 'academic' or 'security'

  // Academic Form Controllers
  late TextEditingController _fullNameController;
  late TextEditingController _batchController;
  String _program = 'BS in Software Engineering';
  int _semester = 2;
  String _type = 'Regular';

  // Security Form Controllers
  late TextEditingController _newPasswordController;
  late TextEditingController _confirmPasswordController;

  @override
  void initState() {
    super.initState();
    _fullNameController = TextEditingController();
    _batchController = TextEditingController();
    _newPasswordController = TextEditingController();
    _confirmPasswordController = TextEditingController();

    // Initialize values from AuthProvider
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _syncFieldsFromProvider();
    });
  }

  void _syncFieldsFromProvider() {
    final user = Provider.of<AuthProvider>(context, listen: false).user;
    if (user != null) {
      setState(() {
        _fullNameController.text = user['fullName'] ?? '';
        _program = user['program'] ?? 'BS in Software Engineering';
        _batchController.text = user['batch'] ?? '2024-2028';
        _semester = user['semester'] is int ? user['semester'] : int.tryParse(user['semester'].toString()) ?? 2;
        _type = user['type'] ?? 'Regular';
      });
    }
  }

  @override
  void dispose() {
    _fullNameController.dispose();
    _batchController.dispose();
    _newPasswordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  // Initials generator for premium avatar badge
  String _getInitials(String? name, String role) {
    if (name == null || name.trim().isEmpty) {
      return role == 'teacher' ? 'TR' : 'ST';
    }
    final parts = name.trim().split(' ');
    if (parts.length == 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  Future<void> _handleSave() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final user = authProvider.user ?? {};
    final isTeacher = user['role'] == 'teacher';

    // Reset error message if any
    authProvider.clearError();

    // Validations
    if (_activeTab == 'academic') {
      if (_fullNameController.text.trim().isEmpty) {
        _showToast('Please specify your full name.', isError: true);
        return;
      }
      if (!isTeacher) {
        if (_batchController.text.trim().isEmpty) {
          _showToast('Please fill in your Session / Batch.', isError: true);
          return;
        }
        if (!RegExp(r'^\d{4}-\d{4}$').hasMatch(_batchController.text.trim())) {
          _showToast('Session must be in YYYY-YYYY format (e.g., 2024-2028).', isError: true);
          return;
        }
      }
    } else {
      if (_newPasswordController.text.isEmpty) {
        _showToast('Please specify a new security password.', isError: true);
        return;
      }
      if (_newPasswordController.text.length < 6) {
        _showToast('Password must be at least 6 characters long.', isError: true);
        return;
      }
      if (_newPasswordController.text != _confirmPasswordController.text) {
        _showToast('Confirm password does not match new password.', isError: true);
        return;
      }
    }

    // Build payload
    final Map<String, dynamic> payload = {
      'fullName': _fullNameController.text.trim(),
    };

    if (!isTeacher) {
      payload['program'] = _program;
      payload['type'] = _type;
      payload['batch'] = _batchController.text.trim();
      payload['semester'] = _semester;
    }

    if (_activeTab == 'security') {
      payload['password'] = _newPasswordController.text;
    }

    // Execute API save
    final success = await authProvider.updateProfile(payload);
    if (success) {
      _showToast(
        _activeTab == 'security'
            ? 'Security credentials successfully synchronized!'
            : isTeacher
                ? 'Instructor profile updated successfully!'
                : 'Student academic profile updated successfully!',
        isError: false,
      );

      // Clear passwords if security tab was active
      if (_activeTab == 'security') {
        setState(() {
          _newPasswordController.clear();
          _confirmPasswordController.clear();
        });
      }
    } else {
      _showToast(authProvider.errorMessage ?? 'An error occurred during synchronization.', isError: true);
    }
  }

  void _showToast(String message, {required bool isError}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        duration: Duration(seconds: 4),
        backgroundColor: Colors.transparent,
        elevation: 0,
        content: GlassContainer(
          borderRadius: 12,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          border: Border.all(
            color: isError ? AppColors.danger.withOpacity(0.3) : AppColors.success.withOpacity(0.3),
            width: 1,
          ),
          color: isError ? AppColors.danger.withOpacity(0.08) : AppColors.success.withOpacity(0.08),
          child: Row(
            children: [
              Icon(
                isError ? LucideIcons.alertTriangle : LucideIcons.checkCircle2,
                color: isError ? AppColors.danger : AppColors.success,
                size: 20,
              ),
              SizedBox(width: 12),
              Expanded(
                child: Text(
                  message,
                  style: TextStyle(
                    color: isError ? Color(0xFFF87171) : AppColors.success,
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final scheduleProvider = Provider.of<ScheduleProvider>(context);

    final user = authProvider.user ?? {};
    final isTeacher = user['role'] == 'teacher';
    final userEmail = user['email'] ?? 'student@uos.edu.pk';
    final userFullName = user['fullName'] ?? 'Ahmed Ali';

    // original user values for live warning alignment calculations
    final origSemester = user['semester'] is int ? user['semester'] : int.tryParse(user['semester']?.toString() ?? '2') ?? 2;
    final origBatch = user['batch'] ?? '2024-2028';
    final origType = user['type'] ?? 'Regular';

    final bool isAlignmentChanged = !isTeacher &&
        (_semester != origSemester ||
            _batchController.text.trim() != origBatch ||
            _type != origType);

    // active loaded classes alignment check
    final totalClassesCount = scheduleProvider.classes.length;
    final alignedClassesCount = scheduleProvider.classes.where((cls) =>
        cls['semester'] == origSemester &&
        cls['batch'] == origBatch &&
        cls['type'] == origType).length;

    final isFullyAligned = isTeacher || totalClassesCount == 0 || alignedClassesCount == totalClassesCount;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Left Column Equivalent: Premium Gradient Avatar Card
          GlassContainer(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              children: [
                // Avatar initials in a beautiful gradient circle
                Container(
                  width: 90,
                  height: 90,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: AppColors.primaryButtonGradient,
                    border: Border.all(color: Colors.white.withOpacity(0.2), width: 2),
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.accentPrimary.withOpacity(0.35),
                        blurRadius: 20,
                        offset: Offset(0, 6),
                      ),
                    ],
                  ),
                  alignment: Alignment.center,
                  child: Text(
                    _getInitials(userFullName, user['role'] ?? 'student'),
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 32,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
                SizedBox(height: 16),

                // Name and Email
                Text(
                  userFullName,
                  style: TextStyle(
                    color: AppColors.textPrimary,
                    fontSize: 20,
                    fontWeight: FontWeight.w800,
                  ),
                  textAlign: TextAlign.center,
                ),
                SizedBox(height: 4),
                Text(
                  userEmail,
                  style: TextStyle(
                    color: AppColors.textSecondary,
                    fontSize: 12,
                  ),
                  textAlign: TextAlign.center,
                ),
                SizedBox(height: 16),

                // Coordination Badges
                if (isTeacher)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    decoration: BoxDecoration(
                      color: AppColors.accentPrimary.withOpacity(0.08),
                      border: Border.all(color: AppColors.accentPrimary.withOpacity(0.15)),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      'Official UOS Faculty Member',
                      style: TextStyle(
                        color: AppColors.accentPrimary,
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  )
                else ...[
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    decoration: BoxDecoration(
                      color: AppColors.accentPrimary.withOpacity(0.08),
                      border: Border.all(color: AppColors.accentPrimary.withOpacity(0.15)),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      _program,
                      style: TextStyle(
                        color: AppColors.accentPrimary,
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ),
                  SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    decoration: BoxDecoration(
                      color: AppColors.bgTertiary,
                      border: Border.all(color: AppColors.glassBorder),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      '$_type • Semester $_semester',
                      style: TextStyle(
                        color: AppColors.textSecondary,
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ],

                // Divider
                Padding(
                  padding: EdgeInsets.symmetric(vertical: 20),
                  child: Divider(color: AppColors.glassBorder, height: 1),
                ),

                // System Coordination Status
                Align(
                  alignment: Alignment.centerLeft,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'SYSTEM COORDINATION STATUS',
                        style: TextStyle(
                          color: AppColors.textMuted,
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 1.0,
                        ),
                      ),
                      SizedBox(height: 12),
                      
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text('Lectures count:', style: TextStyle(color: AppColors.textSecondary, fontSize: 13)),
                          Text(
                            isTeacher ? '$totalClassesCount classes' : '$totalClassesCount parsed',
                            style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w600, fontSize: 13),
                          ),
                        ],
                      ),
                      if (!isTeacher) ...[
                        SizedBox(height: 8),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text('Aligned Classes:', style: TextStyle(color: AppColors.textSecondary, fontSize: 13)),
                            Text(
                              '$alignedClassesCount classes',
                              style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w600, fontSize: 13),
                            ),
                          ],
                        ),
                      ],
                      SizedBox(height: 12),

                      // Status indicators block
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        decoration: BoxDecoration(
                          color: isFullyAligned ? AppColors.success.withOpacity(0.08) : AppColors.warning.withOpacity(0.08),
                          border: Border.all(
                            color: isFullyAligned ? AppColors.success.withOpacity(0.15) : AppColors.warning.withOpacity(0.15),
                          ),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Row(
                          children: [
                            Icon(
                              isFullyAligned ? LucideIcons.shieldCheck : LucideIcons.alertTriangle,
                              color: isFullyAligned ? AppColors.success : AppColors.warning,
                              size: 16,
                            ),
                            SizedBox(width: 8),
                            Text(
                              isFullyAligned 
                                  ? (isTeacher ? 'Auto-filtered by Name' : 'Healthy & Fully Aligned')
                                  : 'Coordinate Mismatch',
                              style: TextStyle(
                                color: isFullyAligned ? AppColors.success : AppColors.warning,
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          SizedBox(height: 20),

          // Right Column Equivalent: Form fields
          GlassContainer(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Premium Glassmorphic Tab Bar Selector
                Container(
                  padding: const EdgeInsets.all(4),
                  decoration: BoxDecoration(
                    color: AppColors.bgPrimary,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: AppColors.glassBorder),
                  ),
                  child: Row(
                    children: [
                      // Tab 1: Academic Coordinates
                      Expanded(
                        child: InkWell(
                          onTap: () => setState(() => _activeTab = 'academic'),
                          child: Container(
                            padding: const EdgeInsets.symmetric(vertical: 8),
                            decoration: BoxDecoration(
                              color: _activeTab == 'academic' ? AppColors.bgSecondary : Colors.transparent,
                              borderRadius: BorderRadius.circular(8),
                              border: _activeTab == 'academic'
                                  ? Border.all(color: AppColors.glassBorder)
                                  : null,
                            ),
                            alignment: Alignment.center,
                            child: Text(
                              isTeacher ? 'Instructor Details' : 'Academic Coordinates',
                              style: TextStyle(
                                color: _activeTab == 'academic' ? AppColors.accentPrimary : AppColors.textSecondary,
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ),
                      ),
                      
                      // Tab 2: Security credentials
                      Expanded(
                        child: InkWell(
                          onTap: () => setState(() => _activeTab = 'security'),
                          child: Container(
                            padding: const EdgeInsets.symmetric(vertical: 8),
                            decoration: BoxDecoration(
                              color: _activeTab == 'security' ? AppColors.bgSecondary : Colors.transparent,
                              borderRadius: BorderRadius.circular(8),
                              border: _activeTab == 'security'
                                  ? Border.all(color: AppColors.glassBorder)
                                  : null,
                            ),
                            alignment: Alignment.center,
                            child: Text(
                              'Account Security',
                              style: TextStyle(
                                color: _activeTab == 'security' ? AppColors.accentPrimary : AppColors.textSecondary,
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                SizedBox(height: 24),

                // Form bodies
                if (_activeTab == 'academic') ...[
                  // Name Field
                  _buildInputLabel(isTeacher ? 'Full Instructor Name' : 'Full Student Name'),
                  SizedBox(height: 8),
                  _buildTextField(
                    controller: _fullNameController,
                    icon: LucideIcons.user,
                    hintText: 'e.g. Ahmed Ali',
                  ),
                  SizedBox(height: 16),

                  if (!isTeacher) ...[
                    // Program Dropdown
                    _buildInputLabel('Degree Program'),
                    SizedBox(height: 8),
                    _buildDropdownField<String>(
                      value: _program,
                      icon: LucideIcons.graduationCap,
                      items: [
                        DropdownMenuItem(value: 'BS in Software Engineering', child: Text('BS Software Eng.')),
                        DropdownMenuItem(value: 'BS in Computer Science', child: Text('BS Computer Sci.')),
                        DropdownMenuItem(value: 'BS in Information Technology', child: Text('BS Info. Tech.')),
                        DropdownMenuItem(value: 'MS in Software Engineering', child: Text('MS Software Eng.')),
                      ],
                      onChanged: (val) {
                        if (val != null) setState(() => _program = val);
                      },
                    ),
                    SizedBox(height: 16),

                    // Batch and Semester Row
                    Row(
                      children: [
                        // Batch Input
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              _buildInputLabel('Session / Batch'),
                              SizedBox(height: 8),
                              _buildTextField(
                                controller: _batchController,
                                icon: LucideIcons.calendar,
                                hintText: 'e.g. 2024-2028',
                                onChanged: (_) => setState(() {}), // Trigger warning repaint
                              ),
                            ],
                          ),
                        ),
                        SizedBox(width: 16),
                        
                        // Semester Dropdown
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              _buildInputLabel('Active Semester'),
                              SizedBox(height: 8),
                              _buildDropdownField<int>(
                                value: _semester,
                                items: List.generate(8, (i) => i + 1).map((s) => DropdownMenuItem(
                                  value: s,
                                  child: Text('Semester $s'),
                                )).toList(),
                                onChanged: (val) {
                                  if (val != null) setState(() => _semester = val);
                                },
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    SizedBox(height: 16),

                    // Academic Support Cohort buttons
                    _buildInputLabel('Academic Support Cohort'),
                    SizedBox(height: 8),
                    Row(
                      children: [
                        _buildCohortButton('Regular', isSelected: _type == 'Regular', flex: 12),
                        SizedBox(width: 8),
                        _buildCohortButton('Self 1', isSelected: _type == 'Self Support 1', flex: 10, realVal: 'Self Support 1'),
                        SizedBox(width: 8),
                        _buildCohortButton('Self 2', isSelected: _type == 'Self Support 2', flex: 10, realVal: 'Self Support 2'),
                      ],
                    ),
                  ],
                ] else ...[
                  // Info Box
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppColors.accentPrimary.withOpacity(0.05),
                      border: Border.all(color: AppColors.accentPrimary.withOpacity(0.15)),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [Icon(LucideIcons.info, color: AppColors.accentPrimary, size: 18),
                        SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            'Update your password credentials below. Your new credentials will be immediately validated against your secure local database or remote auth structures.',
                            style: TextStyle(color: AppColors.textSecondary, fontSize: 11, height: 1.4),
                          ),
                        ),],
                    ),
                  ),
                  SizedBox(height: 20),

                  // New Password Field
                  _buildInputLabel('New Security Password'),
                  SizedBox(height: 8),
                  _buildTextField(
                    controller: _newPasswordController,
                    icon: LucideIcons.lock,
                    hintText: 'At least 6 characters',
                    isObscured: true,
                  ),
                  SizedBox(height: 16),

                  // Confirm Password Field
                  _buildInputLabel('Confirm Security Password'),
                  SizedBox(height: 8),
                  _buildTextField(
                    controller: _confirmPasswordController,
                    icon: LucideIcons.keyRound,
                    hintText: 'Repeat security password',
                    isObscured: true,
                  ),
                ],
                SizedBox(height: 24),

                // Alignment Shift Warning Banner
                if (_activeTab == 'academic' && isAlignmentChanged) ...[
                  Container(
                    margin: const EdgeInsets.only(bottom: 20),
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                        colors: [
                          AppColors.warning.withOpacity(0.08),
                          AppColors.glassBg,
                        ],
                      ),
                      border: Border(
                        left: BorderSide(color: AppColors.warning, width: 4),
                      ),
                      borderRadius: const BorderRadius.only(
                        topRight: Radius.circular(8),
                        bottomRight: Radius.circular(8),
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: AppColors.warning.withOpacity(0.05),
                          blurRadius: 15,
                        ),
                      ],
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          padding: const EdgeInsets.all(6),
                          decoration: BoxDecoration(
                            color: AppColors.warning.withOpacity(0.15),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Icon(LucideIcons.alertTriangle, color: AppColors.warning, size: 16),
                        ),
                        SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Coordinate Alignment Shift',
                                style: TextStyle(
                                  color: AppColors.textPrimary,
                                  fontSize: 13,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                              SizedBox(height: 4),
                              Text(
                                'Warning: Changing your academic alignment details (Semester, Batch, or Support Type) will mismatch your existing parsed schedule. You will need to re-upload your department timetable PDF to align your courses.',
                                style: TextStyle(
                                  color: AppColors.textSecondary,
                                  fontSize: 11,
                                  height: 1.4,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ],

                // Submit Button
                Container(
                  height: 50,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(8.0),
                    gradient: isAlignmentChanged ? AppColors.warningGradient : AppColors.primaryButtonGradient,
                    boxShadow: [
                      BoxShadow(
                        color: (isAlignmentChanged ? AppColors.warning : AppColors.accentPrimary).withOpacity(0.3),
                        blurRadius: 15,
                        offset: Offset(0, 4),
                      ),
                    ],
                  ),
                  child: ElevatedButton(
                    onPressed: authProvider.isLoading ? null : _handleSave,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.transparent,
                      shadowColor: Colors.transparent,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8.0),
                      ),
                      padding: EdgeInsets.zero,
                    ),
                    child: authProvider.isLoading
                        ? SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2.5,
                              valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                            ),
                          )
                        : Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(LucideIcons.sparkles, color: Colors.white, size: 18),
                              SizedBox(width: 8),
                              Text(
                                _activeTab == 'security'
                                    ? 'Update Credentials'
                                    : (isTeacher
                                        ? 'Save Instructor Profile'
                                        : 'Save Academic Changes'),
                                style: TextStyle(
                                  fontSize: 15,
                                  fontWeight: FontWeight.w700,
                                  color: Colors.white,
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
    );
  }

  Widget _buildInputLabel(String label) {
    return Text(
      label,
      style: TextStyle(
        color: AppColors.textSecondary,
        fontSize: 12,
        fontWeight: FontWeight.w600,
      ),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required IconData icon,
    required String hintText,
    bool isObscured = false,
    ValueChanged<String>? onChanged,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.bgPrimary,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: AppColors.glassBorder),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 10),
      child: TextField(
        controller: controller,
        obscureText: isObscured,
        style: TextStyle(color: AppColors.textPrimary, fontSize: 14),
        onChanged: onChanged,
        decoration: InputDecoration(
          icon: Icon(icon, color: AppColors.textMuted, size: 18),
          hintText: hintText,
          hintStyle: TextStyle(color: AppColors.textMuted, fontSize: 14),
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(vertical: 12),
        ),
      ),
    );
  }

  Widget _buildDropdownField<T>({
    required T value,
    IconData? icon,
    required List<DropdownMenuItem<T>> items,
    required ValueChanged<T?> onChanged,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.bgPrimary,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: AppColors.glassBorder),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 10),
      child: DropdownButtonHideUnderline(
        child: DropdownButtonFormField<T>(
          initialValue: value,
          isExpanded: true,
          dropdownColor: AppColors.bgSecondary,
          style: TextStyle(color: AppColors.textPrimary, fontSize: 14),
          decoration: InputDecoration(
            prefixIcon: icon != null ? Icon(icon, color: AppColors.textMuted, size: 18) : null,
            prefixIconConstraints: BoxConstraints(minWidth: 32, maxHeight: 18),
            border: InputBorder.none,
            contentPadding: EdgeInsets.zero,
          ),
          items: items,
          onChanged: onChanged,
        ),
      ),
    );
  }

  Widget _buildCohortButton(String text, {required bool isSelected, required int flex, String? realVal}) {
    final value = realVal ?? text;
    return Expanded(
      flex: flex,
      child: InkWell(
        onTap: () => setState(() => _type = value),
        borderRadius: BorderRadius.circular(8),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            color: isSelected ? AppColors.accentPrimary : AppColors.bgTertiary,
            border: Border.all(
              color: isSelected ? AppColors.accentPrimary : AppColors.glassBorder,
            ),
            borderRadius: BorderRadius.circular(8),
            boxShadow: isSelected
                ? [
                    BoxShadow(
                      color: AppColors.accentPrimary.withOpacity(0.25),
                      blurRadius: 15,
                      offset: Offset(0, 4),
                    ),
                  ]
                : null,
          ),
          alignment: Alignment.center,
          child: Text(
            text,
            style: TextStyle(
              color: isSelected ? Colors.white : AppColors.textSecondary,
              fontSize: 13,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
      ),
    );
  }
}
