import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../services/api_service.dart';
import '../services/storage_service.dart';

class ScheduleProvider extends ChangeNotifier {
  final StorageService _storageService;
  final ApiService _apiService = ApiService();

  List<dynamic> _classes = [];
  String? _pdfFileName;
  String? _uploadedAt;
  
  // Global timetable dataset from assets (for offline Free Room Finder)
  List<dynamic> _globalClasses = [];
  bool _isGlobalLoaded = false;

  bool _isLoading = false;
  bool _isOffline = false;
  String? _errorMessage;

  ScheduleProvider(this._storageService) {
    loadLocalSchedule();
    loadGlobalTimetableAsset();
  }

  // Getters
  List<dynamic> get classes => _classes;
  String? get pdfFileName => _pdfFileName;
  String? get uploadedAt => _uploadedAt;
  List<dynamic> get globalClasses => _globalClasses;
  bool get isGlobalLoaded => _isGlobalLoaded;
  bool get isLoading => _isLoading;
  bool get isOffline => _isOffline;
  String? get errorMessage => _errorMessage;

  // Load cached schedule from storage (Hive & SharedPreferences)
  void loadLocalSchedule() {
    _classes = _storageService.getClasses();
    _pdfFileName = _storageService.getPdfFileName();
    _uploadedAt = _storageService.getUploadedAt();
    notifyListeners();
  }

  // Load the massive complete department timetable from assets (offline dataset)
  Future<void> loadGlobalTimetableAsset() async {
    if (_isGlobalLoaded) return;
    try {
      final jsonStr = await rootBundle.loadString('assets/parsed_timetable.json');
      _globalClasses = jsonDecode(jsonStr) as List<dynamic>;
      _isGlobalLoaded = true;
      notifyListeners();
    } catch (e) {
      debugPrint('Failed to load global timetable asset: $e');
    }
  }

  // Sync / Fetch schedule from server (Express backend)
  Future<bool> fetchScheduleFromServer(String token) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await _apiService.fetchCurrentSchedule(token);
      
      final serverClasses = response['classes'] ?? [];
      final serverPdfName = response['pdfFileName'];
      final serverUploadedAt = response['uploadedAt'];

      _classes = serverClasses;
      _pdfFileName = serverPdfName;
      _uploadedAt = serverUploadedAt;
      _isOffline = false;

      // Save to Hive and SharedPreferences for persistent offline caching
      await _storageService.saveClasses(serverClasses);
      await _storageService.saveScheduleMetadata(
        pdfFileName: serverPdfName,
        uploadedAt: serverUploadedAt,
      );

      // Fetch global parsed timetable dynamically if online
      try {
        final globalResponse = await _apiService.fetchGlobalSchedule(token);
        final serverGlobalClasses = globalResponse['classes'] ?? [];
        if (serverGlobalClasses != null && serverGlobalClasses.isNotEmpty) {
          _globalClasses = serverGlobalClasses;
          _isGlobalLoaded = true;
        }
      } catch (globalErr) {
        debugPrint('Failed to sync global timetable: $globalErr');
      }

