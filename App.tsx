/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useEffect } from 'react';
import { StatusBar, useColorScheme, Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as PaperProvider, MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import AppNavigator from './src/navigation/AppNavigator';
import { securityService } from './src/services/securityService';
import { Provider as ReduxProvider } from 'react-redux';
import { store } from './src/redux/store';

// Custom theme matching your app's color scheme
const customLightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#1976D2', // deep blue
    secondary: '#64b5f6', // light blue
    tertiary: '#1976D2',
    surface: '#F5F7FA',
    background: '#FFFFFF',
    error: '#FF6B6B',
    onPrimary: '#FFFFFF',
    onSecondary: '#FFFFFF',
    onSurface: '#1A1A1A',
    onBackground: '#1A1A1A',
  },
  gradient: ['#1976D2', '#64b5f6'],
};

const customDarkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#1976D2',
    secondary: '#64b5f6',
    tertiary: '#1976D2',
    surface: '#1A1A1A',
    background: '#000000',
    error: '#FF6B6B',
    onPrimary: '#FFFFFF',
    onSecondary: '#FFFFFF',
    onSurface: '#FFFFFF',
    onBackground: '#FFFFFF',
  },
  gradient: ['#1976D2', '#64b5f6'],
};

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';
  const theme = isDarkMode ? customDarkTheme : customLightTheme;

  useEffect(() => {
    // Initialize comprehensive security features when app starts
    console.log('Initializing security features...');
    
    const initializeSecurity = async () => {
      try {
        await securityService.initialize();
        console.log('Security features initialized successfully');
      } catch (error) {
        console.error('Error initializing security features:', error);
      }
    };
    
    initializeSecurity();
    
    // Cleanup when app unmounts
    return () => {
      try {
        securityService.cleanup();
        console.log('Security features cleaned up');
      } catch (error) {
        console.error('Error cleaning up security features:', error);
      }
    };
  }, []);

  return (
    <ReduxProvider store={store}>
      <PaperProvider theme={theme}>
        <SafeAreaProvider>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <StatusBar
              barStyle={isDarkMode ? 'light-content' : 'dark-content'}
              backgroundColor="transparent"
              translucent
            />
            <AppNavigator />
          </GestureHandlerRootView>
        </SafeAreaProvider>
      </PaperProvider>
    </ReduxProvider>
  );
}

export default App;
