import axios from 'axios';
import { CURRENT_CONFIG, getApiUrl } from './config';
import { getUserData, clearUserData } from './storage';

export interface LoginResponse {
  leader: string;
  exeId: string;
  areaCode: string;
  exeNameOrig: string;
  exeName: string;
  role: string;
  areaName: string;
  region: string;
  subdivisionCode: string;
  imageLocation: string;
  token: string;
}

export interface LoginError {
  message: string;
}

export interface DueListInvoice {
  documentNo: string;
  docDate: string;
  docAmount: number;
  daysDue: number;
  docType: string;
  dueAmount: number;
  RefNo: string;
}

export interface DueListCustomer {
  customerId: string;
  customerName: string;
  overdue: number;
  invoices: DueListInvoice[];
}

export interface DueListResponse {
  duelist: DueListCustomer[];
}

export interface Customer {
  customerId: string;
  exeId: string;
  customerName: string;
  addr1: string;
  addr2: string;
  addr3: string;
  city: string;
  route: string;
  phone1: string;
  phone2: string;
  phone3: string;
  additional: string;
  isActive: number;
  grade: string;
}

export interface DashboardSummary {
  period: {
    month: string;
    year: string;
    startDate: string;
    endDate: string;
  };
  metrics: {
    sales: {
      value: number;
      percentage: number;
      formattedValue: string;
    };
    collections: {
      value: number;
      percentage: number;
      formattedValue: string;
    };
    returns: {
      value: number;
      percentage: number;
      formattedValue: string;
    };
    replacements: {
      value: number;
      percentage: number;
      formattedValue: string;
    };
  };
  summary: {
    totalTransactions: number;
    totalCustomers: number;
    totalProducts: number;
  };
}

// Add a flag to prevent multiple redirects
let isRedirectingToLogin = false;

// Create axios interceptor to handle 401 errors globally
const api = axios.create({
  baseURL: CURRENT_CONFIG.BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add response interceptor to handle 401 errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !isRedirectingToLogin) {
      isRedirectingToLogin = true;
      console.log('Token expired or invalid, clearing user data...');
      await clearUserData();
      // Reset the flag after a delay
      setTimeout(() => {
        isRedirectingToLogin = false;
      }, 1000);
    }
    return Promise.reject(error);
  }
);

export const loginAPI = async (
  companyId: string,
  exeId: string,
  password: string
): Promise<LoginResponse> => {
  try {
    const response = await api.post(getApiUrl('/login/basic'), {
      companyId,
      exeId,
      password,
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 400) {
      throw new Error(error.response.data.message || 'Login failed');
    }
    throw new Error('Network error occurred');
  }
};

export const getDueList = async (exeId: string): Promise<DueListResponse> => {
  try {
    // Get the stored user data to access the JWT token
    const userData = await getUserData();
    if (!userData?.token) {
      throw new Error('Authentication token not found. Please log out and log back in.');
    }

    const response = await api.get(getApiUrl(`/ar/due/list/${exeId}`), {
      headers: {
        'Authorization': `Bearer ${userData.token}`,
      },
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        throw new Error('Session expired. Please log in again.');
      }
      throw new Error(error.response?.data?.message || 'Failed to fetch due list');
    }
    throw new Error('Network error occurred');
  }
};

export const getCustomerList = async (exeId: string): Promise<Customer[]> => {
  try {
    // Get the stored user data to access the JWT token
    const userData = await getUserData();
    if (!userData?.token) {
      throw new Error('Authentication token not found. Please log out and log back in.');
    }

    const response = await api.get(getApiUrl(`/ar/list/${exeId}`), {
      headers: {
        'Authorization': `Bearer ${userData.token}`,
      },
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        throw new Error('Session expired. Please log in again.');
      }
      throw new Error(error.response?.data?.message || 'Failed to fetch customer list');
    }
    throw new Error('Network error occurred');
  }
};

export const getDashboardSummary = async (
  executiveId?: string,
  month?: string,
  year?: string
): Promise<DashboardSummary> => {
  try {
    // Get the stored user data to access the JWT token
    const userData = await getUserData();
    if (!userData?.token) {
      console.warn('No authentication token available. User may need to log out and log back in to get a new token.');
      throw new Error('Authentication token not found. Please log out and log back in.');
    }

    const params = new URLSearchParams();
    if (executiveId) params.append('executiveId', executiveId);
    if (month) params.append('month', month);
    if (year) params.append('year', year);

    const response = await api.get(`${getApiUrl('/reports/dashboard/summary')}?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${userData.token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    throw new Error('Failed to fetch dashboard summary');
  }
};

export const checkAuthentication = async (): Promise<{ isAuthenticated: boolean; userData: LoginResponse | null }> => {
  try {
    const userData = await getUserData();
    if (!userData?.token) {
      return { isAuthenticated: false, userData: null };
    }
    
    // Optionally, you could make a test API call here to verify the token is still valid
    // For now, we'll just check if the token exists
    return { isAuthenticated: true, userData };
  } catch (error) {
    console.error('Error checking authentication:', error);
    return { isAuthenticated: false, userData: null };
  }
}; 