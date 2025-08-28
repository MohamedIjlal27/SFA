import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  useWindowDimensions,
  ScaledSize,
  Alert
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { createOrderDetailStyles } from '../../utils/styles/OrderDetail.styles';
import BackButton from '../../components/BackButton';
import LinearGradient from 'react-native-linear-gradient';
import {
  Surface,
  Card,
  Text,
  Button,
  ActivityIndicator,
  useTheme,
  Divider
} from 'react-native-paper';

type Props = NativeStackScreenProps<RootStackParamList, 'OrderDetail'>;

// Define order item interface
interface OrderItem {
  id: string;
  productName: string;
  itemCode: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
}

// Define order status type
type OrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled';

// Define order interface
interface Order {
  id: string;
  orderNo: string;
  customerId: string;
  customerName: string;
  orderDate: string;
  deliveryDate: string | null;
  totalAmount: number;
  status: OrderStatus;
  items: OrderItem[];
  paymentMethod: string;
  notes: string;
}

// Mock order data
const mockOrder: Order = {
  id: '1',
  orderNo: 'ORD-001',
  customerId: 'CUST001',
  customerName: 'ABC Corporation',
  orderDate: '2023-06-15',
  deliveryDate: '2023-06-20',
  totalAmount: 1250.75,
  status: 'completed',
  paymentMethod: 'Credit',
  notes: 'Deliver to the back entrance. Ask for John.',
  items: [
    {
      id: '1',
      productName: 'Premium LED Bulb',
      itemCode: 'LED001',
      quantity: 10,
      unitPrice: 45.50,
      discount: 10,
      total: 409.50
    },
    {
      id: '2',
      productName: 'Power Extension Cord',
      itemCode: 'EXT002',
      quantity: 5,
      unitPrice: 75.25,
      discount: 5,
      total: 357.44
    },
    {
      id: '3',
      productName: 'Smart Switch',
      itemCode: 'SWI003',
      quantity: 3,
      unitPrice: 120.00,
      discount: 0,
      total: 360.00
    },
    {
      id: '4',
      productName: 'Ceiling Fan',
      itemCode: 'FAN004',
      quantity: 1,
      unitPrice: 150.00,
      discount: 15,
      total: 127.50
    }
  ]
};

const isTablet = (dimensions: ScaledSize) => Math.min(dimensions.width, dimensions.height) >= 768;
const isLandscape = (dimensions: ScaledSize) => dimensions.width > dimensions.height;

const OrderDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { orderId } = route.params;
  const dimensions = useWindowDimensions();
  const styles = createOrderDetailStyles(dimensions);
  const theme = useTheme();

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadOrderDetails();
  }, []);

  const loadOrderDetails = async () => {
    setIsLoading(true);
    try {
      // In a real app, you would fetch order details from an API
      // For now, we'll use mock data
      setTimeout(() => {
        setOrder(mockOrder);
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error loading order details:', error);
      Alert.alert('Error', 'Failed to load order details. Please try again.');
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: OrderStatus): string => {
    switch (status) {
      case 'pending': return '#F59E0B'; // Amber
      case 'processing': return '#3B82F6'; // Blue
      case 'completed': return '#10B981'; // Green
      case 'cancelled': return '#EF4444'; // Red
      default: return '#6B7280'; // Gray
    }
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleEditOrder = () => {
    Alert.alert('Edit Order', 'Edit order functionality will be implemented here.');
  };

  const renderOrderItem = (item: OrderItem, index: number) => (
    <View key={item.id} style={[styles.itemRow, index % 2 === 0 ? styles.evenRow : styles.oddRow]}>
      <View style={styles.itemCell}>
        <Text style={styles.itemName}>{item.productName}</Text>
        <Text style={styles.itemCode}>{item.itemCode}</Text>
      </View>
      <View style={styles.quantityCell}>
        <Text style={styles.itemQuantity}>{item.quantity}</Text>
      </View>
      <View style={styles.priceCell}>
        <Text style={styles.itemPrice}>{formatCurrency(item.unitPrice)}</Text>
      </View>
      <View style={styles.discountCell}>
        <Text style={styles.itemDiscount}>{item.discount}%</Text>
      </View>
      <View style={styles.totalCell}>
        <Text style={styles.itemTotal}>{formatCurrency(item.total)}</Text>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <Surface style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}> 
        <ActivityIndicator size={48} animating color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading order details...</Text>
      </Surface>
    );
  }

  if (!order) {
    return (
      <Surface style={[styles.errorContainer, { backgroundColor: theme.colors.background }]}> 
        <Text style={styles.errorText}>Order not found</Text>
        <BackButton onPress={handleBackPress} style={styles.backButton} accessibilityLabel="Go Back" iconColor="white" />
      </Surface>
    );
  }

  return (
    <Surface style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {/* Gradient Header */}
      <LinearGradient
        colors={(theme as any).gradient || [theme.colors.primary, theme.colors.secondary || theme.colors.primary]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <BackButton onPress={handleBackPress} style={styles.backButton} accessibilityLabel="Go Back" iconColor="white" />
        <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.onPrimary }]}>Order Details</Text>
        <Button mode="text" onPress={handleEditOrder} labelStyle={styles.editButtonText} textColor={theme.colors.onPrimary} style={styles.editButton}>
          Edit
        </Button>
      </LinearGradient>

      <ScrollView style={styles.scrollContainer} contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Order Number & Status */}
        <Card style={[styles.section, { marginTop: 16, marginBottom: 0 }]}> 
        <View style={styles.orderHeader}>
          <View style={styles.orderNoContainer}>
            <Text style={styles.orderNoLabel}>Order Number</Text>
            <Text style={styles.orderNo}>{order.orderNo}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
            <Text style={styles.statusText}>{order.status.toUpperCase()}</Text>
          </View>
        </View>
        </Card>

        {/* Customer Info */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Information</Text>
          <Divider style={{ marginVertical: 8 }} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Customer ID:</Text>
            <Text style={styles.infoValue}>{order.customerId}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Customer Name:</Text>
            <Text style={styles.infoValue}>{order.customerName}</Text>
          </View>
        </Card>

        {/* Order Info */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Order Information</Text>
          <Divider style={{ marginVertical: 8 }} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Order Date:</Text>
            <Text style={styles.infoValue}>{formatDate(order.orderDate)}</Text>
          </View>
          {order.deliveryDate && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Delivery Date:</Text>
              <Text style={styles.infoValue}>{formatDate(order.deliveryDate)}</Text>
            </View>
          )}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Payment Method:</Text>
            <Text style={styles.infoValue}>{order.paymentMethod}</Text>
          </View>
          {order.notes && (
            <View style={styles.notesContainer}>
              <Text style={styles.infoLabel}>Notes:</Text>
              <Text style={styles.notesText}>{order.notes}</Text>
            </View>
          )}
        </Card>

        {/* Order Items */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Order Items</Text>
          <Divider style={{ marginVertical: 8 }} />
          <View style={styles.tableHeader}>
            <View style={styles.itemCell}>
              <Text style={styles.columnHeader}>Item</Text>
            </View>
            <View style={styles.quantityCell}>
              <Text style={styles.columnHeader}>Qty</Text>
            </View>
            <View style={styles.priceCell}>
              <Text style={styles.columnHeader}>Price</Text>
            </View>
            <View style={styles.discountCell}>
              <Text style={styles.columnHeader}>Disc</Text>
            </View>
            <View style={styles.totalCell}>
              <Text style={styles.columnHeader}>Total</Text>
            </View>
          </View>
          {order.items.map((item, index) => renderOrderItem(item, index))}
          <Divider style={{ marginVertical: 8 }} />
          <View style={styles.summaryContainer}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal:</Text>
              <Text style={styles.summaryValue}>{formatCurrency(order.items.reduce((sum, item) => sum + item.total, 0))}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Discount:</Text>
              <Text style={styles.discountValue}>-{formatCurrency(order.items.reduce((sum, item) => sum + (item.unitPrice * item.quantity * item.discount / 100), 0))}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total:</Text>
              <Text style={styles.totalValue}>{formatCurrency(order.totalAmount)}</Text>
            </View>
          </View>
        </Card>
        
        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          <Button mode="contained" style={styles.actionButton} labelStyle={styles.actionButtonText} onPress={() => {}}>
            Print Invoice
          </Button>
          <Button mode="outlined" style={[styles.actionButton, styles.secondaryButton]} labelStyle={styles.secondaryButtonText} onPress={() => {}}>
            Share
          </Button>
        </View>
      </ScrollView>
    </Surface>
  );
};

export default OrderDetailScreen; 