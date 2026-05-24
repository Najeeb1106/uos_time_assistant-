import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:file_picker/file_picker.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../providers/auth_provider.dart';
import '../providers/schedule_provider.dart';
import '../theme/colors.dart';
import '../components/glass_container.dart';

class DashedBorderPainter extends CustomPainter {
  final Color color;
  final double strokeWidth;
  final double gap;

  DashedBorderPainter({
    required this.color,
    this.strokeWidth = 1.5,
    this.gap = 6.0,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..strokeWidth = strokeWidth
      ..style = PaintingStyle.stroke;

    final path = Path();
    path.addRRect(RRect.fromRectAndRadius(
      Rect.fromLTWH(0, 0, size.width, size.height),
      const Radius.circular(16),
    ));

    final dashPath = Path();
    for (final metric in path.computeMetrics()) {
      var distance = 0.0;
      var draw = true;
      while (distance < metric.length) {
        final len = gap;
        if (draw) {
          dashPath.addPath(
            metric.extractPath(distance, distance + len),
            Offset.zero,
          );
        }
        distance += len;
        draw = !draw;
      }
    }
    canvas.drawPath(dashPath, paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class UploadScreen extends StatefulWidget {
  UploadScreen({super.key});

  @override
  State<UploadScreen> createState() => _UploadScreenState();
}

class _UploadScreenState extends State<UploadScreen> {
  // Inline edit state
  String? _editingClassId;
  
  // Card edit controllers
  late TextEditingController _nameController;
  late TextEditingController _codeController;
  late TextEditingController _roomController;
  late TextEditingController _teacherController;
  late TextEditingController _startTimeController;
  late TextEditingController _endTimeController;
  String _day = 'Monday';

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController();
    _codeController = TextEditingController();
    _roomController = TextEditingController();
    _teacherController = TextEditingController();
    _startTimeController = TextEditingController();
    _endTimeController = TextEditingController();
  }

  @override
  void dispose() {
    _nameController.dispose();
    _codeController.dispose();
    _roomController.dispose();
    _teacherController.dispose();
    _startTimeController.dispose();
    _endTimeController.dispose();
    super.dispose();
  }

  void _startEditCard(dynamic cls) {
    setState(() {
      _editingClassId = cls['classId'];
      _nameController.text = cls['name'] ?? '';
      _codeController.text = cls['code'] ?? '';
      _roomController.text = cls['room'] ?? '';
      _teacherController.text = cls['teacher'] ?? '';
      _startTimeController.text = cls['startTime'] ?? '08:30';
      _endTimeController.text = cls['endTime'] ?? '10:00';
      _day = cls['day'] ?? 'Monday';
    });
  }

  void _saveEditCard(BuildContext context) {
    if (_editingClassId == null) return;
    
    final scheduleProvider = Provider.of<ScheduleProvider>(context, listen: false);
    final user = Provider.of<AuthProvider>(context, listen: false).user ?? {};

    final updated = {
      'classId': _editingClassId,
      'name': _nameController.text.trim(),
      'code': _codeController.text.trim(),
      'room': _roomController.text.trim(),
      'teacher': _teacherController.text.trim(),
      'day': _day,
      'startTime': _startTimeController.text.trim(),
      'endTime': _endTimeController.text.trim(),
      'batch': user['batch'] ?? '2024-2028',
      'semester': user['semester'] ?? 2,
      'type': user['type'] ?? 'Regular',
    };

    scheduleProvider.updateParsedClass(_editingClassId!, updated);
    
    setState(() {
      _editingClassId = null;
    });
  }

  void _addNewBlankCard(BuildContext context) {
    final scheduleProvider = Provider.of<ScheduleProvider>(context, listen: false);
    final user = Provider.of<AuthProvider>(context, listen: false).user ?? {};

    final classId = 'p_manual_${DateTime.now().microsecondsSinceEpoch}';
    final newClass = {
      'classId': classId,
      'name': 'New Course Lecture',
      'code': 'CS1000',
      'room': 'CR000',
      'teacher': 'Assign Lecturer',
      'day': 'Monday',
      'startTime': '08:30',
      'endTime': '10:00',
      'batch': user['batch'] ?? '2024-2028',
      'semester': user['semester'] ?? 2,
      'type': user['type'] ?? 'Regular',
    };

    scheduleProvider.addParsedClass(newClass);
    _startEditCard(newClass);
  }

  Future<void> _pickAndParseFile(BuildContext context) async {
    final scheduleProvider = Provider.of<ScheduleProvider>(context, listen: false);
    final authProvider = Provider.of<AuthProvider>(context, listen: false);

    try {
      final result = await FilePicker.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['pdf'],
      );

      if (result != null && result.files.single.path != null) {
        final filePath = result.files.single.path!;
        final fileName = result.files.single.name;
        
        final success = await scheduleProvider.parseTimetableFile(
          authProvider.token!,
          filePath,
          fileName,
        );

        if (!success) {
          _showErrorSnackBar(scheduleProvider.errorMessage ?? 'Failed to parse file.');
        }
      }
    } catch (e) {
      _showErrorSnackBar('Unable to load file picker or process file.');
    }
  }

  Future<void> _simulateDemoPdf(BuildContext context) async {
    final scheduleProvider = Provider.of<ScheduleProvider>(context, listen: false);
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    
    final success = await scheduleProvider.simulateDemoPdf(
      authProvider.user ?? {},
      'official_timetable_demo.pdf',
    );
    if (!success) {
      _showErrorSnackBar(scheduleProvider.errorMessage ?? 'Simulation failed.');
    }
  }

  Future<void> _handleConfirmAndSave(BuildContext context) async {
    final scheduleProvider = Provider.of<ScheduleProvider>(context, listen: false);
    final authProvider = Provider.of<AuthProvider>(context, listen: false);

    final success = await scheduleProvider.confirmAndSaveSchedule(authProvider.token!);
    if (success) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          duration: Duration(seconds: 3),
          backgroundColor: AppColors.success,
          content: Row(
            children: [
              Icon(LucideIcons.checkCircle2, color: Colors.white),
              SizedBox(width: 12),
              Text(
                'Timetable successfully saved to your account!',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
            ],
          ),
        ),
      );
    } else {
      _showErrorSnackBar(scheduleProvider.errorMessage ?? 'Failed to save timetable.');
    }
  }

