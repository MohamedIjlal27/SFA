import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { LoginResponse, DueListResponse, Customer } from './api';
import { getApiUrl } from './config';

const STORAGE_KEYS = {
  USER_DATA: '@user_data',
  USER_AVATAR: '@user_avatar',
  DUE_LIST: '@due_list',
  DUE_LIST_SYNC_TIME: '@due_list_sync_time',
  CUSTOMER_LIST: '@customer_list',
  CUSTOMER_LIST_SYNC_TIME: '@customer_list_sync_time',
  SYNC_SETTINGS: '@sync_settings',
};

const api = axios.create({
  headers: {
    'Content-Type': 'application/json',
  },
});

// Sync settings interface
interface SyncSettings {
  autoSync: boolean;
  syncInterval: number; // in minutes
  lastSyncTime: string;
  syncEnabled: boolean;
}

export const storeUserData = async (userData: LoginResponse): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
    
    // Temporarily disabled sync to prevent 401 errors
    // const syncSettings = await getSyncSettings();
    // if (syncSettings.syncEnabled) {
    //   await syncUserDataToAPI(userData);
    // }
  } catch (error) {
    console.error('Error storing user data:', error);
    throw new Error('Failed to store user data');
  }
};

export const getUserData = async (): Promise<LoginResponse | null> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting user data:', error);
    return null;
  }
};

export const isUserAuthenticated = async (): Promise<boolean> => {
  try {
    const userData = await getUserData();
    return !!userData;
  } catch (error) {
    console.error('Error checking authentication status:', error);
    return false;
  }
};

export const storeUserAvatar = async (base64Image: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.USER_AVATAR, base64Image);
    
    // Also sync to API if sync is enabled
    const syncSettings = await getSyncSettings();
    if (syncSettings.syncEnabled) {
      await syncUserAvatarToAPI(base64Image);
    }
  } catch (error) {
    console.error('Error storing user avatar:', error);
    throw new Error('Failed to store user avatar');
  }
};

export const getUserAvatar = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(STORAGE_KEYS.USER_AVATAR);
  } catch (error) {
    console.error('Error getting user avatar:', error);
    return null;
  }
};

export const clearUserData = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.USER_DATA,
      STORAGE_KEYS.USER_AVATAR,
    ]);
    
    // Remove API call - logout should only clear local state
    // await clearUserDataFromAPI();
  } catch (error) {
    console.error('Error clearing user data:', error);
    throw new Error('Failed to clear user data');
  }
};

export const storeDueList = async (dueList: DueListResponse): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.DUE_LIST, JSON.stringify(dueList));
    await AsyncStorage.setItem(STORAGE_KEYS.DUE_LIST_SYNC_TIME, new Date().toISOString());
    
    // Also sync to API if sync is enabled
    const syncSettings = await getSyncSettings();
    if (syncSettings.syncEnabled) {
      await syncDueListToAPI(dueList);
    }
  } catch (error) {
    console.error('Error storing due list:', error);
    throw new Error('Failed to store due list');
  }
};

export const getDueList = async (): Promise<DueListResponse | null> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.DUE_LIST);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting due list:', error);
    return null;
  }
};

export const getDueListSyncTime = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(STORAGE_KEYS.DUE_LIST_SYNC_TIME);
  } catch (error) {
    console.error('Error getting due list sync time:', error);
    return null;
  }
};

export const clearDueList = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.DUE_LIST,
      STORAGE_KEYS.DUE_LIST_SYNC_TIME,
    ]);
    
    // Also clear from API
    await clearDueListFromAPI();
  } catch (error) {
    console.error('Error clearing due list:', error);
    throw new Error('Failed to clear due list');
  }
};

export const storeCustomerList = async (customers: Customer[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.CUSTOMER_LIST, JSON.stringify(customers));
    await AsyncStorage.setItem(STORAGE_KEYS.CUSTOMER_LIST_SYNC_TIME, new Date().toISOString());
    
    // Also sync to API if sync is enabled
    const syncSettings = await getSyncSettings();
    if (syncSettings.syncEnabled) {
      await syncCustomerListToAPI(customers);
    }
  } catch (error) {
    console.error('Error storing customer list:', error);
    throw new Error('Failed to store customer list');
  }
};

export const getCustomerList = async (): Promise<Customer[] | null> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.CUSTOMER_LIST);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting customer list:', error);
    return null;
  }
};

