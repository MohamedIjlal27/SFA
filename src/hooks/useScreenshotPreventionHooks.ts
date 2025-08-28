import { useEffect } from 'react';
import { Platform } from 'react-native';
import { enableSecureView, disableSecureView, addListener } from '../utils/screenshotWrapper';

/**
 * Hook that prevents screenshots using the library's built-in hooks
 * This is an alternative to the service-based approach
 */
export const useScreenshotPreventionHooks = (enableSecureViewFlag: boolean = !__DEV__) => {
  useEffect(() => {
    let listener: any = null;

    try {
      if (enableSecureViewFlag) {
        // Enable secure view
        enableSecureView();
        
        // Add screenshot detection listener
        listener = addListener(() => {
          console.log('Screenshot detected!');
          // You can add additional logic here, like logging or showing a warning
        });
        
        console.log('Screenshot prevention enabled via hooks');
      }
    } catch (error) {
      console.error('Error setting up screenshot prevention hooks:', error);
    }

    // Cleanup function
    return () => {
      try {
        if (listener && typeof listener.remove === 'function') {
          listener.remove();
        }
        if (enableSecureViewFlag) {
          disableSecureView();
        }
        console.log('Screenshot prevention hooks cleaned up');
      } catch (error) {
        console.error('Error cleaning up screenshot prevention hooks:', error);
      }
    };
  }, [enableSecureViewFlag]);
}; 