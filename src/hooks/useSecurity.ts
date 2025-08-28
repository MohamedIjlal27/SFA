import { useEffect, useState } from 'react';
import { securityService } from '../services/securityService';

interface UseSecurityOptions {
  enableInDev?: boolean;
  onSecurityViolation?: (type: 'screenshot' | 'screen_recording') => void;
}

export const useSecurity = (options: UseSecurityOptions = {}) => {
  const { enableInDev = false, onSecurityViolation } = options;
  const [isSecurityEnabled, setIsSecurityEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeSecurity = async () => {
      try {
        setIsLoading(true);
        
        // Check if we should enable security
        const shouldEnable = !__DEV__ || enableInDev;
        
        if (shouldEnable) {
          await securityService.enableSecurity();
          setIsSecurityEnabled(true);
        } else {
          console.log('Security features disabled (development mode)');
        }
      } catch (error) {
        console.error('Error initializing security:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeSecurity();

    // Cleanup on unmount
    return () => {
      securityService.cleanup().catch(console.error);
    };
  }, [enableInDev]);

  const enableSecurity = async () => {
    try {
      await securityService.enableSecurity();
      setIsSecurityEnabled(true);
    } catch (error) {
      console.error('Error enabling security:', error);
      throw error;
    }
  };

  const disableSecurity = async () => {
    try {
      await securityService.disableSecurity();
      setIsSecurityEnabled(false);
    } catch (error) {
      console.error('Error disabling security:', error);
      throw error;
    }
  };

  return {
    isSecurityEnabled,
    isLoading,
    enableSecurity,
    disableSecurity,
    securityService,
  };
};
