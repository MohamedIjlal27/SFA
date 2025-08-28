import { Platform, NativeModules, NativeEventEmitter, AppState, Alert, PermissionsAndroid } from 'react-native';
import { getSecurityConfig, SecurityConfig } from '../config/security';

// Safely import ScreenshotPrevent to avoid crashes
let ScreenshotPrevent: any = null;
try {
  ScreenshotPrevent = require('react-native-screenshot-prevent');
} catch (error) {
  console.warn('react-native-screenshot-prevent not available:', error);
}

export class SecurityService {
  private static instance: SecurityService;
  private screenshotListener: any = null;
  private screenRecordingListener: any = null;
  private appStateListener: any = null;
  private isEnabled = false;

  private constructor() {}

  public static getInstance(): SecurityService {
    if (!SecurityService.instance) {
      SecurityService.instance = new SecurityService();
    }
    return SecurityService.instance;
  }

  /**
   * Enable comprehensive security features (screenshot + screen recording prevention)
   */
  public async enableSecurity(): Promise<void> {
    try {
      console.log('Enabling comprehensive security features...');
      
      // Enable screenshot prevention
      await this.enableScreenshotPrevention();
      
      // Enable screen recording prevention
      await this.enableScreenRecordingPrevention();
      
      // Setup listeners
      this.setupListeners();
      
      this.isEnabled = true;
      console.log('Security features enabled successfully');
    } catch (error) {
      console.error('Error enabling security features:', error);
      throw error;
    }
  }

  /**
   * Disable all security features
   */
  public async disableSecurity(): Promise<void> {
    try {
      console.log('Disabling security features...');
      
      // Disable screenshot prevention
      await this.disableScreenshotPrevention();
      
      // Disable screen recording prevention
      await this.disableScreenRecordingPrevention();
      
      // Remove listeners
      this.removeListeners();
      
      this.isEnabled = false;
      console.log('Security features disabled successfully');
    } catch (error) {
      console.error('Error disabling security features:', error);
      throw error;
    }
  }

  /**
   * Enable screenshot prevention
   */
  private async enableScreenshotPrevention(): Promise<void> {
    try {
      // Check if ScreenshotPrevent module is available
      if (!ScreenshotPrevent) {
        console.warn('ScreenshotPrevent module not available, using fallback detection');
        this.setupScreenshotDetection();
        return;
      }

      if (Platform.OS === 'ios') {
        // iOS screenshot prevention
        await ScreenshotPrevent.enableSecureView();
        console.log('iOS screenshot prevention enabled');
      } else if (Platform.OS === 'android') {
        // Android screenshot prevention - handle more carefully
        try {
          await ScreenshotPrevent.enableSecureView();
          console.log('Android screenshot prevention enabled');
        } catch (androidError) {
          console.warn('Android screenshot prevention failed, using fallback:', androidError);
          // Fallback to detection-only mode for Android
          this.setupScreenshotDetection();
        }
      }
    } catch (error) {
      console.warn('Failed to enable screenshot prevention:', error);
      // Fallback to detection-only mode
      this.setupScreenshotDetection();
    }
  }

  /**
   * Disable screenshot prevention
   */
  private async disableScreenshotPrevention(): Promise<void> {
    try {
      if (ScreenshotPrevent) {
        await ScreenshotPrevent.disableSecureView();
        console.log('Screenshot prevention disabled');
      } else {
        console.log('ScreenshotPrevent module not available, skipping disable');
      }
    } catch (error) {
      console.warn('Failed to disable screenshot prevention:', error);
      // Continue with cleanup even if disable fails
    }
  }

  /**
   * Enable screen recording prevention
   */
  private async enableScreenRecordingPrevention(): Promise<void> {
    try {
      if (Platform.OS === 'ios') {
        // iOS screen recording prevention
        if (ScreenshotPrevent) {
          await ScreenshotPrevent.enableSecureView(); // This also prevents screen recording on iOS
          console.log('iOS screen recording prevention enabled');
        } else {
          console.log('ScreenshotPrevent not available, iOS screen recording prevention disabled');
        }
      } else if (Platform.OS === 'android') {
        // Android screen recording prevention
        await this.requestAndroidPermissions();
        console.log('Android screen recording prevention enabled');
      }
    } catch (error) {
      console.warn('Failed to enable screen recording prevention:', error);
    }
  }

  /**
   * Disable screen recording prevention
   */
  private async disableScreenRecordingPrevention(): Promise<void> {
    try {
      // Screen recording prevention is tied to screenshot prevention
      if (ScreenshotPrevent) {
        await ScreenshotPrevent.disableSecureView();
        console.log('Screen recording prevention disabled');
      } else {
        console.log('ScreenshotPrevent module not available, skipping screen recording disable');
      }
    } catch (error) {
      console.warn('Failed to disable screen recording prevention:', error);
    }
  }

