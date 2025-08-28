import React, { useState, useEffect } from 'react';
import {
  View,
  FlatList,
  RefreshControl,
  useWindowDimensions,
  Alert
} from 'react-native';
import { Appbar, Card, Text, Chip, ActivityIndicator, Button, useTheme, Badge } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { getUserData } from '../services/storage';
import { formatDate, formatCurrency } from '../utils/formatters';
import { createMyOrdersStyles } from '../utils/styles/MyOrders.styles';

export type OrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled';
export interface Order {
  id: string;
  orderNo: string;
  customerId: string;
  customerName: string;
  orderDate: string;
  deliveryDate: string | null;
  totalAmount: number;
  status: OrderStatus;
  itemCount: number;
}

const mockOrders: Order[] = [
  { id: '1', orderNo: 'ORD-001', customerId: 'CUST001', customerName: 'ABC Corporation', orderDate: '2023-06-15', deliveryDate: '2023-06-20', totalAmount: 1250.75, status: 'completed', itemCount: 5 },
  { id: '2', orderNo: 'ORD-002', customerId: 'CUST002', customerName: 'XYZ Enterprises', orderDate: '2023-06-18', deliveryDate: null, totalAmount: 875.50, status: 'processing', itemCount: 3 },
  { id: '3', orderNo: 'ORD-003', customerId: 'CUST003', customerName: 'Global Trading Co.', orderDate: '2023-06-20', deliveryDate: null, totalAmount: 2340.00, status: 'pending', itemCount: 8 },
  { id: '4', orderNo: 'ORD-004', customerId: 'CUST001', customerName: 'ABC Corporation', orderDate: '2023-06-10', deliveryDate: '2023-06-15', totalAmount: 560.25, status: 'completed', itemCount: 2 },
  { id: '5', orderNo: 'ORD-005', customerId: 'CUST004', customerName: 'Tech Solutions Inc.', orderDate: '2023-06-22', deliveryDate: null, totalAmount: 1875.30, status: 'cancelled', itemCount: 6 }
];

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const statusColors: Record<OrderStatus, string> = {
  pending: '#F59E0B',
  processing: '#3B82F6',
  completed: '#10B981',
  cancelled: '#EF4444',
};

const MyOrders: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const dimensions = useWindowDimensions();
  const styles = createMyOrdersStyles(dimensions);
  const theme = useTheme();

  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<OrderStatus | 'all'>('all');

  useEffect(() => { loadOrders(); }, []);
  useEffect(() => { filterOrders(); }, [searchQuery, activeFilter, orders]);

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const userData = await getUserData();
      if (!userData) {
        navigation.navigate('Login');
        return;
      }
      setTimeout(() => {
        setOrders(mockOrders);
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error loading orders:', error);
      Alert.alert('Error', 'Failed to load orders. Please try again.');
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadOrders();
    setIsRefreshing(false);
  };

  const filterOrders = () => {
    let filtered = [...orders];
    if (activeFilter !== 'all') {
      filtered = filtered.filter(order => order.status === activeFilter);
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        order =>
          order.orderNo.toLowerCase().includes(query) ||
          order.customerName.toLowerCase().includes(query)
      );
    }
    setFilteredOrders(filtered);
  };

  const handleOrderPress = (order: Order) => {
    navigation.navigate('OrderDetail', { orderId: order.id });
  };

  const renderOrderCard = ({ item: order }: { item: Order }) => (
    <Card
      style={{ marginBottom: 16, borderRadius: 12, elevation: 2, backgroundColor: theme.colors.surface }}
      onPress={() => handleOrderPress(order)}
    >
      <Card.Content>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <Text variant="titleMedium" style={{ color: theme.colors.primary }}>{order.orderNo}</Text>
          <Badge style={{ backgroundColor: statusColors[order.status], color: 'white', fontWeight: 'bold' }}>{order.status.toUpperCase()}</Badge>
        </View>
        <Text style={{ color: theme.colors.onSurface, fontWeight: 'bold', marginBottom: 4 }}>{order.customerName}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 4 }}>
          <Text style={{ color: theme.colors.onSurface, marginRight: 12 }}>Order Date: <Text style={{ fontWeight: 'bold' }}>{formatDate(order.orderDate)}</Text></Text>
          {order.deliveryDate && (
            <Text style={{ color: theme.colors.onSurface, marginRight: 12 }}>Delivery: <Text style={{ fontWeight: 'bold' }}>{formatDate(order.deliveryDate)}</Text></Text>
          )}
          <Text style={{ color: theme.colors.onSurface }}>Items: <Text style={{ fontWeight: 'bold' }}>{order.itemCount}</Text></Text>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
          <Text style={{ color: theme.colors.primary, fontWeight: 'bold', fontSize: 16 }}>{formatCurrency(order.totalAmount)}</Text>
          <Button mode="contained-tonal" onPress={() => handleOrderPress(order)} style={{ borderRadius: 6 }} labelStyle={{ fontWeight: 'bold' }}>
            View Details
          </Button>
        </View>
      </Card.Content>
    </Card>
  );

  const renderFilterChip = (filter: OrderStatus | 'all', label: string) => (
    <Chip
      key={filter}
      selected={activeFilter === filter}
      onPress={() => setActiveFilter(filter)}
      style={{ marginRight: 8, marginBottom: 8, backgroundColor: activeFilter === filter ? theme.colors.primary : theme.colors.surface }}
      textStyle={{ color: activeFilter === filter ? theme.colors.onPrimary : theme.colors.primary, fontWeight: activeFilter === filter ? 'bold' : 'normal' }}
    >
      {label}
    </Chip>
  );

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
        <ActivityIndicator size={32} animating color={theme.colors.primary} />
        <Text style={{ color: theme.colors.primary, marginTop: 12 }}>Loading orders...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Appbar.Header style={{ backgroundColor: theme.colors.primary }}>
        <Appbar.Content title="My Orders" titleStyle={{ color: theme.colors.onPrimary, fontWeight: 'bold' }} />
      </Appbar.Header>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: theme.colors.surface, borderBottomWidth: 1, borderBottomColor: theme.colors.outlineVariant }}>
        {renderFilterChip('all', 'All')}
        {renderFilterChip('pending', 'Pending')}
        {renderFilterChip('processing', 'Processing')}
        {renderFilterChip('completed', 'Completed')}
        {renderFilterChip('cancelled', 'Cancelled')}
      </View>
      {filteredOrders.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ color: theme.colors.onSurface, fontSize: 16, textAlign: 'center' }}>No orders found</Text>
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          renderItem={renderOrderCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[theme.colors.primary]}
            />
          }
        />
      )}
    </View>
  );
};

export default MyOrders; 