      _isLoading = false;
      notifyListeners();
      return true;
    } on ApiException catch (e) {
      // Offline fallback: flag offline state, preserve already loaded local storage
      _isOffline = true;
      _errorMessage = e.message;
      loadLocalSchedule(); // Double-ensure local cache is loaded
      _isLoading = false;
      notifyListeners();
      return false;
    } catch (e) {
      _isOffline = true;
      _errorMessage = 'Could not sync with server. Using offline timetable.';
      loadLocalSchedule();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  // --- Upload / Parsing Workspace State ---
  List<dynamic> _parsedClasses = [];
  String _parseStep = 'idle'; // 'idle', 'parsing', 'preview'
  int _parseProgress = 0;
  String _parseStatusText = '';
  String? _parseFileName;

  // Getters
  List<dynamic> get parsedClasses => _parsedClasses;
  String get parseStep => _parseStep;
  int get parseProgress => _parseProgress;
  String get parseStatusText => _parseStatusText;
  String? get parseFileName => _parseFileName;

  void clearParsedState() {
    _parsedClasses = [];
    _parseStep = 'idle';
    _parseProgress = 0;
    _parseStatusText = '';
    _parseFileName = null;
    notifyListeners();
  }

  // Edit in-memory parsed workspace
  void addParsedClass(dynamic newClass) {
    _parsedClasses.add(newClass);
    notifyListeners();
  }

  void updateParsedClass(String classId, dynamic updated) {
    _parsedClasses = _parsedClasses.map((c) {
      if (c['classId'] == classId) {
        return updated;
      }
      return c;
    }).toList();
    notifyListeners();
  }

  void deleteParsedClass(String classId) {
    _parsedClasses.removeWhere((c) => c['classId'] == classId);
    notifyListeners();
  }

  // Action: Parse Timetable File via API
  Future<bool> parseTimetableFile(String token, String filePath, String fileName) async {
    _parseStep = 'parsing';
    _parseProgress = 10;
    _parseStatusText = 'Uploading PDF to secure server...';
    _parseFileName = fileName;
    _errorMessage = null;
    notifyListeners();

    try {
      // Small simulated delay for loading transitions
      await Future.delayed(const Duration(milliseconds: 600));
      _parseProgress = 40;
      _parseStatusText = 'Analyzing timetable coordinates server-side...';
      notifyListeners();

      final response = await _apiService.parseTimetableMultipart(token, filePath);
      
      _parseProgress = 80;
      _parseStatusText = 'Filtering schedule for your student profile...';
      notifyListeners();

      final parsed = response['classes'] as List<dynamic>? ?? [];
      
      _parseProgress = 100;
      _parseStatusText = 'Successfully parsed timetable!';
      
      // Ensure all classes have a classId key (web uses p_ prefix)
      _parsedClasses = parsed.map((cls) {
        final map = Map<String, dynamic>.from(cls);
        if (map['classId'] == null) {
          map['classId'] = 'p_${DateTime.now().microsecondsSinceEpoch}_${map['code']}';
        }
        return map;
      }).toList();

      _parseStep = 'preview';
      notifyListeners();
      return true;
    } on ApiException catch (e) {
      _errorMessage = e.message;
      _parseStep = 'idle';
      notifyListeners();
      return false;
    } catch (e) {
      _errorMessage = 'An unexpected error occurred during parsing.';
      _parseStep = 'idle';
      notifyListeners();
      return false;
    }
  }

  // Action: Simulate Mock Timetable Parsing for Offline/Demo use
  Future<bool> simulateDemoPdf(Map<String, dynamic> user, String fileName) async {
    _parseStep = 'parsing';
    _parseProgress = 10;
    _parseStatusText = 'Uploading PDF to secure server...';
    _parseFileName = fileName;
    _errorMessage = null;
    notifyListeners();

    // Visual progression matching web speed feel
    await Future.delayed(const Duration(milliseconds: 600));
    _parseProgress = 40;
    _parseStatusText = 'Analyzing timetable coordinates server-side...';
    notifyListeners();

    await Future.delayed(const Duration(milliseconds: 800));
    _parseProgress = 80;
    _parseStatusText = 'Filtering schedule for your student profile...';
    notifyListeners();

    await Future.delayed(const Duration(milliseconds: 500));
    _parseProgress = 100;
    _parseStatusText = 'Successfully parsed timetable!';
    notifyListeners();

    final userBatch = user['batch'] ?? '2024-2028';
    final userSem = user['semester'] ?? 2;
    final userType = user['type'] ?? 'Regular';

    _parsedClasses = [
      {
        'classId': 'p_mock_${DateTime.now().millisecondsSinceEpoch}_1',
        'name': 'Object Oriented Programming',
        'code': 'CE1201',
        'room': 'CR224',
        'teacher': 'Dr. Muhammad Summair Raza',
        'day': 'Monday',
        'startTime': '08:30',
        'endTime': '10:00',
        'batch': userBatch,
        'semester': userSem,
        'type': userType
      },
      {
        'classId': 'p_mock_${DateTime.now().millisecondsSinceEpoch}_2',
        'name': 'Software Engineering',
        'code': 'SE1202',
        'room': 'CR225',
        'teacher': 'Dr. Anjum Tariq',
        'day': 'Monday',
        'startTime': '10:15',
        'endTime': '11:45',
        'batch': userBatch,
        'semester': userSem,
        'type': userType
      },
      {
        'classId': 'p_mock_${DateTime.now().millisecondsSinceEpoch}_3',
        'name': 'Discrete Structures',
        'code': 'MA1203',
        'room': 'CR224',
        'teacher': 'Dr. Sajid Ali',
        'day': 'Tuesday',
        'startTime': '08:30',
        'endTime': '10:00',
        'batch': userBatch,
        'semester': userSem,
        'type': userType
      },
      {
        'classId': 'p_mock_${DateTime.now().millisecondsSinceEpoch}_4',
        'name': 'Database Systems (Lab)',
        'code': 'CE1205',
        'room': 'Lab 3',
        'teacher': 'Prof. Yasir Mahmood',
        'day': 'Thursday',
        'startTime': '12:00',
        'endTime': '13:30',
        'batch': userBatch,
        'semester': userSem,
        'type': userType
      }
    ];

    await Future.delayed(const Duration(milliseconds: 300));
    _parseStep = 'preview';
    notifyListeners();
    return true;
  }

  // Action: Confirm & Save Workspace to database
  Future<bool> confirmAndSaveSchedule(String token) async {
    if (_parsedClasses.isEmpty) {
      _errorMessage = 'Your timetable must contain at least one class before saving.';
      notifyListeners();
      return false;
    }

    _parseStep = 'parsing';
    _parseProgress = 90;
    _parseStatusText = 'Saving schedule to your account...';
    _errorMessage = null;
    notifyListeners();

    try {
      await _apiService.uploadSchedule(
        token, 
        _parseFileName ?? 'manual_timetable.pdf', 
        _parsedClasses,
      );

      _parseProgress = 100;
      _parseStatusText = 'Saved successfully!';
      notifyListeners();

      // Trigger full data re-fetch from database to sync dashboard and weekly views
      await fetchScheduleFromServer(token);
      
      // Short delay for visual excellence
      await Future.delayed(const Duration(milliseconds: 500));
      clearParsedState();
      return true;
    } on ApiException catch (e) {
      _errorMessage = e.message;
      _parseStep = 'preview';
      notifyListeners();
      return false;
    } catch (e) {
      _errorMessage = 'Failed to save timetable to your account. Please try again.';
      _parseStep = 'preview';
      notifyListeners();
      return false;
    }
  }

  // Delete Schedule
  Future<void> deleteSchedule() async {
    _classes = [];
    _pdfFileName = null;
    _uploadedAt = null;
    _isOffline = false;
    
    await _storageService.deleteClasses();
    await _storageService.saveScheduleMetadata(pdfFileName: null, uploadedAt: null);
    
    notifyListeners();
  }
}

