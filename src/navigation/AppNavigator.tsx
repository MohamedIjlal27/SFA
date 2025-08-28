import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator, AppState, AppStateStatus } from 'react-native';
import PermissionRequestScreen from '../screens/auth/screens/PermissionRequestScreen';
import LoginScreen from '../screens/auth/screens/LoginScreen';
import DashboardTabNavigator from './DashboardTabNavigator';
import JourneyScreen from '../screens/journey/JourneyScreen';
import CustomerDetailScreen from '../screens/customer/CustomerDetailScreen';
import MultiCustomerDueListScreen from '../screens/dueList/MultiCustomerDueListScreen';
import CreateOrderScreen from '../screens/customer/CreateOrderScreen';
import AddItemsScreen from '../screens/customer/AddItemsScreen';
import ProductDetailsScreen from '../screens/product/ProductDetailsScreen';
import OrderDetailScreen from '../screens/orders/OrderDetailScreen';
import { CustomerDetails } from '../data/mockCustomerDetails';
import { getUserData, getFirstTimeFlag, setFirstTimeFlag } from '../services/storage';
import { QuantityProvider } from '../context/QuantityContext';

export type RootStackParamList = {
  PermissionRequest: undefined;
  Login: undefined;
  Dashboard: undefined;
  Journey: undefined;
  CustomerDetail: {
    customerId: string;
    customerDetails?: CustomerDetails;
  };
  MultiCustomerDueList: undefined;
  CreateOrder: {
    customerId: string;
    customerName: string;
    selectedItems?: Array<{
      id: string;
      itemCode: string;
      description: string;
      uom: string;
      unitPrice: number;
      quantity: number;
      discount: number;
      discountPercentage: number;
      total: number;
    }>;
  };
  AddItems: {
    orderId: string;
    customerName: string;
  };
  ProductDetails: {
    productId: string;
    product?: any; // Pass the product data directly to avoid loading again
  };
  OrderDetail: {
    orderId: string;
  };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isFirstTime, setIsFirstTime] = useState(false);

  useEffect(() => {
    checkAuthState();
    
    // Listen for app state changes to refresh auth state when app comes back from background
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription?.remove();
    };
  }, []);

  const checkAuthState = async () => {
    try {
      // Check if this is the first time opening the app
      const firstTimeFlag = await getFirstTimeFlag();
      setIsFirstTime(!firstTimeFlag);

      const userData = await getUserData();
      const authenticated = !!userData;
      console.log('Auth state check:', authenticated ? 'User is authenticated' : 'User is not authenticated');
      setIsAuthenticated(authenticated);
    } catch (error) {
      console.error('Error checking auth state:', error);
      setIsAuthenticated(false);
      setIsFirstTime(true); // Default to first time if error
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (nextAppState === 'active') {
      // App has come to the foreground, refresh auth state
      console.log('App came to foreground, refreshing auth state...');
      checkAuthState();
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F7FA' }}>
        <ActivityIndicator size="large" color="#4A90E2" />
      </View>
    );
  }

  return (
    <QuantityProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName={
            isAuthenticated 
              ? "Dashboard" 
              : isFirstTime 
                ? "PermissionRequest" 
                : "Login"
          }
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: 'transparent' },
          }}
        >
          <Stack.Screen name="PermissionRequest" component={PermissionRequestScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Dashboard" component={DashboardTabNavigator} />
          <Stack.Screen name="Journey" component={JourneyScreen} />
          <Stack.Screen name="CustomerDetail" component={CustomerDetailScreen} />
          <Stack.Screen name="MultiCustomerDueList" component={MultiCustomerDueListScreen} />
          <Stack.Screen name="CreateOrder" component={CreateOrderScreen} />
          <Stack.Screen name="AddItems" component={AddItemsScreen} />
          <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} />
          <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </QuantityProvider>
  );
};

export default AppNavigator; 