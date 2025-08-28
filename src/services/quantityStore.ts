import { create } from 'zustand';

interface QuantityState {
  quantities: Record<string, number>;
  setQuantity: (productId: string, quantity: number) => void;
  getQuantity: (productId: string) => number;
  clearQuantity: (productId: string) => void;
  clearAll: () => void;
  updateQuantities: (newQuantities: Record<string, number>) => void;
}

export const useQuantityStore = create<QuantityState>((set, get) => ({
  quantities: {},
  
  setQuantity: (productId: string, quantity: number) => {
    set((state) => ({
      quantities: {
        ...state.quantities,
        [productId]: quantity,
      },
    }));
  },
  
  getQuantity: (productId: string) => {
    return get().quantities[productId] || 0;
  },
  
  clearQuantity: (productId: string) => {
    set((state) => {
      const newQuantities = { ...state.quantities };
      delete newQuantities[productId];
      return { quantities: newQuantities };
    });
  },
  
  clearAll: () => {
    set({ quantities: {} });
  },
  
  updateQuantities: (newQuantities: Record<string, number>) => {
    set({ quantities: newQuantities });
  },
}));
