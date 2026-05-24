import 'dart:convert';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:shared_preferences/shared_preferences.dart';

class StorageService {
  static const String _keyToken = 'uos_token';
  static const String _keyUser = 'uos_user';
  static const String _keyTheme = 'uos_theme';
  static const String _boxScheduleName = 'schedule_box';
  static const String _keyClasses = 'uos_classes';
  static const String _keyUploadedAt = 'uos_uploaded_at';
  static const String _keyPdfName = 'uos_pdf_name';

  late SharedPreferences _prefs;
  late Box _scheduleBox;

  // Initialize both Hive and Shared Preferences
  Future<void> init() async {
    await Hive.initFlutter();
    _scheduleBox = await Hive.openBox(_boxScheduleName);
    _prefs = await SharedPreferences.getInstance();
  }

  // --- Auth Token Management ---
  Future<void> saveToken(String token) async {
    await _prefs.setString(_keyToken, token);
  }

  String? getToken() {
    return _prefs.getString(_keyToken);
  }

  Future<void> deleteToken() async {
    await _prefs.remove(_keyToken);
  }

  // --- User Profile Management ---
  Future<void> saveUser(Map<String, dynamic> user) async {
    await _prefs.setString(_keyUser, jsonEncode(user));
  }

  Map<String, dynamic>? getUser() {
    final userStr = _prefs.getString(_keyUser);
    if (userStr == null) return null;
    try {
      return jsonDecode(userStr) as Map<String, dynamic>;
    } catch (_) {
      return null;
    }
  }

  Future<void> deleteUser() async {
    await _prefs.remove(_keyUser);
  }

  // --- Theme Mode Management ---
  Future<void> saveThemeMode(String mode) async {
    await _prefs.setString(_keyTheme, mode);
  }

  String getThemeMode() {
    return _prefs.getString(_keyTheme) ?? 'dark';
  }

  // --- Timetable Classes Caching (Hive) ---
  Future<void> saveClasses(List<dynamic> classesList) async {
    // Save to Hive as a JSON string to ensure clean format resilience
    await _scheduleBox.put(_keyClasses, jsonEncode(classesList));
  }

  List<dynamic> getClasses() {
    final classesStr = _scheduleBox.get(_keyClasses);
    if (classesStr == null) return [];
    try {
      return jsonDecode(classesStr) as List<dynamic>;
    } catch (_) {
      return [];
    }
  }

  Future<void> deleteClasses() async {
    await _scheduleBox.delete(_keyClasses);
  }

  // --- Metadata Caching ---
  Future<void> saveScheduleMetadata({
    required String? pdfFileName,
    required String? uploadedAt,
  }) async {
    if (pdfFileName != null) {
      await _prefs.setString(_keyPdfName, pdfFileName);
    } else {
      await _prefs.remove(_keyPdfName);
    }

    if (uploadedAt != null) {
      await _prefs.setString(_keyUploadedAt, uploadedAt);
    } else {
      await _prefs.remove(_keyUploadedAt);
    }
  }

  String? getPdfFileName() => _prefs.getString(_keyPdfName);
  String? getUploadedAt() => _prefs.getString(_keyUploadedAt);

  // --- Universal Clear ---
  Future<void> clearAll() async {
    await _prefs.clear();
    await _scheduleBox.clear();
  }
}
