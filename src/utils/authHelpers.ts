import { CURRENT_CONFIG } from '../services/config';
import { storeUserAvatar } from '../services/storage';

export const fetchAndStoreAvatar = async (imageUrl: string) => {
  try {
    // If the imageUrl is already a full URL, use it directly
    let fullImageUrl = imageUrl;
    if (!imageUrl.startsWith('http')) {
      // If it's a relative path, construct the full URL
      fullImageUrl = `${CURRENT_CONFIG.BASE_URL}${imageUrl}`;
    }
    
    console.log('Fetching avatar from:', fullImageUrl);
    
    const response = await fetch(fullImageUrl);
    if (!response.ok) {
      // Handle 404 and other client errors gracefully without logging as error
      if (response.status === 404) {
        console.log('Avatar image not found, using default avatar');
        return false;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64data = reader.result as string;
        storeUserAvatar(base64data)
          .then(() => resolve(true))
          .catch(reject);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    // Only log as error if it's not a 404 or network-related issue
    if (error instanceof Error && error.message.includes('404')) {
      console.log('Avatar image not found, using default avatar');
    } else {
      console.warn('Avatar fetch failed:', error);
    }
    return false;
  }
};

export const validateLoginInputs = (companyId: string, userId: string, password: string): string | null => {
  if (!companyId.trim()) {
    return 'Company ID is required';
  }
  if (!userId.trim()) {
    return 'User ID is required';
  }
  if (!password.trim()) {
    return 'Password is required';
  }
  return null;
}; 