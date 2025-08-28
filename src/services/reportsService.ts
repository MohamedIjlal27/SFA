import axios from 'axios';
import { getApiUrl } from './config';
import { getUserData } from './storage';

// Types for reports data
export type SalesData = {
  id: string;
  date: string;
  customerId: string;
  customerName: string;
  city: string;
  province: string;
  productId: string;
  productName: string;
  category: string;
  subCategory: string;
  quantity: number;
  unitPrice: number;
  totalSales: number;
  discount: number;
  netSales: number;
};

export type Customer = {
  id: string;
  name: string;
  city: string;
  province: string;
  contactPerson: string;
  phone: string;
  email: string;
  totalPurchases: number;
  lastPurchaseDate: string;
  customerSince: string;
  creditLimit: number;
  outstandingBalance: number;
};

export type CategorySales = {
  category: string;
  totalSales: number;
  percentageOfTotal: number;
  growth: number; // percentage growth compared to previous period
};

export type ProductSales = {
  productId: string;
  productName: string;
  category: string;
  subCategory: string;
  quantity: number;
  totalSales: number;
  percentageOfTotal: number;
  growth: number; // percentage growth compared to previous period
};

export type CustomerSales = {
  customerId: string;
  customerName: string;
  city: string;
  province: string;
  totalSales: number;
  percentageOfTotal: number;
  growth: number; // percentage growth compared to previous period
  categories: {
    [category: string]: number; // sales by category
  };
  totalPurchases?: number; // Make this optional
};

export type CityWiseSales = {
  city: string;
  province: string;
  totalSales: number;
  percentageOfTotal: number;
  topProducts: Array<{
    productId: string;
    productName: string;
    sales: number;
  }>;
  topCategories: Array<{
    category: string;
    sales: number;
  }>;
};

export type ProductCustomerSales = {
  customerId: string;
  customerName: string;
  city: string;
  quantity: number;
  totalSales: number;
  percentageOfProductSales: number;
};

export type CategoryCustomerSales = {
  customerId: string;
  customerName: string;
  city: string;
  totalSales: number;
  percentageOfCategorySales: number;
};

export type RangeCoverageInsight = {
  category: string;
  coverage: number; // percentage of products in category that have been sold
  potentialIncrease: number; // potential sales increase if coverage was 100%
  recommendation: string;
  totalProducts?: number; // total number of products in category
  soldProducts?: number; // number of products sold in category
  categorySales?: number; // total sales for the category
};

class ReportsService {
  async getSalesReport(startDate?: string, endDate?: string): Promise<SalesData[]> {
    try {
      const userData = await getUserData();
      if (!userData?.token) {
        throw new Error('Authentication token not found. Please log out and log back in.');
      }

      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const response = await axios.get(getApiUrl(`/reports/sales?${params.toString()}`), {
        headers: {
          'Authorization': `Bearer ${userData.token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching sales report:', error);
      throw new Error('Failed to fetch sales report');
    }
  }

  async getTopCustomers(limit: number = 20): Promise<CustomerSales[]> {
    try {
      const userData = await getUserData();
      if (!userData?.token) {
        throw new Error('Authentication token not found. Please log out and log back in.');
      }

      const response = await axios.get(getApiUrl(`/reports/top-customers?limit=${limit}`), {
        headers: {
          'Authorization': `Bearer ${userData.token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching top customers:', error);
      throw new Error('Failed to fetch top customers');
    }
  }

  async getTopProducts(limit: number = 20): Promise<ProductSales[]> {
    try {
      const userData = await getUserData();
      if (!userData?.token) {
        throw new Error('Authentication token not found. Please log out and log back in.');
      }

      const response = await axios.get(getApiUrl(`/reports/top-products?limit=${limit}`), {
        headers: {
          'Authorization': `Bearer ${userData.token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching top products:', error);
      throw new Error('Failed to fetch top products');
    }
  }

  async getTopCustomersForProduct(productId: string, limit: number = 10): Promise<ProductCustomerSales[]> {
    try {
      const userData = await getUserData();
      if (!userData?.token) {
        throw new Error('Authentication token not found. Please log out and log back in.');
      }

      const response = await axios.get(getApiUrl(`/reports/product/${productId}/customers?limit=${limit}`), {
        headers: {
          'Authorization': `Bearer ${userData.token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching customer sales for product:', error);
      throw new Error('Failed to fetch customer sales for product');
    }
  }

  async getTopCustomersForCategory(category: string, limit: number = 10): Promise<CategoryCustomerSales[]> {
    try {
      const userData = await getUserData();
      if (!userData?.token) {
        throw new Error('Authentication token not found. Please log out and log back in.');
      }

      const response = await axios.get(getApiUrl(`/reports/category/${encodeURIComponent(category)}/customers?limit=${limit}`), {
        headers: {
          'Authorization': `Bearer ${userData.token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching customer sales for category:', error);
      throw new Error('Failed to fetch customer sales for category');
    }
  }

  async getCityWiseSales(limit: number = 10): Promise<CityWiseSales[]> {
    try {
      const userData = await getUserData();
      if (!userData?.token) {
        throw new Error('Authentication token not found. Please log out and log back in.');
      }

      const response = await axios.get(getApiUrl(`/reports/city-sales?limit=${limit}`), {
        headers: {
          'Authorization': `Bearer ${userData.token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching city-wise sales:', error);
      throw new Error('Failed to fetch city-wise sales');
    }
  }

  async getCategorySales(): Promise<CategorySales[]> {
    try {
      const userData = await getUserData();
      if (!userData?.token) {
        throw new Error('Authentication token not found. Please log out and log back in.');
      }

      const response = await axios.get(getApiUrl('/reports/category-sales'), {
        headers: {
          'Authorization': `Bearer ${userData.token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching category sales:', error);
      throw new Error('Failed to fetch category sales');
    }
  }

  async getRangeCoverageInsights(): Promise<RangeCoverageInsight[]> {
    try {
      const userData = await getUserData();
      if (!userData?.token) {
        throw new Error('Authentication token not found. Please log out and log back in.');
      }

      const response = await axios.get(getApiUrl('/reports/range-coverage-insights'), {
        headers: {
          'Authorization': `Bearer ${userData.token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching range coverage insights:', error);
      throw new Error('Failed to fetch range coverage insights');
    }
  }

  async getCustomerDetails(): Promise<Customer[]> {
    try {
      const userData = await getUserData();
      if (!userData?.token) {
        throw new Error('Authentication token not found. Please log out and log back in.');
      }

      const response = await axios.get(getApiUrl('/reports/customers/details'), {
        headers: {
          'Authorization': `Bearer ${userData.token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching customer details:', error);
      throw new Error('Failed to fetch customer details');
    }
  }

  async getProductCoverage(): Promise<any> {
    try {
      const userData = await getUserData();
      if (!userData?.token) {
        throw new Error('Authentication token not found. Please log out and log back in.');
      }

      const response = await axios.get(getApiUrl('/reports/products/coverage'), {
        headers: {
          'Authorization': `Bearer ${userData.token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching product coverage:', error);
      throw new Error('Failed to fetch product coverage');
    }
  }
}

export const reportsService = new ReportsService(); 