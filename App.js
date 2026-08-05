import React, { useEffect, useState, useCallback } from 'react';
import { View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import * as ScreenCapture from 'expo-screen-capture';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Outfit_400Regular, Outfit_500Medium, Outfit_600SemiBold, Outfit_700Bold } from '@expo-google-fonts/outfit';

SplashScreen.preventAutoHideAsync();
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ThemeProvider } from './src/theme/ThemeContext';
import { LanguageProvider } from './src/i18n/i18n';
import { AlertProvider } from './src/context/AlertContext';
import HomeScreen from './src/screens/HomeScreen';
import BrowseScreen from './src/screens/BrowseScreen';
import CategoriesScreen from './src/screens/CategoriesScreen';
import GameScreen from './src/screens/GameScreen';
import FavoritesScreen from './src/screens/FavoritesScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import LanguageScreen from './src/screens/LanguageScreen';
import SubmitGameScreen from './src/screens/SubmitGameScreen';
import ReportIssueScreen from './src/screens/ReportIssueScreen';
import ContinuePlayingScreen from './src/screens/ContinuePlayingScreen';
import AppUpdateModal from './src/components/ui/AppUpdateModal';
import { initializeAds } from './src/ads/AdManager';
import { registerBackgroundSync } from './src/services/gameSyncService';
import { checkForAppUpdate } from './src/services/appUpdateService';
import { checkForOtaUpdate } from './src/services/otaUpdateService';
import { initializeAnonymousSession } from './src/services/authService';
import AppConfig from './src/config/AppConfig';

const Stack = createNativeStackNavigator();

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [updateInfo, setUpdateInfo] = useState(null);
  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [fontsLoaded] = useFonts({
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
  });

  useEffect(() => {
    async function prepare() {
      try {
        // Prevent users from taking screenshots or screen recording
        await ScreenCapture.preventScreenCaptureAsync();

        // Check for biometrics if enabled in settings
        const lockEnabledStr = await AsyncStorage.getItem('winplaybox_app_lock_enabled');
        if (lockEnabledStr === 'true') {
          const hasHardware = await LocalAuthentication.hasHardwareAsync();
          const isEnrolled = await LocalAuthentication.isEnrolledAsync();

          if (hasHardware && isEnrolled) {
            const authResult = await LocalAuthentication.authenticateAsync({
              promptMessage: 'Unlock Game Arcade',
              fallbackLabel: 'Use Passcode',
              cancelLabel: 'Cancel',
              disableDeviceFallback: false,
            });

            if (!authResult.success) {
              console.warn('Biometric auth failed or was cancelled');
              // We do not set isReady or isAuthenticated, meaning the app stays on the Splash Screen or a locked state.
              return; 
            }
          }
        }
        
        setIsAuthenticated(true);

        // Track silent anonymous user session in Firebase
        await initializeAnonymousSession();

        // 1. Silent Check for Over-The-Air (OTA) JS Updates
        const otaReloaded = await checkForOtaUpdate();
        if (otaReloaded) return; // If OTA update reloads the app, stop execution here

        // 2. Fetch dynamic configuration from Firestore
        await AppConfig.fetchRemoteConfig();
        
        initializeAds();
        
        // Register the background sync task (runs headless via OS schedule)
        registerBackgroundSync().catch(() => { });

        // 3. Check for Hard Google Play Store updates via Firebase
        const res = await checkForAppUpdate();
        if (res && res.updateAvailable) {
          setUpdateInfo(res);
          setUpdateModalVisible(true);
        }
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
        setIsReady(true);
      }
    }
    prepare();
  }, []);

  useEffect(() => {
    if (appIsReady && fontsLoaded) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [appIsReady, fontsLoaded]);

  if (!fontsLoaded || !isReady || !isAuthenticated) {
    return null; // Return null so the Native Splash Screen stays visible until unlocked/ready
  }

  const linking = {
    prefixes: [Linking.createURL('/'), 'gamearcade://'],
    config: {
      screens: {
        Home: 'home',
        Game: 'game/:gameId',
      },
    },
  };

  return (
    <ThemeProvider>
      <LanguageProvider>
        <AlertProvider>
          <View style={{ flex: 1, backgroundColor: '#0B0D12' }}>
            <StatusBar style="light" />
            <NavigationContainer linking={linking}>
              <Stack.Navigator
                initialRouteName="Home"
                screenOptions={{
                  headerShown: false,
                  animation: 'slide_from_right',
                }}
              >
                <Stack.Screen name="Home" component={HomeScreen} />
                <Stack.Screen name="Browse" component={BrowseScreen} />
                <Stack.Screen name="Categories" component={CategoriesScreen} />
                <Stack.Screen name="Game" component={GameScreen} />
                <Stack.Screen name="Favorites" component={FavoritesScreen} />
                <Stack.Screen name="Settings" component={SettingsScreen} />
                <Stack.Screen name="Language" component={LanguageScreen} />
                <Stack.Screen name="SubmitGame" component={SubmitGameScreen} />
                <Stack.Screen name="ReportIssue" component={ReportIssueScreen} />
                <Stack.Screen name="ContinuePlaying" component={ContinuePlayingScreen} />
              </Stack.Navigator>

              {/* Global Stitch Reference In-App Update Modal */}
              <AppUpdateModal
                visible={updateModalVisible}
                updateInfo={updateInfo}
                onDismiss={() => setUpdateModalVisible(false)}
              />
            </NavigationContainer>
          </View>
        </AlertProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
