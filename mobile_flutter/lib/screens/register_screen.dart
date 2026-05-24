import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../providers/auth_provider.dart';
import '../theme/colors.dart';
import '../components/glass_container.dart';
import '../components/gradient_button.dart';
import 'shell_screen.dart';

class RegisterScreen extends StatefulWidget {
  RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  
  // Controllers
  final _fullNameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _batchController = TextEditingController(text: '2024-2028');
  
  // Dropdown States
  String _selectedProgram = 'BS in Software Engineering';
  String _selectedType = 'Regular';
  int _selectedSemester = 2;
  String _selectedRole = 'student';

  bool _obscurePassword = true;

  final List<String> _programs = [
    'BS in Software Engineering',
    'BS in Computer Science',
    'BS in Information Technology',
  ];

  final List<String> _types = [
    'Regular',
    'Self Support',
    'Weekend Self Support',
  ];

  final List<int> _semesters = [1, 2, 3, 4, 5, 6, 7, 8];

  @override
  void dispose() {
    _fullNameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _batchController.dispose();
    super.dispose();
  }

  void _handleRegister() async {
    if (!_formKey.currentState!.validate()) return;

    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    
    final program = _selectedRole == 'teacher' ? 'Faculty' : _selectedProgram;
    final type = _selectedRole == 'teacher' ? 'Regular' : _selectedType;
    final batch = _selectedRole == 'teacher' ? '0000-0000' : _batchController.text.trim();
    final semester = _selectedRole == 'teacher' ? 1 : _selectedSemester;

    final success = await authProvider.register(
      email: _emailController.text.trim(),
      password: _passwordController.text,
      fullName: _fullNameController.text.trim(),
      program: program,
      type: type,
      batch: batch,
      semester: semester,
      role: _selectedRole,
    );

    if (mounted) {
      if (success) {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(builder: (_) => ShellScreen()),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(authProvider.errorMessage ?? 'Registration failed'),
            backgroundColor: AppColors.danger,
          ),
        );
      }
    }
  }

  Widget _buildLabel(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6.0),
      child: Text(
        text,
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w700,
          color: AppColors.textSecondary,
          letterSpacing: 1.0,
        ),
      ),
    );
  }

  InputDecoration _buildInputDecoration(String hint, IconData prefixIcon) {
    return InputDecoration(
      hintText: hint,
      hintStyle: TextStyle(color: AppColors.textMuted, fontSize: 13),
      filled: true,
      fillColor: AppColors.bgPrimary.withOpacity(0.6),
      prefixIcon: Icon(prefixIcon, color: AppColors.textMuted, size: 16),
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: BorderSide(color: AppColors.glassBorder),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: BorderSide(color: AppColors.glassBorder),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: BorderSide(color: AppColors.accentPrimary),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isLoading = Provider.of<AuthProvider>(context).isLoading;

    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: AppColors.authBgGradient,
        ),
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 16.0),
              child: Form(
                key: _formKey,
                child: Column(
                  children: [
                    SizedBox(height: 10),
                    // Header Title
                    Text(
                      'Create Account',
                      style: TextStyle(
                        fontSize: 26,
                        fontWeight: FontWeight.w800,
                        color: AppColors.textPrimary,
                        letterSpacing: -0.5,
                      ),
                    ),
                    SizedBox(height: 6),
                    Text(
                      'Set up your profile to parse and view timetables',
                      style: TextStyle(
                        fontSize: 13,
                        color: AppColors.textSecondary,
                      ),
                    ),
                    SizedBox(height: 24),

                    // Registration Card
                    GlassContainer(
                      padding: const EdgeInsets.all(20.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Full Name
                          _buildLabel('FULL NAME'),
                          TextFormField(
                            controller: _fullNameController,
                            style: TextStyle(color: AppColors.textPrimary, fontSize: 14),
                            decoration: _buildInputDecoration('Enter your full name', LucideIcons.user),
                            validator: (val) => val == null || val.isEmpty ? 'Full name is required' : null,
                          ),
                          SizedBox(height: 16),

                          // Email
                          _buildLabel('EMAIL ADDRESS'),
                          TextFormField(
                            controller: _emailController,
                            style: TextStyle(color: AppColors.textPrimary, fontSize: 14),
                            keyboardType: TextInputType.emailAddress,
                            decoration: _buildInputDecoration('Enter university email', LucideIcons.mail),
                            validator: (val) {
                              if (val == null || val.isEmpty) return 'Email is required';
                              if (!val.contains('@')) return 'Enter a valid email';
                              return null;
                            },
                          ),
                          SizedBox(height: 16),

                          // Password
                          _buildLabel('PASSWORD'),
                          TextFormField(
                            controller: _passwordController,
                            obscureText: _obscurePassword,
                            style: TextStyle(color: AppColors.textPrimary, fontSize: 14),
                            decoration: _buildInputDecoration('Create password (6+ chars)', LucideIcons.lock).copyWith(
                              suffixIcon: IconButton(
                                icon: Icon(
                                  _obscurePassword ? LucideIcons.eyeOff : LucideIcons.eye,
                                  color: AppColors.textMuted,
                                  size: 16,
                                ),
                                onPressed: () {
                                  setState(() {
                                    _obscurePassword = !_obscurePassword;
                                  });
                                },
                              ),
                            ),
                            validator: (val) => val == null || val.length < 6 ? 'Password must be 6+ characters' : null,
                          ),
                          SizedBox(height: 16),

                          // Role (I AM A...) Dropdown moved up for adaptive forms
                          _buildLabel('I AM A...'),
                          Theme(
                            data: Theme.of(context).copyWith(canvasColor: AppColors.bgSecondary),
                            child: DropdownButtonFormField<String>(
                              initialValue: _selectedRole,
                              isExpanded: true,
                              style: TextStyle(color: AppColors.textPrimary, fontSize: 14),
                              decoration: _buildInputDecoration('', LucideIcons.shieldAlert),
                              items: [
                                DropdownMenuItem(
                                  value: 'student',
                                  child: Text('Student', overflow: TextOverflow.ellipsis),
                                ),
                                DropdownMenuItem(
                                  value: 'teacher',
                                  child: Text('Faculty Member', overflow: TextOverflow.ellipsis),
                                ),
                              ],
                              onChanged: (val) => setState(() => _selectedRole = val!),
                            ),
                          ),
                          SizedBox(height: 16),

                          // Student specific fields shown dynamically
                          if (_selectedRole == 'student') ...[
                            // Degree Program Selection
                            _buildLabel('DEGREE PROGRAM'),
                            Theme(
                              data: Theme.of(context).copyWith(canvasColor: AppColors.bgSecondary),
                              child: DropdownButtonFormField<String>(
                                initialValue: _selectedProgram,
                                isExpanded: true,
                                style: TextStyle(color: AppColors.textPrimary, fontSize: 14),
                                decoration: _buildInputDecoration('', LucideIcons.graduationCap),
                                items: _programs.map((prog) => DropdownMenuItem(
                                  value: prog,
                                  child: Text(
                                    prog,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                )).toList(),
                                onChanged: (val) => setState(() => _selectedProgram = val!),
                              ),
                            ),
                            SizedBox(height: 16),

                            // Type & Batch Row
                            Row(
                              children: [
                                // Type
                                Expanded(
                                  flex: 1,
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      _buildLabel('SUPPORT TYPE'),
                                      Theme(
                                        data: Theme.of(context).copyWith(canvasColor: AppColors.bgSecondary),
                                        child: DropdownButtonFormField<String>(
                                          initialValue: _selectedType,
                                          isExpanded: true,
                                          style: TextStyle(color: AppColors.textPrimary, fontSize: 13),
                                          decoration: _buildInputDecoration('', LucideIcons.layers),
                                          items: _types.map((type) => DropdownMenuItem(
                                            value: type,
                                            child: Text(
                                              type,
                                              style: TextStyle(fontSize: 12),
                                              overflow: TextOverflow.ellipsis,
                                            ),
                                          )).toList(),
                                          onChanged: (val) => setState(() => _selectedType = val!),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                SizedBox(width: 12),
                                // Batch
                                Expanded(
                                  flex: 1,
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      _buildLabel('BATCH COHORT'),
                                      TextFormField(
                                        controller: _batchController,
                                        style: TextStyle(color: AppColors.textPrimary, fontSize: 14),
                                        decoration: _buildInputDecoration('e.g. 2024-2028', LucideIcons.calendarRange),
                                        validator: (val) {
                                          if (_selectedRole == 'student') {
                                            return val == null || val.isEmpty ? 'Batch is required' : null;
                                          }
                                          return null;
                                        },
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                            SizedBox(height: 16),

                            // Semester
                            _buildLabel('SEMESTER'),
                            Theme(
                              data: Theme.of(context).copyWith(canvasColor: AppColors.bgSecondary),
                              child: DropdownButtonFormField<int>(
                                initialValue: _selectedSemester,
                                isExpanded: true,
                                style: TextStyle(color: AppColors.textPrimary, fontSize: 14),
                                decoration: _buildInputDecoration('', LucideIcons.clock),
                                items: _semesters.map((sem) => DropdownMenuItem(
                                  value: sem,
                                  child: Text(
                                    'Sem $sem',
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                )).toList(),
                                onChanged: (val) => setState(() => _selectedSemester = val!),
                              ),
                            ),
                            SizedBox(height: 20),
                          ],

                          // Submit Action
                          GradientButton(
                            text: 'Create Account',
                            isLoading: isLoading,
                            onPressed: _handleRegister,
                          ),
                        ],
                      ),
                    ),
                    SizedBox(height: 20),

                    // Back to Login
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          "Already have an account? ",
                          style: TextStyle(color: AppColors.textSecondary, fontSize: 14),
                        ),
                        GestureDetector(
                          onTap: () => Navigator.of(context).pop(),
                          child: Text(
                            'Sign In',
                            style: TextStyle(
                              color: AppColors.accentPrimary,
                              fontWeight: FontWeight.w700,
                              fontSize: 14,
                            ),
                          ),
                        ),
                      ],
                    ),
                    SizedBox(height: 20),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
