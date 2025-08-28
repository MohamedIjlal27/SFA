import React, { createContext, useContext, useState, ReactNode } from 'react';

interface QuantityContextType {
  quantities: Record<string, number>;
  setQuantity: (productId: string, quantity: number) => void;
  getQuantity: (productId: string) => number;
  clearQuantity: (productId: string) => void;
  clearAll: () => void;
  updateQuantities: (newQuantities: Record<string, number>) => void;
}

const QuantityContext = createContext<QuantityContextType | undefined>(undefined);

export const useQuantityContext = () => {
  const context = useContext(QuantityContext);
  if (!context) {
    throw new Error('useQuantityContext must be used within a QuantityProvider');
  }
  return context;
};

interface QuantityProviderProps {
  children: ReactNode;
}

export const QuantityProvider: React.FC<QuantityProviderProps> = ({ children }) => {
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const setQuantity = (productId: string, quantity: number) => {
    setQuantities(prev => ({
      ...prev,
      [productId]: quantity,
    }));
  };

  const getQuantity = (productId: string) => {
    return quantities[productId] || 0;
  };

  const clearQuantity = (productId: string) => {
    setQuantities(prev => {
      const newQuantities = { ...prev };
      delete newQuantities[productId];
      return newQuantities;
    });
  };

  const clearAll = () => {
    setQuantities({});
  };

  const updateQuantities = (newQuantities: Record<string, number>) => {
    setQuantities(newQuantities);
  };

  const value: QuantityContextType = {
    quantities,
    setQuantity,
    getQuantity,
    clearQuantity,
    clearAll,
    updateQuantities,
  };

  return (
    <QuantityContext.Provider value={value}>
      {children}
    </QuantityContext.Provider>
  );
};
