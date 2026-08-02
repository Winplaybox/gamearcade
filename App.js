import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ThemeProvider } from './src/theme/ThemeContext';
import { LanguageProvider } from './src/i18n/i18n';
import HomeScreen from './src/screens/HomeScreen';
import BrowseScreen from './src/screens/BrowseScreen';
import CategoriesScreen from './src/screens/CategoriesScreen';
import GameScreen from './src/screens/GameScreen';
import FavoritesScreen from './src/screens/FavoritesScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import LanguageScreen from './src/screens/LanguageScreen';
import SubmitGameScreen from './src/screens/SubmitGameScreen';
import ReportIssueScreen from './src/screens/ReportIssueScreen';
import AppUpdateModal from './src/components/ui/AppUpdateModal';
import SplashScreen from './src/components/ui/SplashScreen';
import { initializeAds } from './src/ads/AdManager';
import { initBackgroundGameSync } from './src/services/gameSyncService';
import { checkForAppUpdate } from './src/services/appUpdateService';

const Stack = createNativeStackNavigator();

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [updateInfo, setUpdateInfo] = useState(null);
  const [updateModalVisible, setUpdateModalVisible] = useState(false);

  useEffect(() => {
    initializeAds();
    // Silent background RSS feed game sync to Firestore (6-hour throttled)
    initBackgroundGameSync().catch(() => { });

    // Check remote Firestore app version info on cold start
    (async () => {
      const res = await checkForAppUpdate();
      if (res && res.updateAvailable) {
        setUpdateInfo(res);
        setUpdateModalVisible(true);
      }
    })();
  }, []);

  return (
    <ThemeProvider>
      <LanguageProvider>
        <View style={{ flex: 1, backgroundColor: '#0B0D12' }}>
          <NavigationContainer>
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
            </Stack.Navigator>

            {/* Global Stitch Reference In-App Update Modal */}
            <AppUpdateModal
              visible={updateModalVisible}
              updateInfo={updateInfo}
              onDismiss={() => setUpdateModalVisible(false)}
            />
          </NavigationContainer>

          {/* 60FPS Animated Startup Splash Screen Overlay */}
          {showSplash && (
            <SplashScreen onFinish={() => setShowSplash(false)} />
          )}
        </View>
      </LanguageProvider>
    </ThemeProvider>
  );
}
