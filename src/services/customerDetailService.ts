import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { CURRENT_CONFIG, getApiUrl } from './config';
import { getUserData } from './storage';

export interface CustomerDetailsResponse {
  result: {
    customerId: string;
    executiveId: string;
    customerName: string;
    telephone1: string;
    telephone2: string;
    contactName: string;
    contactPhone: string;
    startDate: string;
    creditLimit: number;
    creditPeriod: number;
    comments: string;
    lastInvoiceDate: string;
    lastInvoiceAmt: number;
    lastPaymentDate: string;
    lastPaymentAmt: number;
    isInactive: boolean;
    isHold: boolean;
    followupStatus: string | null;
    address: null;
    address1: string;
    address2: string;
    address3: string;
    city: string;
    location: string; // Format: "latitude,longitude"
  };
  balanceDue: number;
  ageing: {
    "0-30": number;
    "31-60": number;
    "61-90": number;
    "91-120": number;
    ">120": number;
  };
  overdueInvoices: Array<{
    documentNo: string;
    docDate: string;
    docAmount: number;
    daysDue: number | null;
    docType: string;
    dueAmount: number;
    exeId: string;
    "Ref No": string;
  }>;
}

export interface Document {
  id: string;
  customerId: string;
  uploadedBy: string;
  fileName: string;
  originalName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentResponse {
  documents: Document[];
}

const STORAGE_KEY_PREFIX = '@customer_details_';
const LAST_SYNC_KEY = '@customer_details_last_sync';

const api = axios.create({
  baseURL: CURRENT_CONFIG.BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds timeout
});

export const customerDetailService = {
  async getCustomerDetails(customerId: string): Promise<CustomerDetailsResponse | null> {
    try {
      // Try to get from local storage first
      const storedData = await AsyncStorage.getItem(`${STORAGE_KEY_PREFIX}${customerId}`);
      if (storedData) {
        return JSON.parse(storedData);
      }
      return null;
    } catch (error) {
      console.error('Error getting customer details from storage:', error);
      return null;
    }
  },

  async syncCustomerDetails(customerId: string): Promise<CustomerDetailsResponse | null> {
    try {
      // Get the stored user data to access the JWT token
      const userData = await getUserData();
      if (!userData?.token) {
        throw new Error('Authentication token not found. Please log out and log back in.');
      }

      // Fetch customer details from API using the correct endpoint
      const response = await api.get(getApiUrl(`/ar/info/${customerId}`), {
        headers: {
          'Authorization': `Bearer ${userData.token}`,
        },
      });
      const customerData = response.data;
      
      // The API now returns the complete data structure including overdueInvoices
      // No need to make a separate call for invoices
      
      // Store in local storage
      await AsyncStorage.setItem(
        `${STORAGE_KEY_PREFIX}${customerId}`,
        JSON.stringify(customerData)
      );
      
      // Update last sync time
      await AsyncStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
      
      return customerData;
    } catch (error) {
      console.error('Error syncing customer details:', error);
      
      // Check if it's a 401 error
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        throw new Error('Session expired. Please log in again.');
      }
      
      // If API call fails, try to get from local storage as fallback
      const storedData = await AsyncStorage.getItem(`${STORAGE_KEY_PREFIX}${customerId}`);
      if (storedData) {
        return JSON.parse(storedData);
      }
      
      return null;
    }
  },

  async getLastSyncTime(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(LAST_SYNC_KEY);
    } catch (error) {
      console.error('Error getting last sync time:', error);
      return null;
    }
  },

  async clearLocalData(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const customerKeys = keys.filter(key => key.startsWith(STORAGE_KEY_PREFIX));
      await AsyncStorage.multiRemove(customerKeys);
      await AsyncStorage.removeItem(LAST_SYNC_KEY);
    } catch (error) {
      console.error('Error clearing local data:', error);
    }
  },

  // Document-related methods
  async getCustomerDocuments(customerId: string): Promise<DocumentResponse> {
    try {
      const userData = await getUserData();
      if (!userData?.token) {
        throw new Error('Authentication token not found. Please log out and log back in.');
      }

      const response = await api.get(getApiUrl(`/ar/documents/${customerId}`), {
        headers: {
          'Authorization': `Bearer ${userData.token}`,
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error getting customer documents:', error);
      
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        throw new Error('Session expired. Please log in again.');
      }
      
      throw error;
    }
  },

  async uploadDocument(formData: FormData): Promise<Document[]> {
    try {
      const userData = await getUserData();
      if (!userData?.token) {
        throw new Error('Authentication token not found. Please log out and log back in.');
      }

      console.log('🚀 Uploading document to:', getApiUrl('/ar/documents/upload'));
      console.log('🔑 Token available:', !!userData.token);

      const response = await api.post(getApiUrl('/ar/documents/upload'), formData, {
        headers: {
          'Authorization': `Bearer ${userData.token}`,
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // 60 seconds for file uploads
      });

      console.log('✅ Upload successful:', response.status);
      return response.data;
    } catch (error) {
      console.error('❌ Error uploading document:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
        method: error.config?.method,
      });
      
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        throw new Error('Session expired. Please log in again.');
      }
      
      throw error;
    }
  },

  async deleteDocument(documentId: string): Promise<{ message: string }> {
    try {
      const userData = await getUserData();
      if (!userData?.token) {
        throw new Error('Authentication token not found. Please log out and log back in.');
      }

      const response = await api.delete(getApiUrl(`/ar/documents/${documentId}`), {
        headers: {
          'Authorization': `Bearer ${userData.token}`,
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error deleting document:', error);
      
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        throw new Error('Session expired. Please log in again.');
      }
      
      throw error;
    }
  }
}; 