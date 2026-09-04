import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MainTabParamList } from './types';
import DashboardScreen from '../screens/main/DashboardScreen';
import ScheduleScreen from '../screens/main/ScheduleScreen';
import FreeRoomsScreen from '../screens/main/FreeRoomsScreen';
import UploadScreen from '../screens/main/UploadScreen';
import ProfileScreen from '../screens/settings/ProfileScreen';
import { useTheme } from '../constants/Colors';

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainNavigator() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const bottomInset = insets.bottom > 0 ? insets.bottom : 8;
  const navBg = isDark ? '#050B1F' : colors.surface;
  const navBorder = isDark ? 'rgba(255, 255, 255, 0.08)' : colors.border;
  const activeColor = '#8B5CF6';
  const inactiveColor = isDark ? '#94A3B8' : '#64748B';

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: navBg,
          borderTopColor: navBorder,
          borderTopWidth: 1,
          height: 54 + bottomInset,
          paddingBottom: bottomInset > 0 ? bottomInset : 8,
          paddingTop: 6,
          elevation: isDark ? 0 : 4,
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: isDark ? 0.3 : 0.05,
          shadowRadius: 6,
        },
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: inactiveColor,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginBottom: 2,
        },
        sceneStyle: { backgroundColor: isDark ? '#050B1F' : colors.background },
      }}
    >
      <Tab.Screen
        name="DashboardTab"
        component={DashboardScreen}
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'grid' : 'grid-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ScheduleTab"
        component={ScheduleScreen}
        options={{
          title: 'Schedule',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'calendar' : 'calendar-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="FreeRoomsTab"
        component={FreeRoomsScreen}
        options={{
          title: 'Free Rooms',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'business' : 'business-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="UploadTab"
        component={UploadScreen}
        options={{
          title: 'Upload',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'cloud-upload' : 'cloud-upload-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={22} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
