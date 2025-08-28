import axios from 'axios';
import { getUserLocation } from './locationService';

const API_KEY = 'z6Kuzb1UbLkjYar3jlVD6NOAP0FTGdkCGg0jnQdtwAGdRbeO3Tvip4yWEvjkv14e';
const BASE_URL = 'https://api.distancematrix.ai/maps/api/distancematrix/json';

interface DistanceMatrixResponse {
  destination_addresses: string[];
  origin_addresses: string[];
  rows: {
    elements: {
      distance: {
        text: string;
        value: number;
      };
      duration: {
        text: string;
        value: number;
      };
      origin: string;
      destination: string;
      status: string;
    }[];
  }[];
  status: string;
}

export const directionService = {
  /**
   * Get distance between current location and customer location
   * @param customerLocation - Customer location in format "lat,lng"
   * @returns Distance text (e.g. "241 m") or null if error
   */
  async getDistance(customerLocation: string): Promise<string | null> {
    try {
      // Parse customer location
      const [customerLat, customerLng] = customerLocation.split(',').map(coord => coord.trim());
      
      if (!customerLat || !customerLng) {
        console.error('Invalid customer location format:', customerLocation);
        return null;
      }

      // Get current location
      const currentLocation = await getUserLocation();
      
      if (!currentLocation) {
        console.error('Failed to get current location');
        return null;
      }

      const currentLat = currentLocation.latitude;
      const currentLng = currentLocation.longitude;
      
      // Build URL
      const url = `${BASE_URL}?origins=${currentLat},${currentLng}&destinations=${customerLat},${customerLng}&key=${API_KEY}`;
      
      // Make request
      const response = await axios.get<DistanceMatrixResponse>(url);
      
      // Check response
      if (response.data.status !== 'OK' || 
          !response.data.rows[0]?.elements[0]?.distance?.text) {
        console.error('Invalid distance matrix response:', response.data);
        return null;
      }
      
      // Return distance text
      return response.data.rows[0].elements[0].distance.text;
    } catch (error) {
      console.error('Error getting distance:', error);
      return null;
    }
  }
}; 