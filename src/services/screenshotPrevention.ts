import { enabled, enableSecureView, disableSecureView, addListener } from '../utils/screenshotWrapper';
import { Alert, Platform } from 'react-native';

// Re-export the functions for direct import
export { enabled, enableSecureView, disableSecureView, addListener };

export class ScreenshotPreventionService {
  private static instance: ScreenshotPreventionService;
  private screenshotListener: any = null;

  private constructor() {}

  public static getInstance(): ScreenshotPreventionService {
    if (!ScreenshotPreventionService.instance) {
      ScreenshotPreventionService.instance = new ScreenshotPreventionService();
    }
    return ScreenshotPreventionService.instance;
  }

  /**
   * Enable screenshot prevention across the app
   */
  public enableScreenshotPrevention(): void {
    try {
      console.log('Enabling screenshot prevention...');
      
      // Enable basic screenshot prevention (works on both iOS and Android)
      enabled(true);
      
      // Enable secure view for iOS 13+ (prevents UI capture in screenshots)
      if (!__DEV__ && Platform.OS === 'ios') {
        enableSecureView();
        console.log('Secure view enabled for iOS 13+');
      } else {
        console.log('Secure view disabled (development mode or not iOS)');
      }
      
      console.log('Screenshot prevention enabled successfully');
    } catch (error) {
      console.error('Error enabling screenshot prevention:', error);
    }
  }

  /**
   * Disable screenshot prevention
   */
  public disableScreenshotPrevention(): void {
    try {
      console.log('Disabling screenshot prevention...');
      
      enabled(false);
      
      if (!__DEV__ && Platform.OS === 'ios') {
        disableSecureView();
        console.log('Secure view disabled');
      }
      
      console.log('Screenshot prevention disabled successfully');
    } catch (error) {
      console.error('Error disabling screenshot prevention:', error);
    }
  }

  /**
   * Setup screenshot detection listener with proper error handling
   */
  public setupScreenshotListener(): void {
    try {
      console.log('Setting up screenshot detection listener...');
      
      // Check if addListener is available and is a function
      if (typeof addListener === 'function') {
        this.screenshotListener = addListener(() => {
          console.log('Screenshot detected!');
          this.handleScreenshotDetected();
        });
        
        console.log('Screenshot detection listener setup successfully');
      } else {
        console.warn('Screenshot detection listener not available');
      }
    } catch (error) {
      console.error('Error setting up screenshot listener:', error);
    }
  }

  /**
   * Remove screenshot detection listener with proper cleanup
   */
  public removeScreenshotListener(): void {
    try {
      if (this.screenshotListener && typeof this.screenshotListener.remove === 'function') {
        this.screenshotListener.remove();
        this.screenshotListener = null;
        console.log('Screenshot detection listener removed');
      } else if (this.screenshotListener) {
        console.warn('Screenshot listener exists but remove method not available');
        this.screenshotListener = null;
      }
    } catch (error) {
      console.error('Error removing screenshot listener:', error);
    }
  }

  /**
   * Handle screenshot detection
   */
  private handleScreenshotDetected(): void {
    try {
      Alert.alert(
        'Security Warning',
        'Screenshots are not allowed in this app for security reasons. Please refrain from taking screenshots.',
        [
          {
            text: 'I Understand',
            style: 'default',
          },
        ],
        { cancelable: false }
      );
    } catch (error) {
      console.error('Error showing screenshot warning alert:', error);
    }
  }

  /**
   * Initialize screenshot prevention service
   */
  public initialize(): void {
    console.log('Initializing screenshot prevention service...');
    
    try {
      // Enable screenshot prevention
      this.enableScreenshotPrevention();
      
      // Setup screenshot detection (only if supported)
      this.setupScreenshotListener();
      
      console.log('Screenshot prevention service initialized');
    } catch (error) {
      console.error('Error initializing screenshot prevention service:', error);
    }
  }

  /**
   * Cleanup screenshot prevention service
   */
  public cleanup(): void {
    console.log('Cleaning up screenshot prevention service...');
    
    try {
      // Remove screenshot listener
      this.removeScreenshotListener();
      
      // Disable screenshot prevention
      this.disableScreenshotPrevention();
      
      console.log('Screenshot prevention service cleaned up');
    } catch (error) {
      console.error('Error cleaning up screenshot prevention service:', error);
    }
  }
}

// Export singleton instance
export const screenshotPreventionService = ScreenshotPreventionService.getInstance(); 