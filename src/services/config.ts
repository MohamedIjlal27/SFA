// API Configuration
export const API_CONFIG = {
  // Development - Local NestJS API
  DEVELOPMENT: {
    BASE_URL: 'https://sfa-back-end.vercel.app',
    API_PREFIX: 'api',
  },
  // Production - Deployed Vercel API
  PRODUCTION: {
    BASE_URL: 'https://sfa-back-end.vercel.app',
    API_PREFIX: 'api',
  },
};

// Get the current environment
const isDevelopment = __DEV__;

// Export the current configuration
export const CURRENT_CONFIG = API_CONFIG.PRODUCTION;

// Helper function to get full API URL
export const getApiUrl = (endpoint: string): string => {
  return `${CURRENT_CONFIG.BASE_URL}/${CURRENT_CONFIG.API_PREFIX}${endpoint}`;
};

// Log current configuration
console.log(`🔧 API Configuration: ${isDevelopment ? 'DEVELOPMENT' : 'PRODUCTION'}`);
console.log(`🌐 Base URL: ${CURRENT_CONFIG.BASE_URL}`); 