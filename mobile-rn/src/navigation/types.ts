import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

// Auth Stack Param List
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

// Main Tab Param List
export type MainTabParamList = {
  DashboardTab: undefined;
  ScheduleTab: undefined;
  FreeRoomsTab: undefined;
  UploadTab: undefined;
  ProfileTab: undefined;
};

// Root Stack Param List
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

// Navigation Props Helpers
export type AuthNavigationProp<T extends keyof AuthStackParamList> = NativeStackNavigationProp<AuthStackParamList, T>;
export type MainTabNavigationProp<T extends keyof MainTabParamList> = BottomTabNavigationProp<MainTabParamList, T>;
