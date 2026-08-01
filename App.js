import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ThemeProvider } from './src/theme/ThemeContext';
import { LanguageProvider } from './src/i18n/i18n';
import HomeScreen from './src/screens/HomeScreen';
import BrowseScreen from './src/screens/BrowseScreen';
import GameScreen from './src/screens/GameScreen';
import FavoritesScreen from './src/screens/FavoritesScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import { initializeAds } from './src/ads/AdManager';

const Stack = createNativeStackNavigator();

export default function App() {
  useEffect(() => {
    initializeAds();
  }, []);

  return (
    <ThemeProvider>
      <LanguageProvider>
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
            <Stack.Screen name="Game" component={GameScreen} />
            <Stack.Screen name="Favorites" component={FavoritesScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </LanguageProvider>
    </ThemeProvider>
  );
}
