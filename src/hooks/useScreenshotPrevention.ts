import { useEffect } from 'react';
import { screenshotPreventionService } from '../services/screenshotPrevention';

interface UseScreenshotPreventionOptions {
  enabled?: boolean;
  onScreenshotDetected?: () => void;
}

/**
 * Custom hook for managing screenshot prevention in screens
 * @param options Configuration options
 */
export const useScreenshotPrevention = (options: UseScreenshotPreventionOptions = {}) => {
  const { enabled = true, onScreenshotDetected } = options;

  useEffect(() => {
    if (enabled) {
      // Enable screenshot prevention for this screen
      screenshotPreventionService.enableScreenshotPrevention();
      
      // Setup custom screenshot detection if provided
      if (onScreenshotDetected) {
        const originalHandler = screenshotPreventionService['handleScreenshotDetected'];
        screenshotPreventionService['handleScreenshotDetected'] = onScreenshotDetected;
        
        return () => {
          // Restore original handler when component unmounts
          screenshotPreventionService['handleScreenshotDetected'] = originalHandler;
        };
      }
    } else {
      // Disable screenshot prevention for this screen
      screenshotPreventionService.disableScreenshotPrevention();
    }
  }, [enabled, onScreenshotDetected]);

  return {
    enableScreenshotPrevention: () => screenshotPreventionService.enableScreenshotPrevention(),
    disableScreenshotPrevention: () => screenshotPreventionService.disableScreenshotPrevention(),
  };
}; 