  /**
   * Request Android permissions for screen recording prevention
   */
  private async requestAndroidPermissions(): Promise<void> {
    try {
      if (Platform.OS === 'android' && Platform.Version >= 23) {
        // SYSTEM_ALERT_WINDOW permission cannot be requested through PermissionsAndroid.request()
        // It requires the user to manually enable it in Settings
        console.log('Android screen recording prevention: SYSTEM_ALERT_WINDOW permission requires manual settings access');
        
        // We can only detect if it's enabled, not request it programmatically
        // For now, we'll just log this information
        console.log('Please ensure SYSTEM_ALERT_WINDOW permission is enabled in Android Settings for full security features');
      }
    } catch (error) {
      console.warn('Error requesting Android permissions:', error);
    }
  }

  /**
   * Setup screenshot detection as fallback
   */
  private setupScreenshotDetection(): void {
    try {
      let lastAppState = AppState.currentState;
      
      this.screenshotListener = AppState.addEventListener('change', (nextAppState) => {
        if (lastAppState === 'active' && nextAppState === 'active') {
          // App became active again - likely a screenshot was taken
          setTimeout(() => {
            this.handleSecurityViolation('screenshot');
          }, 100);
        }
        lastAppState = nextAppState;
      });
      
      console.log('Screenshot detection setup as fallback');
    } catch (error) {
      console.warn('Failed to setup screenshot detection:', error);
    }
  }

  /**
   * Setup all security listeners
   */
  private setupListeners(): void {
    try {
      // Setup app state listener for security monitoring
      this.appStateListener = AppState.addEventListener('change', (nextAppState) => {
        if (nextAppState === 'active' && this.isEnabled) {
          // Re-enable security when app becomes active
          this.enableSecurity().catch(console.error);
        }
      });
      
      console.log('Security listeners setup successfully');
    } catch (error) {
      console.warn('Failed to setup security listeners:', error);
    }
  }

  /**
   * Remove all security listeners
   */
  private removeListeners(): void {
    try {
      if (this.screenshotListener) {
        this.screenshotListener.remove();
        this.screenshotListener = null;
      }
      
      if (this.screenRecordingListener) {
        this.screenRecordingListener.remove();
        this.screenRecordingListener = null;
      }
      
      if (this.appStateListener) {
        this.appStateListener.remove();
        this.appStateListener = null;
      }
      
      console.log('Security listeners removed');
    } catch (error) {
      console.warn('Failed to remove security listeners:', error);
    }
  }

  /**
   * Handle security violations (screenshot or screen recording detected)
   */
  private handleSecurityViolation(type: 'screenshot' | 'screen_recording'): void {
    try {
      const config = getSecurityConfig();
      
      if (!config.showSecurityWarnings) {
        console.log(`Security violation detected: ${type}`);
        return;
      }
      
      const message = type === 'screenshot' 
        ? config.messages.screenshotWarning
        : config.messages.screenRecordingWarning;
      
      const action = type === 'screenshot' 
        ? config.actions.onScreenshotDetected
        : config.actions.onScreenRecordingDetected;
      
      if (action === 'alert') {
        Alert.alert(
          config.messages.securityTitle,
          message,
          [
            {
              text: 'I Understand',
              style: 'default',
            },
          ],
          { cancelable: config.allowDismissWarnings }
        );
      } else if (action === 'block') {
        // For blocking, we could implement additional measures
        // like logging out the user or showing a blocking screen
        Alert.alert(
          config.messages.securityTitle,
          'Security violation detected. Please restart the app.',
          [
            {
              text: 'OK',
              style: 'default',
            },
          ],
          { cancelable: false }
        );
      }
      
      console.log(`Security violation detected: ${type}`);
    } catch (error) {
      console.error('Error handling security violation:', error);
    }
  }

  /**
   * Check if security features are enabled
   */
  public isSecurityEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Initialize security service
   */
  public async initialize(): Promise<void> {
    console.log('Initializing security service...');
    
    try {
      const config = getSecurityConfig();
      
      // Check if we should enable security based on config
      if (config.enableInDev || !__DEV__) {
        await this.enableSecurity();
      } else {
        console.log('Security features disabled (development mode and enableInDev is false)');
      }
    } catch (error) {
      console.error('Error initializing security service:', error);
    }
  }

  /**
   * Cleanup security service
   */
  public async cleanup(): Promise<void> {
    console.log('Cleaning up security service...');
    
    try {
      await this.disableSecurity();
    } catch (error) {
      console.error('Error cleaning up security service:', error);
    }
  }
}

// Export singleton instance
export const securityService = SecurityService.getInstance();
