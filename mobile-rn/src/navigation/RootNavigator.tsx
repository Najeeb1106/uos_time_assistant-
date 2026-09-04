import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootStackParamList } from './types';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import OnboardingScreen, { ONBOARDING_STORAGE_KEY } from '../screens/onboarding/OnboardingScreen';
import { useMobileStore } from '../stores/useMobileStore';
import { useTheme } from '../constants/Colors';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { colors } = useTheme();
  const isAuthenticated = useMobileStore((state) => state.isAuthenticated);
  const authInitialized = useMobileStore((state) => state.authInitialized);
  const initializeAuth = useMobileStore((state) => state.initializeAuth);

  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    if (!authInitialized) {
      initializeAuth();
    }

    AsyncStorage.getItem(ONBOARDING_STORAGE_KEY)
      .then((val) => {
        setHasSeenOnboarding(val === 'true');
      })
      .catch(() => {
        setHasSeenOnboarding(false);
      });
  }, [authInitialized, initializeAuth]);

  if (!authInitialized || hasSeenOnboarding === null) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Display Onboarding Screen if not completed
  if (!hasSeenOnboarding) {
    return (
      <OnboardingScreen
        onComplete={() => {
          setHasSeenOnboarding(true);
        }}
      />
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <Stack.Screen name="Main" component={MainNavigator} />
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
