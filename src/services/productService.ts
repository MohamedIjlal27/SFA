import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { getApiUrl } from './config';
import { getUserData } from './storage';
import NetInfo from '@react-native-community/netinfo';
import { openDatabase } from '../db';

const STORAGE_KEYS = {
  PRODUCTS: '@products',
  PRODUCTS_SYNC_TIME: '@products_sync_time',
  PRODUCT_IMAGES: '@product_images_',
  PRODUCTS_CACHE: '@products_cache_',
  PRODUCTS_METADATA: '@products_metadata',
};

const PAGE_SIZE = 10;

export interface Product {
  itemCode: string;
  description: string;
  category: string;
  subCategory: string;
  categoryCode: string;
  uom: string;
  price: number;
  qty: number;
  imageUrl?: string;
  discountAmount: number;
  discountPercentage: number;
  isSaved?: boolean;
  isSold?: boolean;
  isNewShipment?: boolean;
}

export interface PaginatedProductsResponse {
  products: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ProductsMetadata {
  totalCount: number;
  lastSyncTime: string;
  categories: string[];
  subcategories: string[];
}

export const productService = {
  async getTotalCount(): Promise<number> {
    try {
      // First try to get from cache
      const metadata = await this.getProductsMetadata();
      if (metadata?.totalCount) {
        return metadata.totalCount;
      }

      // If not in cache, fetch from API
      const userData = await getUserData();
      if (!userData?.token) {
        return 0;
      }

      const response = await axios.get<number>(getApiUrl('/ic/items/count'), {
        headers: {
          'Authorization': `Bearer ${userData.token}`,
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error getting total count:', error);
      return 0;
    }
  },

  async getProductsPaginated(
    page: number = 1,
    limit: number = PAGE_SIZE,
    searchQuery: string = '',
    filters: Set<string> = new Set(),
    subcategories: string[] = [],
    category: string = '',
    sortBy: string = 'itemCode',
    sortOrder: 'asc' | 'desc' = 'asc'
  ): Promise<PaginatedProductsResponse> {
    try {
      // Check network status
      const netState = await NetInfo.fetch();
      if (!netState.isConnected) {
        // Try to load from local DB
        try {
          const db = await openDatabase();
          let query = 'SELECT * FROM products';
          const params: any[] = [];
          const where: string[] = [];
          if (searchQuery) {
            where.push('(itemCode LIKE ? OR description LIKE ?)');
            params.push(`%${searchQuery}%`, `%${searchQuery}%`);
          }
          if (category) {
            where.push('category = ?');
            params.push(category);
          }
          if (subcategories.length > 0) {
            where.push(`subCategory IN (${subcategories.map(() => '?').join(',')})`);
            params.push(...subcategories);
          }
          if (where.length > 0) {
            query += ' WHERE ' + where.join(' AND ');
          }
          query += ` ORDER BY ${sortBy} ${sortOrder.toUpperCase()}`;
          query += ' LIMIT ? OFFSET ?';
          params.push(limit, (page - 1) * limit);
          const res = await db.executeSql(query, params);
          const products: Product[] = [];
          for (let i = 0; i < res[0].rows.length; i++) {
            products.push(res[0].rows.item(i));
          }
          // Get total count for pagination
          const countRes = await db.executeSql('SELECT COUNT(*) as total FROM products');
          const total = countRes[0].rows.item(0).total;
          const totalPages = Math.ceil(total / limit);
          return {
            products,
            total,
            page,
            limit,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1,
          };
        } catch (localDbError) {
          throw new Error('Failed to load local products data. Please connect to the internet and try again.');
        }
      }
      const userData = await getUserData();
      if (!userData?.token) {
        throw new Error('Authentication token not found. Please log out and log back in.');
      }

      // Build query parameters
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy,
        sortOrder,
      });

      if (searchQuery) {
        params.append('search', searchQuery);
      }

      // Add category filter
      if (category) {
        params.append('category', category);
      }

      // Add subcategory filter
      if (subcategories.length > 0) {
        params.append('subcategory', subcategories.join(','));
      }

      const response = await axios.get<PaginatedProductsResponse>(
        getApiUrl(`/ic/items/paginated?${params.toString()}`),
        {
          headers: {
            'Authorization': `Bearer ${userData.token}`,
          },
        }
      );

      // Cache the results
      await this.cacheProductsPage(page, limit, searchQuery, filters, subcategories, response.data);

      return response.data;
    } catch (error: any) {
      console.error('Error getting paginated products:', error);
      // Try to load from local DB as fallback on any error (not just offline)
      try {
        const db = await openDatabase();
        let query = 'SELECT * FROM products';
        const params: any[] = [];
        const where: string[] = [];
        if (searchQuery) {
          where.push('(itemCode LIKE ? OR description LIKE ?)');
          params.push(`%${searchQuery}%`, `%${searchQuery}%`);
        }
        if (category) {
          where.push('category = ?');
          params.push(category);
        }
        if (subcategories.length > 0) {
          where.push(`subCategory IN (${subcategories.map(() => '?').join(',')})`);
          params.push(...subcategories);
        }
        if (where.length > 0) {
          query += ' WHERE ' + where.join(' AND ');
        }
        query += ` ORDER BY ${sortBy} ${sortOrder.toUpperCase()}`;
        query += ' LIMIT ? OFFSET ?';
        params.push(limit, (page - 1) * limit);
        const res = await db.executeSql(query, params);
        const products: Product[] = [];
        for (let i = 0; i < res[0].rows.length; i++) {
          products.push(res[0].rows.item(i));
        }
        // Get total count for pagination
        const countRes = await db.executeSql('SELECT COUNT(*) as total FROM products');
        const total = countRes[0].rows.item(0).total;
        const totalPages = Math.ceil(total / limit);
        return {
          products,
          total,
          page,
          limit,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        };
      } catch (localDbError) {
        console.error('Failed to load local products data as fallback:', localDbError);
        // Try to get from cache as last fallback
        const cachedData = await this.getCachedProductsPage(page, limit, searchQuery, filters, subcategories);
        if (cachedData) {
          return cachedData;
        }
        throw error;
      }
    }
  },

  async getProducts(searchQuery: string = '', filters: Set<string> = new Set(), subcategories: string[] = []): Promise<Product[]> {
    try {
      // For backward compatibility, get first page of paginated results
      const response = await this.getProductsPaginated(1, 1000, searchQuery, filters, subcategories);
      return response.products;
    } catch (error) {
      console.error('Error getting products:', error);
      return [];
    }
  },

  async syncProducts(): Promise<boolean> {
    try {
      // Get user data to access the JWT token
      const userData = await getUserData();
      if (!userData?.token) {
        console.warn('No authentication token available. User may need to log out and log back in to get a new token.');
        throw new Error('Authentication token not found. Please log out and log back in.');
      }

      // Get total count first
      const totalCount = await this.getTotalCount();
      
      // Get all products in batches
      const allProducts: Product[] = [];
      const batchSize = 100;
      const totalBatches = Math.ceil(totalCount / batchSize);

      for (let page = 1; page <= totalBatches; page++) {
        const response = await axios.get<PaginatedProductsResponse>(
          getApiUrl(`/ic/items/paginated?page=${page}&limit=${batchSize}`),
          {
            headers: {
              'Authorization': `Bearer ${userData.token}`,
            },
          }
        );
        allProducts.push(...response.data.products);
      }

      console.log(`Successfully synced ${allProducts.length} products`);
      
      // Store all products in cache
      await AsyncStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(allProducts));
      await AsyncStorage.setItem(STORAGE_KEYS.PRODUCTS_SYNC_TIME, new Date().toISOString());

      // Update metadata
      const categories = Array.from(new Set(allProducts.map(p => p.category))).filter(Boolean);
      const subcategories = Array.from(new Set(allProducts.map(p => p.subCategory))).filter(Boolean);
      
      const metadata: ProductsMetadata = {
        totalCount: allProducts.length,
        lastSyncTime: new Date().toISOString(),
        categories,
        subcategories,
      };
      
      await AsyncStorage.setItem(STORAGE_KEYS.PRODUCTS_METADATA, JSON.stringify(metadata));

      return true;
    } catch (error: any) {
      console.error('Error syncing products:', error);
      
      // Provide more specific error messages
      if (error.response?.status === 401) {
        console.error('Authentication failed. Token may be expired.');
        throw new Error('Authentication failed. Please log out and log back in.');
      } else if (error.response?.status === 404) {
        console.error('Products endpoint not found.');
        throw new Error('Products service not available.');
      } else if (error.code === 'NETWORK_ERROR') {
        console.error('Network error occurred.');
        throw new Error('Network error. Please check your connection.');
      } else {
        throw new Error('Failed to sync products. Please try again.');
      }
    }
  },

  async getLastSyncTime(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.PRODUCTS_SYNC_TIME);
    } catch (error) {
      console.error('Error getting last sync time:', error);
      return null;
    }
  },

  async getProductsMetadata(): Promise<ProductsMetadata | null> {
    try {
      const metadata = await AsyncStorage.getItem(STORAGE_KEYS.PRODUCTS_METADATA);
      return metadata ? JSON.parse(metadata) : null;
    } catch (error) {
      console.error('Error getting products metadata:', error);
      return null;
    }
  },

  async cacheProductsPage(
    page: number,
    limit: number,
    searchQuery: string,
    filters: Set<string>,
    subcategories: string[],
    data: PaginatedProductsResponse
  ): Promise<void> {
    try {
      const cacheKey = this.generateCacheKey(page, limit, searchQuery, filters, subcategories);
      await AsyncStorage.setItem(cacheKey, JSON.stringify(data));
    } catch (error) {
      console.error('Error caching products page:', error);
    }
  },

  async getCachedProductsPage(
    page: number,
    limit: number,
    searchQuery: string,
    filters: Set<string>,
    subcategories: string[]
  ): Promise<PaginatedProductsResponse | null> {
    try {
      const cacheKey = this.generateCacheKey(page, limit, searchQuery, filters, subcategories);
      const cached = await AsyncStorage.getItem(cacheKey);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Error getting cached products page:', error);
      return null;
    }
  },

  generateCacheKey(
    page: number,
    limit: number,
    searchQuery: string,
    filters: Set<string>,
    subcategories: string[]
  ): string {
    const filterString = Array.from(filters).sort().join(',');
    const subcategoryString = subcategories.sort().join(',');
    return `${STORAGE_KEYS.PRODUCTS_CACHE}${page}_${limit}_${searchQuery}_${filterString}_${subcategoryString}`;
  },

  async clearCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(STORAGE_KEYS.PRODUCTS_CACHE));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  },

  async getCachedImage(imageUrl: string): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(`${STORAGE_KEYS.PRODUCT_IMAGES}${imageUrl}`);
    } catch (error) {
      console.error('Error getting cached image:', error);
      return null;
    }
  },

  async cacheImage(imageUrl: string, base64Data: string): Promise<void> {
    try {
      await AsyncStorage.setItem(`${STORAGE_KEYS.PRODUCT_IMAGES}${imageUrl}`, base64Data);
    } catch (error) {
      console.error('Error caching image:', error);
    }
  },

  async fetchAndCacheImage(imageUrl: string): Promise<string | null> {
    try {
      const cachedImage = await this.getCachedImage(imageUrl);
      if (cachedImage) {
        return cachedImage;
      }

      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async () => {
          const base64data = reader.result as string;
          await this.cacheImage(imageUrl, base64data);
          resolve(base64data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error fetching and caching image:', error);
      return null;
    }
  },

  async toggleSavedProduct(itemCode: string): Promise<void> {
    try {
      const storedData = await AsyncStorage.getItem(STORAGE_KEYS.PRODUCTS);
      if (storedData) {
        const products = JSON.parse(storedData);
        const updatedProducts = products.map((product: Product) => {
          if (product.itemCode === itemCode) {
            return { ...product, isSaved: !product.isSaved };
          }
          return product;
        });
        await AsyncStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(updatedProducts));
      }
    } catch (error) {
      console.error('Error toggling saved product:', error);
    }
  },

  async getSavedProducts(): Promise<Product[]> {
    try {
      const storedData = await AsyncStorage.getItem(STORAGE_KEYS.PRODUCTS);
      if (storedData) {
        const products = JSON.parse(storedData);
        return products.filter((product: Product) => product.isSaved);
      }
      return [];
    } catch (error) {
      console.error('Error getting saved products:', error);
      return [];
    }
  },

  async getCategories(): Promise<string[]> {
    try {
      const userData = await getUserData();
      if (!userData?.token) {
        throw new Error('Authentication token not found. Please log out and log back in.');
      }
      const response = await axios.get<string[]>(getApiUrl('/ic/categories'), {
        headers: {
          'Authorization': `Bearer ${userData.token}`,
        },
      });
      // Optionally cache categories for offline use
      await AsyncStorage.setItem('@categories', JSON.stringify(response.data));
      return response.data;
    } catch (error) {
      // Try to get from cache as fallback
      const cached = await AsyncStorage.getItem('@categories');
      if (cached) return JSON.parse(cached);
      console.error('Error fetching categories:', error);
      return [];
    }
  },

  // Fallback function to load sample products when sync fails
  async loadSampleProducts(): Promise<Product[]> {
    const sampleProducts: Product[] = [
      {
        itemCode: 'HW001',
        description: 'Steel Nails 3 inch (DIS 10%)',
        category: 'Hardware',
        subCategory: 'Nails',
        categoryCode: 'HW',
        uom: 'KG',
        price: 500.00,
        qty: 100,
        imageUrl: 'https://example.com/images/hw001.jpg',
        discountAmount: 50.00,
        discountPercentage: 10.00,
        isSaved: false,
        isSold: false,
        isNewShipment: false,
      },
      {
        itemCode: 'HW002',
        description: 'Cement Portland 50kg',
        category: 'Building Materials',
        subCategory: 'Cement',
        categoryCode: 'BM',
        uom: 'BAG',
        price: 1200.00,
        qty: 50,
        imageUrl: 'https://example.com/images/hw002.jpg',
        discountAmount: 0.00,
        discountPercentage: 0.00,
        isSaved: false,
        isSold: false,
        isNewShipment: false,
      },
      {
        itemCode: 'LT001',
        description: 'LED Bulb 9W Warm White',
        category: 'Lighting',
        subCategory: 'LED Bulbs',
        categoryCode: 'LT',
        uom: 'PCS',
        price: 250.00,
        qty: 200,
        imageUrl: 'https://example.com/images/lt001.jpg',
        discountAmount: 25.00,
        discountPercentage: 10.00,
        isSaved: false,
        isSold: false,
        isNewShipment: false,
      },
      {
        itemCode: 'EL001',
        description: 'Electrical Wire 2.5mm',
        category: 'Electrical',
        subCategory: 'Wires',
        categoryCode: 'EL',
        uom: 'MTR',
        price: 150.00,
        qty: 500,
        imageUrl: 'https://example.com/images/el001.jpg',
        discountAmount: 0.00,
        discountPercentage: 0.00,
        isSaved: false,
        isSold: false,
        isNewShipment: false,
      },
    ];

    // Store sample products in cache
    await AsyncStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(sampleProducts));
    await AsyncStorage.setItem(STORAGE_KEYS.PRODUCTS_SYNC_TIME, new Date().toISOString());
    
    return sampleProducts;
  }
}; 