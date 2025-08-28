import axios from 'axios';
import { getApiUrl } from './config';
import { getUserData } from './storage';

// A store to hold selected order items between screens with API persistence
// This provides temporary storage that persists across app sessions

interface OrderItem {
  id: string;
  itemCode: string;
  description: string;
  uom: string;
  unitPrice: number;
  quantity: number;
  discount: number;
  discountPercentage: number;
  total: number;
}

// Declare global sessionId
declare global {
  var sessionId: string | undefined;
}

const api = axios.create({
  headers: {
    'Content-Type': 'application/json',
  },
});

// Generate a unique session ID for this app instance
const generateSessionId = (): string => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Get or create session ID
const getSessionId = (): string => {
  let sessionId = global.sessionId;
  if (!sessionId) {
    sessionId = generateSessionId();
    global.sessionId = sessionId;
  }
  return sessionId;
};

export const orderItemsStore = {
  async setSelectedItems(items: OrderItem[]): Promise<void> {
    try {
      const userData = await getUserData();
      if (!userData?.token) {
        throw new Error('Authentication token not found. Please log out and log back in.');
      }

      const sessionId = getSessionId();
      await api.post(getApiUrl('/orders/items/temp-store'), {
        sessionId,
        items,
      }, {
        headers: {
          'Authorization': `Bearer ${userData.token}`,
        },
      });
      console.log('Order items stored temporarily:', items.length, 'items');
    } catch (error) {
      console.error('Error storing order items:', error);
      throw new Error('Failed to store order items');
    }
  },
  
  async getSelectedItems(): Promise<OrderItem[] | null> {
    try {
      const userData = await getUserData();
      if (!userData?.token) {
        throw new Error('Authentication token not found. Please log out and log back in.');
      }

      const sessionId = getSessionId();
      const response = await api.get(getApiUrl(`/orders/items/temp-store/${sessionId}`), {
        headers: {
          'Authorization': `Bearer ${userData.token}`,
        },
      });
      return response.data.items || null;
    } catch (error: any) {
      // Handle 404 errors gracefully - it's expected when no items are stored
      if (error.response?.status === 404) {
        console.log('No temporary order items found for session - this is normal for new orders');
        return null;
      }
      console.error('Error getting order items:', error);
      return null;
    }
  },
  
  async clearSelectedItems(): Promise<void> {
    try {
      const userData = await getUserData();
      if (!userData?.token) {
        throw new Error('Authentication token not found. Please log out and log back in.');
      }

      const sessionId = getSessionId();
      await api.delete(getApiUrl(`/orders/items/temp-store/${sessionId}`), {
        headers: {
          'Authorization': `Bearer ${userData.token}`,
        },
      });
      console.log('Order items cleared');
    } catch (error: any) {
      // Handle 404 errors gracefully - it's expected when no items are stored
      if (error.response?.status === 404) {
        console.log('No temporary order items to clear - this is normal');
        return;
      }
      console.error('Error clearing order items:', error);
      throw new Error('Failed to clear order items');
    }
  },

  async validateOrderItems(items: OrderItem[]): Promise<{
    isValid: boolean;
    results: Array<{
      itemCode: string;
      isValid: boolean;
      errors: string[];
    }>;
    summary: {
      totalItems: number;
      validItems: number;
      invalidItems: number;
    };
  }> {
    try {
      const userData = await getUserData();
      if (!userData?.token) {
        throw new Error('Authentication token not found. Please log out and log back in.');
      }

      const response = await api.post(getApiUrl('/orders/items/validate'), items, {
        headers: {
          'Authorization': `Bearer ${userData.token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error validating order items:', error);
      throw new Error('Failed to validate order items');
    }
  },

  async addItem(item: OrderItem): Promise<void> {
    try {
      const currentItems = await this.getSelectedItems() || [];
      const updatedItems = [...currentItems, item];
      await this.setSelectedItems(updatedItems);
    } catch (error) {
      console.error('Error adding item:', error);
      throw new Error('Failed to add item');
    }
  },

  async removeItem(itemId: string): Promise<void> {
    try {
      const currentItems = await this.getSelectedItems() || [];
      const updatedItems = currentItems.filter(item => item.id !== itemId);
      await this.setSelectedItems(updatedItems);
    } catch (error) {
      console.error('Error removing item:', error);
      throw new Error('Failed to remove item');
    }
  },

  async updateItemQuantity(itemId: string, quantity: number): Promise<void> {
    try {
      const currentItems = await this.getSelectedItems() || [];
      const updatedItems = currentItems.map(item => {
        if (item.id === itemId) {
          return {
            ...item,
            quantity,
            total: (item.unitPrice * quantity) - item.discount,
          };
        }
        return item;
      });
      await this.setSelectedItems(updatedItems);
    } catch (error) {
      console.error('Error updating item quantity:', error);
      throw new Error('Failed to update item quantity');
    }
  },

  async getTotalAmount(): Promise<number> {
    try {
      const items = await this.getSelectedItems() || [];
      return items.reduce((total, item) => total + item.total, 0);
    } catch (error) {
      console.error('Error calculating total amount:', error);
      return 0;
    }
  },

  async getItemCount(): Promise<number> {
    try {
      const items = await this.getSelectedItems() || [];
      return items.length;
    } catch (error) {
      console.error('Error getting item count:', error);
      return 0;
    }
  }
}; 