export const getCustomerListSyncTime = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(STORAGE_KEYS.CUSTOMER_LIST_SYNC_TIME);
  } catch (error) {
    console.error('Error getting customer list sync time:', error);
    return null;
  }
};

export const clearCustomerList = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.CUSTOMER_LIST,
      STORAGE_KEYS.CUSTOMER_LIST_SYNC_TIME,
    ]);
    
    // Remove API call - clearing should only affect local state
    // await clearCustomerListFromAPI();
  } catch (error) {
    console.error('Error clearing customer list:', error);
    throw new Error('Failed to clear customer list');
  }
};

// Sync settings management
export const getSyncSettings = async (): Promise<SyncSettings> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.SYNC_SETTINGS);
    if (data) {
      return JSON.parse(data);
    }
    // Default settings - disable sync to prevent 401 errors
    return {
      autoSync: false,
      syncInterval: 30, // 30 minutes
      lastSyncTime: new Date().toISOString(),
      syncEnabled: false, // Disabled by default
    };
  } catch (error) {
    console.error('Error getting sync settings:', error);
    return {
      autoSync: false,
      syncInterval: 30,
      lastSyncTime: new Date().toISOString(),
      syncEnabled: false, // Disabled by default
    };
  }
};

export const updateSyncSettings = async (settings: Partial<SyncSettings>): Promise<void> => {
  try {
    const currentSettings = await getSyncSettings();
    const updatedSettings = { ...currentSettings, ...settings };
    await AsyncStorage.setItem(STORAGE_KEYS.SYNC_SETTINGS, JSON.stringify(updatedSettings));
  } catch (error) {
    console.error('Error updating sync settings:', error);
    throw new Error('Failed to update sync settings');
  }
};

// API sync functions
const syncUserDataToAPI = async (userData: LoginResponse): Promise<void> => {
  try {
    await api.post(getApiUrl('/user/sync'), { userData });
  } catch (error) {
    console.error('Error syncing user data to API:', error);
  }
};

const syncUserAvatarToAPI = async (avatar: string): Promise<void> => {
  try {
    await api.post(getApiUrl('/user/avatar/sync'), { avatar });
  } catch (error) {
    console.error('Error syncing user avatar to API:', error);
  }
};

const syncDueListToAPI = async (dueList: DueListResponse): Promise<void> => {
  try {
    await api.post(getApiUrl('/due-list/sync'), { dueList });
  } catch (error) {
    console.error('Error syncing due list to API:', error);
  }
};

const syncCustomerListToAPI = async (customers: Customer[]): Promise<void> => {
  try {
    await api.post(getApiUrl('/customer-list/sync'), { customers });
  } catch (error) {
    console.error('Error syncing customer list to API:', error);
  }
};

const clearUserDataFromAPI = async (): Promise<void> => {
  try {
    await api.delete(getApiUrl('/user/sync'));
  } catch (error) {
    console.error('Error clearing user data from API:', error);
  }
};

const clearDueListFromAPI = async (): Promise<void> => {
  try {
    await api.delete(getApiUrl('/due-list/sync'));
  } catch (error) {
    console.error('Error clearing due list from API:', error);
  }
};

const clearCustomerListFromAPI = async (): Promise<void> => {
  try {
    await api.delete(getApiUrl('/customer-list/sync'));
  } catch (error) {
    console.error('Error clearing customer list from API:', error);
  }
};

// Manual sync function
export const performManualSync = async (): Promise<{
  success: boolean;
  syncedItems: string[];
  errors: string[];
}> => {
  const result: {
    success: boolean;
    syncedItems: string[];
    errors: string[];
  } = {
    success: true,
    syncedItems: [],
    errors: [],
  };

  try {
    const syncSettings = await getSyncSettings();
    if (!syncSettings.syncEnabled) {
      result.errors.push('Sync is disabled');
      return result;
    }

    // Sync user data
    const userData = await getUserData();
    if (userData) {
      await syncUserDataToAPI(userData);
      result.syncedItems.push('User data');
    }

    // Sync due list
    const dueList = await getDueList();
    if (dueList) {
      await syncDueListToAPI(dueList);
      result.syncedItems.push('Due list');
    }

    // Sync customer list
    const customerList = await getCustomerList();
    if (customerList) {
      await syncCustomerListToAPI(customerList);
      result.syncedItems.push('Customer list');
    }

    // Update last sync time
    await updateSyncSettings({ lastSyncTime: new Date().toISOString() });

  } catch (error) {
    console.error('Error during manual sync:', error);
    result.success = false;
    result.errors.push('Sync failed');
  }

  return result;
}; 