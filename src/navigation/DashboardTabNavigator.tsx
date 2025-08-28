import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { useTheme, IconButton } from 'react-native-paper';
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import ReportsScreen from '../screens/reports/ReportsScreen';
import MyOrdersScreen from '../screens/orders/MyOrdersScreen';
import ProductsScreen from '../screens/products/ProductsScreen';

export type DashboardTabParamList = {
  DashboardTab: undefined;
  ProductsTab: undefined;
  MyOrdersTab: undefined;
  ReportsTab: undefined;
};

const Tab = createBottomTabNavigator<DashboardTabParamList>();

const DashboardTabNavigator = () => {
  const theme = useTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          borderTopWidth: 0,
          height: 88,
          paddingBottom: 18,
          paddingTop: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.12,
          shadowRadius: 16,
          elevation: 16,
        },
        tabBarActiveTintColor: '#1976D2',
        tabBarInactiveTintColor: '#666666',
        tabBarLabelStyle: {
          fontWeight: '600',
          fontSize: 12,
          marginBottom: 4,
          marginTop: 2,
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = 'circle';
          if (route.name === 'DashboardTab') iconName = 'view-dashboard';
          else if (route.name === 'ProductsTab') iconName = 'cube';
          else if (route.name === 'MyOrdersTab') iconName = 'clipboard-list';
          else if (route.name === 'ReportsTab') iconName = 'chart-bar';
          return (
            <IconButton
              icon={iconName}
              size={focused ? 28 : 24}
              iconColor={color}
              style={{ 
                margin: 0,
                opacity: focused ? 1 : 0.7
              }}
            />
          );
        },
      })}
    >
      <Tab.Screen
        name="DashboardTab"
        component={DashboardScreen}
        options={{ tabBarLabel: 'Dashboard' }}
      />
      <Tab.Screen
        name="ProductsTab"
        component={ProductsScreen}
        options={{ tabBarLabel: 'Products' }}
      />
      <Tab.Screen
        name="MyOrdersTab"
        component={MyOrdersScreen}
        options={{ tabBarLabel: 'My Orders' }}
      />
      <Tab.Screen
        name="ReportsTab"
        component={ReportsScreen}
        options={{ tabBarLabel: 'Reports' }}
      />
    </Tab.Navigator>
  );
};

export default DashboardTabNavigator; 