  void _showErrorSnackBar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        duration: Duration(seconds: 4),
        backgroundColor: AppColors.danger,
        content: Row(
          children: [
            Icon(LucideIcons.alertCircle, color: Colors.white),
            SizedBox(width: 12),
            Expanded(
              child: Text(
                message,
                style: TextStyle(fontWeight: FontWeight.w600),
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final scheduleProvider = Provider.of<ScheduleProvider>(context);
    final authProvider = Provider.of<AuthProvider>(context);
    
    final user = authProvider.user ?? {};
    final step = scheduleProvider.parseStep;
    final progress = scheduleProvider.parseProgress;
    final statusText = scheduleProvider.parseStatusText;
    final parsedClasses = scheduleProvider.parsedClasses;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Screen Header
          if (step != 'parsing') ...[
            Text(
              'Parse Timetable PDF',
              style: TextStyle(
                color: AppColors.textPrimary,
                fontSize: 22,
                fontWeight: FontWeight.w800,
              ),
            ),
            SizedBox(height: 4),
            Text(
              'Upload your department PDF. Our parser will isolate classes for ${user['program'] ?? 'your program'} (Sem ${user['semester'] ?? 2}).',
              style: TextStyle(
                color: AppColors.textSecondary,
                fontSize: 12,
              ),
            ),
            SizedBox(height: 20),
          ],

          // STATE 1: IDLE FILE PICKER / DROPZONE
          if (step == 'idle')
            Expanded(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  GestureDetector(
                    onTap: () => _pickAndParseFile(context),
                    child: CustomPaint(
                      painter: DashedBorderPainter(color: AppColors.glassBorder),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 60, horizontal: 24),
                        decoration: BoxDecoration(
                          color: AppColors.glassBg,
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Column(
                          children: [
                            // Glowing Purple Upload Icon
                            Container(
                              padding: const EdgeInsets.all(20),
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: AppColors.accentPrimary.withOpacity(0.08),
                                border: Border.all(color: AppColors.accentPrimary.withOpacity(0.2)),
                              ),
                              child: Icon(
                                LucideIcons.upload,
                                color: AppColors.accentPrimary,
                                size: 36,
                              ),
                            ),
                            SizedBox(height: 24),
                            
                            Text(
                              'Tap to select official PDF',
                              style: TextStyle(
                                color: AppColors.textPrimary,
                                fontSize: 16,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                            SizedBox(height: 8),
                            Text(
                              'Supports official Department Timetables up to 10MB',
                              style: TextStyle(
                                color: AppColors.textSecondary,
                                fontSize: 11,
                              ),
                              textAlign: TextAlign.center,
                            ),
                            SizedBox(height: 24),
                            
                            ElevatedButton(
                              onPressed: () => _pickAndParseFile(context),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppColors.bgTertiary,
                                foregroundColor: AppColors.textPrimary,
                                side: BorderSide(color: AppColors.glassBorder),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                              ),
                              child: Text('Choose File From Device', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                  SizedBox(height: 20),

                  // Offline Developer Demo Simulator option
                  Container(
                    height: 50,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(8.0),
                      gradient: AppColors.primaryButtonGradient,
                      boxShadow: [
                        BoxShadow(
                          color: AppColors.accentPrimary.withOpacity(0.25),
                          blurRadius: 15,
                          offset: Offset(0, 4),
                        ),
                      ],
                    ),
                    child: ElevatedButton(
                      onPressed: () => _simulateDemoPdf(context),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.transparent,
                        shadowColor: Colors.transparent,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8.0),
                        ),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(LucideIcons.sparkles, color: Colors.white, size: 18),
                          SizedBox(width: 8),
                          Text(
                            'Simulate Demo PDF Parse',
                            style: TextStyle(
                              fontSize: 14,
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

          // STATE 2: PARSING LOADER
          if (step == 'parsing')
            Expanded(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Stack(
                    alignment: Alignment.center,
                    children: [
                      SizedBox(
                        width: 90,
                        height: 90,
                        child: CircularProgressIndicator(
                          value: progress / 100.0,
                          strokeWidth: 4.5,
                          backgroundColor: AppColors.bgTertiary,
                          valueColor: AlwaysStoppedAnimation<Color>(AppColors.accentPrimary),
                        ),
                      ),
                      Icon(
                        LucideIcons.fileText,
                        color: AppColors.accentPrimary,
                        size: 32,
                      ),
                    ],
                  ),
                  SizedBox(height: 32),
                  
                  Text(
                    '$progress% Parsed',
                    style: TextStyle(
                      color: AppColors.textPrimary,
                      fontSize: 20,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  SizedBox(height: 8),
                  Text(
                    statusText,
                    style: TextStyle(
                      color: AppColors.textSecondary,
                      fontSize: 13,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  SizedBox(height: 24),

                  // Custom premium progress bar
                  Container(
                    width: 250,
                    height: 6,
                    decoration: BoxDecoration(
                      color: AppColors.bgTertiary,
                      borderRadius: BorderRadius.circular(3),
                    ),
                    alignment: Alignment.centerLeft,
                    child: Container(
                      width: 250 * (progress / 100.0),
                      height: 6,
                      decoration: BoxDecoration(
                        gradient: AppColors.primaryButtonGradient,
                        borderRadius: BorderRadius.circular(3),
                      ),
                    ),
                  ),
                ],
              ),
            ),

          // STATE 3: PREVIEW WORKSPACE
          if (step == 'preview')
            Expanded(
              child: Column(
                children: [
                  // Workspace Header Card
                  GlassContainer(
                    padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
                    child: Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'PARSER WORKSPACE',
                                style: TextStyle(
                                  color: AppColors.accentPrimary,
                                  fontSize: 10,
                                  fontWeight: FontWeight.w800,
                                  letterSpacing: 0.5,
                                ),
                              ),
                              SizedBox(height: 4),
                              Text(
                                'Found ${parsedClasses.length} courses matching BS SE Sem ${user['semester'] ?? 2}',
                                style: TextStyle(
                                  color: AppColors.textPrimary,
                                  fontSize: 13,
                                  fontWeight: FontWeight.w700,
                                ),
                                overflow: TextOverflow.ellipsis,
                              ),
                            ],
                          ),
                        ),
                        
                        // Workspace Actions Buttons
                        IconButton(
                          icon: Icon(LucideIcons.plus, color: AppColors.textSecondary, size: 20),
                          onPressed: () => _addNewBlankCard(context),
                          tooltip: 'Add custom lecture',
                        ),
                        IconButton(
                          icon: Icon(LucideIcons.check, color: AppColors.success, size: 20),
                          onPressed: () => _handleConfirmAndSave(context),
                          tooltip: 'Confirm and Save',
                        ),
                      ],
                    ),
                  ),
                  SizedBox(height: 12),

                  // Scrollable Course Cards list
                  Expanded(
                    child: ListView.builder(
                      itemCount: parsedClasses.length,
                      itemBuilder: (ctx, index) {
                        final cls = parsedClasses[index];
                        final classId = cls['classId']?.toString() ?? '';
                        final isEditing = _editingClassId == classId;

                        // CARD EDIT MODE
                        if (isEditing) {
                          return Container(
                            margin: const EdgeInsets.only(bottom: 12.0),
                            child: GlassContainer(
                              border: Border.all(color: AppColors.accentSecondary.withOpacity(0.2)),
                              padding: const EdgeInsets.all(16.0),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.stretch,
                                children: [
                                  _buildEditLabel('Course Name'),
                                  _buildEditField(_nameController),
                                  SizedBox(height: 10),

                                  Row(
                                    children: [
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            _buildEditLabel('Code'),
                                            _buildEditField(_codeController),
                                          ],
                                        ),
                                      ),
                                      SizedBox(width: 10),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            _buildEditLabel('Room'),
                                            _buildEditField(_roomController),
                                          ],
                                        ),
                                      ),
                                    ],
                                  ),
                                  SizedBox(height: 10),

                                  _buildEditLabel('Teacher'),
                                  _buildEditField(_teacherController),
                                  SizedBox(height: 10),

                                  Row(
                                    children: [
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            _buildEditLabel('Day'),
                                            Container(
                                              decoration: BoxDecoration(
                                                color: AppColors.bgPrimary,
                                                borderRadius: BorderRadius.circular(6),
                                                border: Border.all(color: AppColors.glassBorder),
                                              ),
                                              padding: const EdgeInsets.symmetric(horizontal: 10),
                                              child: DropdownButtonHideUnderline(
                                                child: DropdownButton<String>(
                                                  value: _day,
                                                  dropdownColor: AppColors.bgSecondary,
                                                  style: TextStyle(color: AppColors.textPrimary, fontSize: 13),
                                                  isExpanded: true,
                                                  items: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
                                                      .map((d) => DropdownMenuItem(value: d, child: Text(d)))
                                                      .toList(),
                                                  onChanged: (val) {
                                                    if (val != null) setState(() => _day = val);
                                                  },
                                                ),
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                      SizedBox(width: 10),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            _buildEditLabel('Start Time'),
                                            _buildEditField(_startTimeController, hint: 'e.g. 08:30'),
                                          ],
                                        ),
                                      ),
                                      SizedBox(width: 10),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            _buildEditLabel('End Time'),
                                            _buildEditField(_endTimeController, hint: 'e.g. 10:00'),
                                          ],
                                        ),
                                      ),
                                    ],
                                  ),
                                  SizedBox(height: 16),

                                  // Edit Actions buttons
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.end,
                                    children: [
                                      TextButton(
                                        onPressed: () => setState(() => _editingClassId = null),
                                        child: Text('Cancel', style: TextStyle(color: AppColors.textSecondary, fontSize: 13)),
                                      ),
                                      SizedBox(width: 8),
                                      ElevatedButton(
                                        onPressed: () => _saveEditCard(context),
                                        style: ElevatedButton.styleFrom(
                                          backgroundColor: AppColors.accentPrimary,
                                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                                        ),
                                        child: Row(
                                          children: [
                                            Icon(LucideIcons.check, color: Colors.white, size: 14),
                                            SizedBox(width: 6),
                                            Text('Keep Edit', style: TextStyle(color: Colors.white, fontSize: 13)),
                                          ],
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          );
                        }

                        // CARD VIEW MODE
                        return Container(
                          margin: const EdgeInsets.only(bottom: 12.0),
                          child: GlassContainer(
                            padding: const EdgeInsets.all(16.0),
                            child: Row(
                              children: [
                                // Class Card contents
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        children: [
                                          Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                            decoration: BoxDecoration(
                                              color: AppColors.bgTertiary,
                                              borderRadius: BorderRadius.circular(4),
                                              border: Border.all(color: AppColors.glassBorder),
                                            ),
                                            child: Text(
                                              cls['code'] ?? 'CS101',
                                              style: TextStyle(
                                                color: AppColors.textMuted,
                                                fontSize: 10,
                                                fontWeight: FontWeight.w600,
                                              ),
                                            ),
                                          ),
                                          SizedBox(width: 8),
                                          Expanded(
                                            child: Text(
                                              cls['name'] ?? 'Object Oriented Programming',
                                              style: TextStyle(
                                                color: AppColors.textPrimary,
                                                fontSize: 14,
                                                fontWeight: FontWeight.w700,
                                              ),
                                              overflow: TextOverflow.ellipsis,
                                            ),
                                          ),
                                        ],
                                      ),
                                      SizedBox(height: 8),
                                      
                                      // Meta Row with Lucide icons
                                      Wrap(
                                        spacing: 12,
                                        runSpacing: 6,
                                        children: [
                                          _buildCardMetaItem(
                                            LucideIcons.clock,
                                            AppColors.accentPrimary,
                                            '${cls['day'] ?? 'Monday'} ${cls['startTime'] ?? '08:30'} - ${cls['endTime'] ?? '10:00'}',
                                          ),
                                          _buildCardMetaItem(
                                            LucideIcons.mapPin,
                                            AppColors.accentSecondary,
                                            'Room ${cls['room'] ?? 'CR224'}',
                                          ),
                                          _buildCardMetaItem(
                                            LucideIcons.user,
                                            AppColors.textMuted,
                                            cls['teacher'] ?? 'Dr. Raza',
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                ),
                                SizedBox(width: 8),

                                // Card Quick Actions Drawer
                                Column(
                                  children: [
                                    IconButton(
                                      icon: Icon(LucideIcons.edit3, color: AppColors.textSecondary, size: 16),
                                      onPressed: () => _startEditCard(cls),
                                      constraints: BoxConstraints(),
                                      padding: const EdgeInsets.all(6),
                                      tooltip: 'Edit parsed parameters',
                                    ),
                                    IconButton(
                                      icon: Icon(LucideIcons.trash2, color: AppColors.danger, size: 16),
                                      onPressed: () {
                                        showDialog(
                                          context: context,
                                          builder: (dialogCtx) => AlertDialog(
                                            backgroundColor: AppColors.bgSecondary,
                                            title: Text('Delete Class', style: TextStyle(color: AppColors.textPrimary)),
                                            content: Text('Remove this parsed lecture from this schedule?', style: TextStyle(color: AppColors.textSecondary)),
                                            actions: [
                                              TextButton(
                                                onPressed: () => Navigator.pop(dialogCtx),
                                                child: Text('Cancel', style: TextStyle(color: AppColors.textSecondary)),
                                              ),
                                              ElevatedButton(
                                                onPressed: () {
                                                  Navigator.pop(dialogCtx);
                                                  scheduleProvider.deleteParsedClass(classId);
                                                },
                                                style: ElevatedButton.styleFrom(backgroundColor: AppColors.danger),
                                                child: Text('Delete', style: TextStyle(color: Colors.white)),
                                              ),
                                            ],
                                          ),
                                        );
                                      },
                                      constraints: BoxConstraints(),
                                      padding: const EdgeInsets.all(6),
                                      tooltip: 'Remove card',
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                  SizedBox(height: 12),

                  // Bottom workspace controls
                  ElevatedButton(
                    onPressed: () => scheduleProvider.clearParsedState(),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.transparent,
                      foregroundColor: AppColors.textSecondary,
                      side: BorderSide(color: AppColors.glassBorder),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(LucideIcons.refreshCw, size: 14),
                        SizedBox(width: 8),
                        Text('Re-upload PDF', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                      ],
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildCardMetaItem(IconData icon, Color color, String text) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, color: color, size: 13),
        SizedBox(width: 4),
        Flexible(
          child: Text(
            text,
            style: TextStyle(color: AppColors.textSecondary, fontSize: 11),
            overflow: TextOverflow.ellipsis,
            maxLines: 1,
          ),
        ),
      ],
    );
  }

  Widget _buildEditLabel(String label) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Text(
        label,
        style: TextStyle(color: AppColors.textSecondary, fontSize: 11, fontWeight: FontWeight.bold),
      ),
    );
  }

  Widget _buildEditField(TextEditingController controller, {String? hint}) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.bgPrimary,
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: AppColors.glassBorder),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 10),
      child: TextField(
        controller: controller,
        style: TextStyle(color: AppColors.textPrimary, fontSize: 13),
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: TextStyle(color: AppColors.textMuted, fontSize: 13),
          border: InputBorder.none,
          isDense: true,
          contentPadding: const EdgeInsets.symmetric(vertical: 8),
        ),
      ),
    );
  }
}
