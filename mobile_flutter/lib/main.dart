import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'providers/auth_provider.dart';
import 'providers/schedule_provider.dart';
import 'providers/theme_provider.dart';
import 'services/storage_service.dart';
import 'services/api_service.dart';
import 'screens/login_screen.dart';
import 'screens/shell_screen.dart';
import 'theme/colors.dart';

void main() async {
  // Ensure Flutter engine bindings are initialized first
  WidgetsFlutterBinding.ensureInitialized();

  // Trigger self-healing dynamic backend base URL auto-detection
  await ApiService.detectBaseUrl();

  // Instantiate and initialize local storage databases (Hive & SharedPreferences)
  final storageService = StorageService();
  await storageService.init();

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(
          create: (_) => AuthProvider(storageService),
        ),
        ChangeNotifierProvider(
          create: (_) => ThemeProvider(storageService),
        ),
        ChangeNotifierProxyProvider<AuthProvider, ScheduleProvider>(
          create: (_) => ScheduleProvider(storageService),
          update: (_, auth, schedule) {
            // Trigger auto-sync inside ScheduleProvider whenever auth state transitions to authenticated
            final scheduleProvider = schedule ?? ScheduleProvider(storageService);
            if (auth.isAuthenticated && auth.token != null) {
              scheduleProvider.fetchScheduleFromServer(auth.token!);
            }
            return scheduleProvider;
          },
        ),
      ],
      child: MyApp(),
    ),
  );
}

class MyApp extends StatelessWidget {
  MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final themeProvider = Provider.of<ThemeProvider>(context);

    return MaterialApp(
      title: 'UOS Timetable',
      debugShowCheckedModeBanner: false,
      themeMode: themeProvider.isDarkMode ? ThemeMode.dark : ThemeMode.light,
      
      // Dynamic Premium Light Theme
      theme: ThemeData(
        brightness: Brightness.light,
        scaffoldBackgroundColor: Color(0xFFF8FAFC), // Slate 50 backdrop
        primaryColor: AppColors.accentPrimary,
        colorScheme: ColorScheme.light(
          primary: AppColors.accentPrimary,
          secondary: AppColors.accentSecondary,
          surface: Colors.white,
          onSurface: Color(0xFF0F172A), // Deep Slate
        ),
        
        // Custom text theme leveraging clean material weights for Light Mode
        textTheme: TextTheme(
          displayLarge: TextStyle(color: Color(0xFF0F172A), fontFamily: 'Outfit', fontWeight: FontWeight.bold),
          bodyLarge: TextStyle(color: Color(0xFF475569), fontFamily: 'Outfit'),
          bodyMedium: TextStyle(color: Color(0xFF475569), fontFamily: 'Outfit'),
        ),
        
        // Input decoration matching custom Light Mode forms
        inputDecorationTheme: InputDecorationTheme(
          labelStyle: TextStyle(color: Color(0xFF475569), fontFamily: 'Outfit'),
          hintStyle: TextStyle(color: Color(0xFF94A3B8), fontFamily: 'Outfit'),
          filled: true,
          fillColor: Colors.white,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8),
            borderSide: BorderSide(color: Color(0xFFE2E8F0)),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8),
            borderSide: BorderSide(color: Color(0xFFE2E8F0)),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8),
            borderSide: BorderSide(color: AppColors.accentPrimary),
          ),
        ),
        
        useMaterial3: true,
      ),

      // Premium Dark Theme mirroring the dark web UI
      darkTheme: ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: AppColors.bgPrimary,
        primaryColor: AppColors.accentPrimary,
        colorScheme: ColorScheme.dark(
          primary: AppColors.accentPrimary,
          secondary: AppColors.accentSecondary,
          surface: AppColors.bgSecondary,
          onSurface: AppColors.textPrimary,
        ),
        
        // Custom text theme leveraging clean material weights
        textTheme: TextTheme(
          displayLarge: TextStyle(color: AppColors.textPrimary, fontFamily: 'Outfit', fontWeight: FontWeight.bold),
          bodyLarge: TextStyle(color: AppColors.textSecondary, fontFamily: 'Outfit'),
          bodyMedium: TextStyle(color: AppColors.textSecondary, fontFamily: 'Outfit'),
        ),
        
        // Input decoration matching custom web forms
        inputDecorationTheme: InputDecorationTheme(
          labelStyle: TextStyle(color: AppColors.textSecondary, fontFamily: 'Outfit'),
          hintStyle: TextStyle(color: AppColors.textMuted, fontFamily: 'Outfit'),
          filled: true,
          fillColor: AppColors.bgPrimary.withOpacity(0.6),
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
        ),
        
        useMaterial3: true,
      ),

      // Route based on active authentication state
      home: authProvider.isAuthenticated 
          ? ShellScreen() 
          : LoginScreen(),
    );
  }
}
