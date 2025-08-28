import { UserLocation } from '../services/locationService';

export const logLocationInfo = (location: UserLocation, context: string = 'Location') => {
  console.log(`=== ${context} Information ===`);
  console.log(`Coordinates: ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`);
  console.log(`Accuracy: ${location.accuracy} meters`);
  console.log(`Timestamp: ${new Date(location.time).toLocaleString()}`);
  
  if (location.altitude) {
    console.log(`Altitude: ${location.altitude} meters`);
  }
  
  if (location.speed) {
    console.log(`Speed: ${location.speed} m/s`);
  }
  
  if (location.bearing) {
    console.log(`Bearing: ${location.bearing}°`);
  }
  
  if (location.provider) {
    console.log(`Provider: ${location.provider}`);
  }
  
  if (location.verticalAccuracy) {
    console.log(`Vertical Accuracy: ${location.verticalAccuracy} meters`);
  }
  
  if (location.course) {
    console.log(`Course: ${location.course}°`);
  }
  
  console.log('========================');
};

export const getLocationSummary = (location: UserLocation): string => {
  return `Location: ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)} (Accuracy: ${location.accuracy}m)`;
};

export const isLocationAccurate = (location: UserLocation, maxAccuracy: number = 100): boolean => {
  return location.accuracy <= maxAccuracy;
}; 