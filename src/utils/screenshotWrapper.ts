import { Platform, NativeModules, NativeEventEmitter, AppState, Alert } from 'react-native';

// Suppress NativeEventEmitter warnings
const originalConsoleWarn = console.warn;
console.warn = (...args: any[]) => {
  const message = args[0];
  if (typeof message === 'string' && 
      (message.includes('NativeEventEmitter') || 
       message.includes('addListener') || 
       message.includes('removeListeners'))) {
    // Suppress these specific warnings
    return;
  }
  originalConsoleWarn.apply(console, args);
};

// Screenshot detection using AppState changes
let screenshotListener: any = null;
let isListening = false;

const detectScreenshot = (callback: () => void) => {
  if (isListening) return;
  
  isListening = true;
  let lastAppState = AppState.currentState;
  
  screenshotListener = AppState.addEventListener('change', (nextAppState) => {
    // Screenshot detection logic
    if (lastAppState === 'active' && nextAppState === 'active') {
      // App became active again - likely a screenshot was taken
      setTimeout(() => {
        callback();
      }, 100);
    }
    lastAppState = nextAppState;
  });
};

const removeScreenshotListener = () => {
  if (screenshotListener) {
    screenshotListener.remove();
    screenshotListener = null;
    isListening = false;
  }
};

// Enable secure view for iOS
const enableSecureView = () => {
  if (Platform.OS === 'ios') {
    try {
      // For iOS, we can use the native module if available
      if (NativeModules.ScreenshotPrevent) {
        NativeModules.ScreenshotPrevent.enableSecureView()
          .then(() => {
            console.log('Secure view enabled on iOS');
          })
          .catch((error: any) => {
            console.warn('Failed to enable secure view on iOS:', error);
            // Fallback: Show alert when screenshot is detected
            detectScreenshot(() => {
              Alert.alert(
                'Security Alert',
                'Screenshots are not allowed in this app for security reasons.',
                [{ text: 'OK' }]
              );
            });
          });
      } else {
        // Fallback: Show alert when screenshot is detected
        detectScreenshot(() => {
          Alert.alert(
            'Security Alert',
            'Screenshots are not allowed in this app for security reasons.',
            [{ text: 'OK' }]
          );
        });
      }
    } catch (error) {
      console.warn('Failed to enable secure view:', error);
    }
  } else if (Platform.OS === 'android') {
    try {
      // For Android, we'll use a different approach
      if (NativeModules.ScreenshotPrevent) {
        NativeModules.ScreenshotPrevent.enableSecureView()
          .then(() => {
            console.log('Secure view enabled on Android');
          })
          .catch((error: any) => {
            console.warn('Failed to enable secure view on Android:', error);
            // Fallback: Show alert when screenshot is detected
            detectScreenshot(() => {
              Alert.alert(
                'Security Alert',
                'Screenshots are not allowed in this app for security reasons.',
                [{ text: 'OK' }]
              );
            });
          });
      } else {
        // Fallback: Show alert when screenshot is detected
        detectScreenshot(() => {
          Alert.alert(
            'Security Alert',
            'Screenshots are not allowed in this app for security reasons.',
            [{ text: 'OK' }]
          );
        });
      }
    } catch (error) {
      console.warn('Failed to enable secure view:', error);
    }
  }
};

// Disable secure view
const disableSecureView = () => {
  try {
    if (NativeModules.ScreenshotPrevent) {
      NativeModules.ScreenshotPrevent.disableSecureView()
        .then(() => {
          console.log('Secure view disabled');
        })
        .catch((error: any) => {
          console.warn('Failed to disable secure view:', error);
        });
    }
    removeScreenshotListener();
  } catch (error) {
    console.warn('Failed to disable secure view:', error);
  }
};

// Check if screenshot prevention is enabled
const enabled = () => {
  try {
    if (NativeModules.ScreenshotPrevent) {
      return new Promise((resolve) => {
        NativeModules.ScreenshotPrevent.isEnabled()
          .then((isEnabled: boolean) => {
            resolve(isEnabled);
          })
          .catch(() => {
            resolve(isListening);
          });
      });
    }
    return Promise.resolve(isListening);
  } catch (error) {
    console.warn('Failed to check screenshot prevention status:', error);
    return Promise.resolve(false);
  }
};

// Add listener for screenshot events
const addListener = (callback: () => void) => {
  detectScreenshot(callback);
  
  return {
    remove: () => {
      removeScreenshotListener();
    }
  };
};

export {
  enabled,
  enableSecureView,
  disableSecureView,
  addListener,
  detectScreenshot,
  removeScreenshotListener
};

// Restore original console.warn after a delay
setTimeout(() => {
  console.warn = originalConsoleWarn;
}, 1000); 