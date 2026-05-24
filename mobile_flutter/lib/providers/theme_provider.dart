import 'package:flutter/material.dart';
import '../services/storage_service.dart';
import '../theme/colors.dart';

class ThemeProvider extends ChangeNotifier {
  final StorageService _storageService;
  late String _themeMode;

  ThemeProvider(this._storageService) {
    // Retrieve persistently cached theme setting (defaults to dark)
    _themeMode = _storageService.getThemeMode();
    AppColors.isDarkMode = (_themeMode == 'dark');
  }

  String get themeMode => _themeMode;
  bool get isDarkMode => _themeMode == 'dark';

  Future<void> toggleTheme() async {
    _themeMode = _themeMode == 'dark' ? 'light' : 'dark';
    AppColors.isDarkMode = (_themeMode == 'dark');
    await _storageService.saveThemeMode(_themeMode);
    notifyListeners();
  }
}
