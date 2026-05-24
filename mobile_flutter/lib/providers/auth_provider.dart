import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../services/storage_service.dart';

class AuthProvider extends ChangeNotifier {
  final StorageService _storageService;
  final ApiService _apiService = ApiService();

  Map<String, dynamic>? _user;
  String? _token;
  bool _isLoading = false;
  String? _errorMessage;

  AuthProvider(this._storageService) {
    // Automatically load cached session on startup
    _token = _storageService.getToken();
    _user = _storageService.getUser();
  }

  // Getters
  Map<String, dynamic>? get user => _user;
  String? get token => _token;
  bool get isAuthenticated => _token != null;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  // Clear error message
  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }

  // Login Action
  Future<bool> login(String email, String password) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await _apiService.login(email, password);
      
      _token = response['token'];
      _user = response['user'];

      // Persist to local storage for offline use
      await _storageService.saveToken(_token!);
      await _storageService.saveUser(_user!);

      _isLoading = false;
      notifyListeners();
      return true;
    } on ApiException catch (e) {
      _errorMessage = e.message;
      _isLoading = false;
      notifyListeners();
      return false;
    } catch (e) {
      _errorMessage = 'An unexpected error occurred during login.';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  // Register Action
  Future<bool> register({
    required String email,
    required String password,
    required String fullName,
    required String program,
    required String type,
    required String batch,
    required int semester,
    required String role,
  }) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await _apiService.register(
        email: email,
        password: password,
        fullName: fullName,
        program: program,
        type: type,
        batch: batch,
        semester: semester,
        role: role,
      );

      _token = response['token'];
      _user = response['user'];

      // Persist to local storage for offline use
      await _storageService.saveToken(_token!);
      await _storageService.saveUser(_user!);

      _isLoading = false;
      notifyListeners();
      return true;
    } on ApiException catch (e) {
      _errorMessage = e.message;
      _isLoading = false;
      notifyListeners();
      return false;
    } catch (e) {
      _errorMessage = 'An unexpected error occurred during registration.';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  // Update Profile Action
  Future<bool> updateProfile(Map<String, dynamic> profileData) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await _apiService.updateProfile(_token!, profileData);
      
      _user = response['user'];

      // Persist to local storage for offline use
      await _storageService.saveUser(_user!);

      _isLoading = false;
      notifyListeners();
      return true;
    } on ApiException catch (e) {
      _errorMessage = e.message;
      _isLoading = false;
      notifyListeners();
      return false;
    } catch (e) {
      _errorMessage = 'An unexpected error occurred during profile synchronization.';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  // Logout Action
  Future<void> logout() async {
    _token = null;
    _user = null;
    await _storageService.clearAll();
    notifyListeners();
  }
}

