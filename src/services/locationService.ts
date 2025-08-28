import GetLocation from 'react-native-get-location';
import axios from 'axios';
import { getApiUrl } from './config';

export interface UserLocation {
  latitude: number;
  longitude: number;
  altitude?: number;
  accuracy: number;
  speed?: number;
  time: number;
  bearing?: number;
  provider?: number;
  verticalAccuracy?: number;
  course?: number;
}

export interface LocationConfig {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maxAge?: number;
}

// Check if GetLocation is properly initialized
const isGetLocationAvailable = (): boolean => {
  try {
    return typeof GetLocation !== 'undefined' && 
           typeof GetLocation.getCurrentPosition === 'function';
  } catch (error) {
    console.warn('GetLocation is not properly initialized:', error);
    return false;
  }
};

export const getUserLocation = async (config: LocationConfig = {}): Promise<UserLocation> => {
  const {
    enableHighAccuracy = true,
    timeout = 45000, // Increased to 45 seconds
    maxAge = 300000, // 5 minutes
  } = config;

  try {
    // Check if GetLocation is available
    if (!isGetLocationAvailable()) {
      throw new Error('Location service is not properly initialized. Please restart the app.');
    }

    console.log('Requesting location with config:', {
      enableHighAccuracy,
      timeout,
      maxAge,
    });

    const location = await GetLocation.getCurrentPosition({
      enableHighAccuracy,
      timeout,
    });

    console.log('Location received successfully');

    return {
      latitude: location.latitude,
      longitude: location.longitude,
      altitude: location.altitude,
      accuracy: location.accuracy,
      speed: location.speed,
      time: location.time,
      bearing: location.bearing,
      provider: location.provider,
      verticalAccuracy: location.verticalAccuracy,
      course: location.course,
    };
  } catch (error: any) {
    const { code, message } = error;
    console.warn('Location error:', code, message);
    
    // Throw a more descriptive error
    switch (code) {
      case 'CANCELLED':
        throw new Error('Location access was cancelled by user');
      case 'UNAVAILABLE':
        throw new Error('Location service is disabled or unavailable. Please enable location services in your device settings.');
      case 'TIMEOUT':
        throw new Error('Location request timed out. Please check your GPS signal and try again.');
      case 'UNAUTHORIZED':
        throw new Error('Location permission denied. Please grant location permission in app settings.');
      default:
        if (message?.includes('getCurrentLocation') || message?.includes('undefined')) {
          throw new Error('Location service is not properly initialized. Please restart the app.');
        }
        throw new Error(`Failed to get location: ${message}`);
    }
  }
};

// Fallback method with lower accuracy for better success rate
export const getUserLocationFallback = async (): Promise<UserLocation> => {
  try {
    console.log('Trying fallback location with lower accuracy...');
    
    return await getUserLocation({
      enableHighAccuracy: false, // Use network-based location
      timeout: 30000, // 30 seconds
    });
  } catch (error) {
    console.warn('Fallback location also failed:', error);
    throw error;
  }
};

export const sendUserLocationToBackend = async ({ exeId, latitude, longitude, description = 'Login location', type = 'login' }: {
  exeId: string;
  latitude: number;
  longitude: number;
  description?: string;
  type?: string;
}) => {
  try {
    const payload = {
      userCode: exeId,
      latitude,
      longitude,
      description,
      timestamp: new Date().toISOString(),
      type,
    };
    const fullApiUrl = getApiUrl('/login/location/store');
    console.log('Sending location to:', fullApiUrl);
    const response = await axios.post(fullApiUrl, payload);
    console.log('User location sent to backend:', response.data);
    return response.data;
  } catch (error) {
    console.error('Failed to store user location in backend:', error);
    return null;
  }
};

export const formatLocationForDisplay = (location: UserLocation): string => {
  return `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
};

export const getLocationTimestamp = (location: UserLocation): string => {
  return new Date(location.time).toLocaleString();
}; 