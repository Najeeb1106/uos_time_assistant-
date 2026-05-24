import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

class ApiException implements Exception {
  final String message;
  ApiException(this.message);
  @override
  String toString() => message;
}

class ApiService {
  static String _activeBaseUrl = 'http://localhost:3000/api';
  static bool _hasDetected = false;
  static bool _successfullyDetected = false;

  static String get baseUrl {
    return _activeBaseUrl;
  }

  // Auto-detect and probe active backend IP/URL on startup
  static Future<void> detectBaseUrl() async {
    if (kIsWeb) {
      _activeBaseUrl = 'http://localhost:3000/api';
      _hasDetected = true;
      _successfullyDetected = true;
      return;
    }
    
    final candidates = <String>[];
    try {
      if (Platform.isAndroid) {
        candidates.add('http://10.0.2.2:3000/api');
        candidates.add('http://localhost:3000/api'); // For physical USB devices (adb reverse)
      } else {
        candidates.add('http://localhost:3000/api');
      }
    } catch (_) {
      candidates.add('http://localhost:3000/api');
    }

    for (final url in candidates) {
      try {
        final response = await http.get(Uri.parse('$url/status'))
            .timeout(const Duration(milliseconds: 1000));
        if (response.statusCode == 200) {
          _activeBaseUrl = url;
          _hasDetected = true;
          _successfullyDetected = true;
          return;
        }
      } catch (_) {
        // Keep probing other candidates
      }
    }
    
    // Default fallback
    try {
      if (Platform.isAndroid) {
        _activeBaseUrl = 'http://10.0.2.2:3000/api';
      } else {
        _activeBaseUrl = 'http://localhost:3000/api';
      }
    } catch (_) {
      _activeBaseUrl = 'http://localhost:3000/api';
    }
    _hasDetected = true;
    _successfullyDetected = false;
  }

  // --- Authentication ---
  Future<Map<String, dynamic>> login(String email, String password) async {
    if (!_successfullyDetected) await detectBaseUrl();
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/login'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'email': email, 'password': password}),
      ).timeout(const Duration(seconds: 8));

      final data = jsonDecode(response.body);
      if (response.statusCode == 200 && data['success'] == true) {
        return data as Map<String, dynamic>;
      } else {
        throw ApiException(data['message'] ?? 'Login failed. Please verify credentials.');
      }
    } on SocketException {
      throw ApiException('No internet connection. You can continue offline.');
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException('Server connection error. Please try again later.');
    }
  }

  Future<Map<String, dynamic>> register({
    required String email,
    required String password,
    required String fullName,
    required String program,
    required String type,
    required String batch,
    required int semester,
    required String role,
  }) async {
    if (!_successfullyDetected) await detectBaseUrl();
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/register'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'email': email,
          'password': password,
          'fullName': fullName,
          'program': program,
          'type': type,
          'batch': batch,
          'semester': semester,
          'role': role,
        }),
      ).timeout(const Duration(seconds: 8));

      final data = jsonDecode(response.body);
      if ((response.statusCode == 200 || response.statusCode == 201) && data['success'] == true) {
        return data as Map<String, dynamic>;
      } else {
        throw ApiException(data['message'] ?? 'Registration failed.');
      }
    } on SocketException {
      throw ApiException('No internet connection. Registration requires internet.');
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException('Server connection error. Please try again later.');
    }
  }

  // --- Timetable API ---
  Future<Map<String, dynamic>> fetchCurrentSchedule(String token) async {
    if (!_successfullyDetected) await detectBaseUrl();
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/schedule/current'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      ).timeout(const Duration(seconds: 8));

      final data = jsonDecode(response.body);
      if (response.statusCode == 200 && data['success'] == true) {
        return data as Map<String, dynamic>;
      } else {
        throw ApiException(data['message'] ?? 'Failed to retrieve active timetable.');
      }
    } on SocketException {
      throw ApiException('No internet connection. Loading local cache...');
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException('Failed to reach server. Loading offline schedule...');
    }
  }

  Future<Map<String, dynamic>> fetchGlobalSchedule(String token) async {
    if (!_successfullyDetected) await detectBaseUrl();
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/schedule/global'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      ).timeout(const Duration(seconds: 8));

      final data = jsonDecode(response.body);
      if (response.statusCode == 200 && data['success'] == true) {
        return data as Map<String, dynamic>;
      } else {
        throw ApiException(data['message'] ?? 'Failed to retrieve global timetable.');
      }
    } on SocketException {
      throw ApiException('No internet connection.');
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException('Failed to reach server.');
    }
  }

  // --- Profile Update ---
  Future<Map<String, dynamic>> updateProfile(String token, Map<String, dynamic> payload) async {
    if (!_successfullyDetected) await detectBaseUrl();
    try {
      final response = await http.put(
        Uri.parse('$baseUrl/auth/profile'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode(payload),
      ).timeout(const Duration(seconds: 8));

      final data = jsonDecode(response.body);
      if ((response.statusCode == 200 || response.statusCode == 201) && data['success'] == true) {
        return data as Map<String, dynamic>;
      } else {
        throw ApiException(data['message'] ?? 'Failed to update profile coordinates.');
      }
    } on SocketException {
      throw ApiException('No internet connection. Profile sync requires internet.');
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException('Server connection error. Please try again later.');
    }
  }

  // --- Multipart Timetable Parser ---
  Future<Map<String, dynamic>> parseTimetableMultipart(String token, String filePath) async {
    if (!_successfullyDetected) await detectBaseUrl();
    try {
      final request = http.MultipartRequest('POST', Uri.parse('$baseUrl/schedule/upload'));
      request.headers['Authorization'] = 'Bearer $token';
      request.files.add(await http.MultipartFile.fromPath('file', filePath));
      
      final streamedResponse = await request.send().timeout(const Duration(seconds: 25));
      final response = await http.Response.fromStream(streamedResponse);
      
      final data = jsonDecode(response.body);
      if (response.statusCode == 200 && data['success'] == true) {
        return data as Map<String, dynamic>;
      } else {
        throw ApiException(data['message'] ?? 'Failed to parse the selected PDF.');
      }
    } on SocketException {
      throw ApiException('No internet connection. PDF parsing requires internet.');
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException('Server connection error or parsing timeout.');
    }
  }

  // --- Finalize & Save Timetable ---
  Future<Map<String, dynamic>> uploadSchedule(String token, String pdfFileName, List<dynamic> parsedClasses) async {
    if (!_successfullyDetected) await detectBaseUrl();
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/schedule'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'pdfFileName': pdfFileName,
          'classes': parsedClasses,
        }),
      ).timeout(const Duration(seconds: 8));

      final data = jsonDecode(response.body);
      if (response.statusCode == 200 && data['success'] == true) {
        return data as Map<String, dynamic>;
      } else {
        throw ApiException(data['message'] ?? 'Failed to save timetable to your account.');
      }
    } on SocketException {
      throw ApiException('No internet connection. Saving schedule requires internet.');
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException('Server connection error. Please try again later.');
    }
  }
}

