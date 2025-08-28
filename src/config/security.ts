export interface SecurityConfig {
  // Enable security features in development mode
  enableInDev: boolean;
  
  // Enable screenshot prevention
  preventScreenshots: boolean;
  
  // Enable screen recording prevention
  preventScreenRecording: boolean;
  
  // Show security warnings to users
  showSecurityWarnings: boolean;
  
  // Allow users to dismiss security warnings
  allowDismissWarnings: boolean;
  
  // Custom security warning messages
  messages: {
    screenshotWarning: string;
    screenRecordingWarning: string;
    securityTitle: string;
  };
  
  // Security violation actions
  actions: {
    onScreenshotDetected: 'alert' | 'block' | 'custom';
    onScreenRecordingDetected: 'alert' | 'block' | 'custom';
  };
}

export const defaultSecurityConfig: SecurityConfig = {
  enableInDev: false,
  preventScreenshots: true,
  preventScreenRecording: true,
  showSecurityWarnings: true,
  allowDismissWarnings: true,
  messages: {
    screenshotWarning: 'Screenshots are not allowed in this app for security reasons.',
    screenRecordingWarning: 'Screen recording is not allowed in this app for security reasons.',
    securityTitle: 'Security Warning',
  },
  actions: {
    onScreenshotDetected: 'alert',
    onScreenRecordingDetected: 'alert',
  },
};

// Production security config (more strict)
export const productionSecurityConfig: SecurityConfig = {
  ...defaultSecurityConfig,
  enableInDev: false,
  allowDismissWarnings: false,
  actions: {
    onScreenshotDetected: 'block',
    onScreenRecordingDetected: 'block',
  },
};

// Development security config (more lenient)
export const developmentSecurityConfig: SecurityConfig = {
  ...defaultSecurityConfig,
  enableInDev: true,
  allowDismissWarnings: true,
  actions: {
    onScreenshotDetected: 'alert',
    onScreenRecordingDetected: 'alert',
  },
};

// Get the appropriate security config based on environment
export const getSecurityConfig = (): SecurityConfig => {
  if (__DEV__) {
    return developmentSecurityConfig;
  }
  return productionSecurityConfig;
};
