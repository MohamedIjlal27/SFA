import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Image,
  Alert,
  Platform,
  ActivityIndicator,
  Modal,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { customerDetailService } from '../../services/customerDetailService';
import { useFocusEffect } from '@react-navigation/native';
import { orderItemsStore } from '../../services/orderItemsStore';
import { Product, productService } from '../../services/productService';

type Props = NativeStackScreenProps<RootStackParamList, 'CreateOrder'>;

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
  imageUrl?: string;
  hasPriceRequest?: boolean;
  priceRequest?: {
    type: 'percentage' | 'price';
    value: number;
    status: 'pending' | 'approved' | 'rejected';
  };
}

interface OrderDetails {
  orderNo: string;
  customerId: string;
  customerName: string;
  orderDate: string;
  paymentMode: string;
  visitMode: string;
  creditRemaining: number;
  expectedDeliveryDate: string;
  subTotal: number;
  totalDiscount: number;
  grandTotal: number;
  items: OrderItem[];
  creditRemainingValue: number;
}

const CreateOrderScreen: React.FC<Props> = ({ route, navigation }) => {
  const { customerId, customerName } = route.params;
  const [products, setProducts] = useState<Product[]>([]);
  const [orderDetails, setOrderDetails] = useState<OrderDetails>({
    orderNo: `JM${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 100)}`,
    customerId,
    customerName,
    orderDate: new Date().toISOString().slice(0, 10),
    paymentMode: 'Credit',
    visitMode: 'Visit',
    creditRemaining: 0,
    expectedDeliveryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    subTotal: 0,
    totalDiscount: 0,
    grandTotal: 0,
    items: [],
    creditRemainingValue: 0
  });

  const [modeOfPayment, setModeOfPayment] = useState<'Credit' | 'Cash'>('Credit');
  const [visitMode, setVisitMode] = useState<'Visit' | 'Call' | 'Old'>('Visit');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [deliveryDate, setDeliveryDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [showPriceRequestModal, setShowPriceRequestModal] = useState(false);
  const [selectedItemForPrice, setSelectedItemForPrice] = useState<OrderItem | null>(null);
  const [priceRequestType, setPriceRequestType] = useState<'percentage' | 'price'>('percentage');
  const [priceRequestValue, setPriceRequestValue] = useState('');
  const [priceRequestRemarks, setPriceRequestRemarks] = useState('');

  useEffect(() => {
    // Update totals whenever items change
    const subTotal = orderDetails.items.reduce((sum, item) => sum + item.total, 0);
    const totalDiscount = orderDetails.items.reduce((sum, item) => sum + item.discount, 0);
    const grandTotal = subTotal - totalDiscount;
    
    // Always calculate credit remaining from the initial value minus current grand total
    const newCreditRemaining = Math.max(0, orderDetails.creditRemainingValue - grandTotal);

    setOrderDetails(prev => ({
      ...prev,
      subTotal,
      totalDiscount,
      grandTotal,
      creditRemaining: newCreditRemaining
    }));
  }, [orderDetails.items, orderDetails.creditRemainingValue]);

  useEffect(() => {
    loadCustomerDetails();
  }, []);

  useEffect(() => {
    loadProducts();
  }, []);

  // Check for selected items when the screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      const fetchSelectedItems = async () => {
        try {
        const selectedItems = await orderItemsStore.getSelectedItems();
          if (selectedItems && selectedItems.length > 0) {
          setOrderDetails(prev => ({
            ...prev,
            items: [...prev.items, ...selectedItems]
          }));
            await orderItemsStore.clearSelectedItems();
          }
        } catch (error) {
          console.log('No temporary order items to fetch - this is normal for new orders');
        }
      };
      fetchSelectedItems();
    }, [])
  );

  // Handle selected items when returning from AddItems screen
  React.useEffect(() => {
    const selectedItems = route.params?.selectedItems;
    if (selectedItems) {
      const newItems = [...orderDetails.items];
      selectedItems.forEach(item => {
        newItems.push(item);
      });
      
      setOrderDetails(prev => ({
        ...prev,
        items: newItems
      }));
      
      // Clear the selectedItems param to prevent duplicate additions
      navigation.setParams({ selectedItems: undefined });
    }
  }, [route.params?.selectedItems, orderDetails.items, navigation]);

  const loadCustomerDetails = async () => {
    try {
      setIsLoading(true);
      const customerData = await customerDetailService.getCustomerDetails(customerId);
      
      if (customerData) {
        // Calculate credit remaining: creditLimit - balanceDue
        const creditLimit = customerData.result.creditLimit || 0;
        const balanceDue = customerData.balanceDue || 0;
        const initialCreditRemaining = creditLimit - balanceDue;
        
        // Update order details with initial credit remaining
        setOrderDetails(prev => ({
          ...prev,
          creditRemainingValue: initialCreditRemaining, // Store the initial value
          creditRemaining: initialCreditRemaining
        }));
      } else {
        // If no customer data found, try to sync from API
        const syncedData = await customerDetailService.syncCustomerDetails(customerId);
        
        if (syncedData) {
          const creditLimit = syncedData.result.creditLimit || 0;
          const balanceDue = syncedData.balanceDue || 0;
          const initialCreditRemaining = creditLimit - balanceDue;
          
          setOrderDetails(prev => ({
            ...prev,
            creditRemainingValue: initialCreditRemaining, // Store the initial value
            creditRemaining: initialCreditRemaining
          }));
        }
      }
    } catch (error) {
      console.error('Error loading customer details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const productsData = await productService.getProducts();
      setProducts(productsData);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const formatCurrency = (amount: number): string => {
    return amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handleDiscard = () => {
    Alert.alert(
      "Discard Order",
      "Are you sure you want to discard this order?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Discard", style: "destructive", onPress: () => navigation.goBack() }
      ]
    );
  };

  const handleSave = () => {
    Alert.alert(
      "Save Order",
      "Order has been saved as draft",
      [{ text: "OK", onPress: () => navigation.goBack() }]
    );
  };

  const handlePost = () => {
    Alert.alert(
      "Post Order",
      "Are you sure you want to post this order?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Post", 
          onPress: () => {
            Alert.alert(
              "Success",
              "Order has been posted successfully",
              [{ text: "OK", onPress: () => navigation.goBack() }]
            );
          } 
        }
      ]
    );
  };

  const handleAddNewItem = () => {
    navigation.navigate('AddItems', {
      orderId: orderDetails.orderNo,
      customerName: orderDetails.customerName,
    });
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDeliveryDate(selectedDate);
    }
  };

  const handleDeleteItem = (itemId: string) => {
    setOrderDetails(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== itemId)
    }));
  };

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    setOrderDetails(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.id === itemId) {
          // Find the corresponding product to get available quantity
          const product = products.find(p => p.itemCode === item.itemCode);
          const availableQty = product?.qty || 0;
          
          // Ensure quantity is not negative and doesn't exceed available quantity
          const quantity = Math.max(0, Math.min(newQuantity, availableQty));
          const total = (item.unitPrice * quantity) - (item.discount * quantity);
          return { ...item, quantity, total };
        }
        return item;
      })
    }));
  };

  const handleEditDiscount = (itemId: string) => {
    const item = orderDetails.items.find(item => item.id === itemId);
    if (item) {
      setSelectedItemForPrice(item);
      setPriceRequestType(item.priceRequest?.type || 'percentage');
      setPriceRequestValue(item.priceRequest?.value.toString() || '');
      setShowPriceRequestModal(true);
    }
  };

  const handleResetPriceRequest = () => {
    if (!selectedItemForPrice) return;

    setOrderDetails(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.id === selectedItemForPrice.id) {
          // Get the original item before any price request was made
          const originalItem = prev.items.find(i => i.id === item.id);
          const hadStandardDiscount = originalItem && !originalItem.hasPriceRequest && originalItem.discount > 0;

          // If there was no standard discount, reset discount to 0
          if (!hadStandardDiscount) {
            return {
              ...item,
              hasPriceRequest: false,
              priceRequest: undefined,
              discount: 0,
              discountPercentage: 0,
              total: item.unitPrice * item.quantity
            };
          }

          // If there was a standard discount, just remove price request fields
          const { hasPriceRequest, priceRequest, ...rest } = item;
          return rest;
        }
        return item;
      })
    }));

    setShowPriceRequestModal(false);
    setSelectedItemForPrice(null);
    setPriceRequestValue('');
    setPriceRequestRemarks('');
  };

  const handleSubmitPriceRequest = () => {
    if (!selectedItemForPrice) return;

    setOrderDetails(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.id === selectedItemForPrice.id) {
          const value = parseFloat(priceRequestValue) || 0;
          const priceRequest = {
            type: priceRequestType,
            value,
            status: 'pending' as const,
            remarks: priceRequestRemarks
          };
          
          // Calculate new discount based on price request
          const newDiscount = priceRequestType === 'percentage' 
            ? (selectedItemForPrice.unitPrice * value) / 100
            : selectedItemForPrice.unitPrice - value;
          
          return {
            ...selectedItemForPrice,
            hasPriceRequest: true,
            priceRequest,
            discount: newDiscount,
            discountPercentage: priceRequestType === 'percentage' ? value : (newDiscount / selectedItemForPrice.unitPrice) * 100,
            total: (selectedItemForPrice.unitPrice - newDiscount) * selectedItemForPrice.quantity
          };
        }
        return item;
      })
    }));

    setShowPriceRequestModal(false);
    setSelectedItemForPrice(null);
    setPriceRequestValue('');
    setPriceRequestRemarks('');
  };

  const renderRightActions = (itemId: string) => {
    return (
      <TouchableOpacity
        style={styles.deleteAction}
        onPress={() => handleDeleteItem(itemId)}
      >
        <Text style={styles.deleteActionText}>Delete</Text>
      </TouchableOpacity>
    );
  };

  const renderTableRow = (item: OrderItem, index: number) => {
    // Find the corresponding product to get available quantity
    const product = products.find(p => p.itemCode === item.itemCode);
    const availableQty = product?.qty || 0;
    const isMaxQty = item.quantity >= availableQty;

    return (
      <Swipeable
        renderRightActions={() => renderRightActions(item.id)}
        overshootRight={false}
      >
        <View style={styles.tableRow}>
          <Text style={[styles.tableCell, styles.numberCell]}>{String(index + 1).padStart(2, '0')}</Text>
          
          <View style={[styles.tableCell, styles.itemCell]}>
            <Image
              source={
                item.imageUrl 
                  ? { uri: `file://${item.imageUrl}` }
                  : require('../../assets/product-placeholder.png')
              }
              style={styles.productImage}
              defaultSource={require('../../assets/product-placeholder.png')}
            />
            <View style={styles.productInfo}>
              <Text style={styles.productCode}>{item.itemCode}</Text>
              <Text style={styles.productName}>{item.description}</Text>
            </View>
          </View>
          
          <Text style={[styles.tableCell, styles.uomCell]}>{item.uom}</Text>
          <Text style={[styles.tableCell, styles.priceCell]}>{formatCurrency(item.unitPrice)}</Text>
          
          <View style={[styles.tableCell, styles.qtyCell]}>
            <View style={styles.qtyContainer}>
              <TouchableOpacity 
                style={[styles.qtyButton, item.quantity === 0 && styles.quantityButtonDisabled]}
                onPress={() => handleQuantityChange(item.id, item.quantity - 1)}
                disabled={item.quantity === 0}
              >
                <Text style={[styles.qtyButtonText, item.quantity === 0 && styles.quantityButtonTextDisabled]}>−</Text>
              </TouchableOpacity>
              <TextInput
                style={[styles.qtyInput, isMaxQty && styles.quantityInputMax]}
                value={String(item.quantity)}
                onChangeText={(value) => handleQuantityChange(item.id, parseInt(value) || 0)}
                keyboardType="numeric"
              />
              <TouchableOpacity 
                style={[styles.qtyButton, isMaxQty && styles.quantityButtonDisabled]}
                onPress={() => handleQuantityChange(item.id, item.quantity + 1)}
                disabled={isMaxQty}
              >
                <Text style={[styles.qtyButtonText, isMaxQty && styles.quantityButtonTextDisabled]}>+</Text>
              </TouchableOpacity>
            </View>
            {isMaxQty && (
              <Text style={styles.maxQuantityText}>Max qty reached</Text>
            )}
          </View>
          
          <View style={[styles.tableCell, styles.discountCell]}>
            <Text style={[
              styles.discountPercentage,
              item.hasPriceRequest ? styles.requestedDiscount : styles.standardDiscount
            ]}>{item.discountPercentage.toFixed(2)}%</Text>
            <View style={styles.discountContainer}>
              <Text style={[
                styles.discountAmount,
                item.hasPriceRequest ? styles.requestedDiscount : styles.standardDiscount
              ]}>{formatCurrency(item.discount)}</Text>
              <TouchableOpacity 
                style={styles.editButton}
                onPress={() => handleEditDiscount(item.id)}
              >
                <Text style={styles.editButtonText}>✎</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <Text style={[styles.tableCell, styles.totalCell]}>{formatCurrency(item.total)}</Text>
        </View>
      </Swipeable>
    );
  };

  const renderPicker = (
    value: string,
    onValueChange: (value: any) => void,
    items: { label: string; value: string }[],
    showWarning: boolean = false
  ) => {
    if (Platform.OS === 'ios') {
      return (
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={value}
            onValueChange={onValueChange}
            style={styles.picker}
          >
            {items.map((item) => (
              <Picker.Item
                key={item.value}
                label={item.label}
                value={item.value}
              />
            ))}
          </Picker>
          <Text style={styles.dropdownIcon}>▼</Text>
          {showWarning && <Text style={styles.warningIcon}>⚠️</Text>}
        </View>
      );
    } else {
      // For Android, we'll use a button that shows a modal picker
      return (
        <TouchableOpacity
          style={styles.androidPickerButton}
          onPress={() => {
            // Here you would show a modal with the picker
            // For now, we'll just cycle through the values
            const currentIndex = items.findIndex(item => item.value === value);
            const nextIndex = (currentIndex + 1) % items.length;
            onValueChange(items[nextIndex].value);
          }}
        >
          <Text style={styles.androidPickerButtonText}>
            {items.find(item => item.value === value)?.label || value}
          </Text>
          <Text style={styles.dropdownIcon}>▼</Text>
          {showWarning && <Text style={styles.warningIcon}>⚠️</Text>}
        </TouchableOpacity>
      );
    }
  };

  const renderPriceRequestModal = () => {
    if (!selectedItemForPrice) return null;

    return (
      <Modal
        visible={showPriceRequestModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPriceRequestModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowPriceRequestModal(false)}
        >
          <View style={styles.priceRequestModal} onStartShouldSetResponder={() => true}>
            <View style={styles.priceRequestHeader}>
              <Text style={styles.priceRequestTitle}>
                {selectedItemForPrice.priceRequest ? 'Edit Price Request' : 'New Price Request'}
              </Text>
              {selectedItemForPrice.hasPriceRequest && (
                <TouchableOpacity
                  style={styles.resetButton}
                  onPress={handleResetPriceRequest}
                >
                  <Text style={styles.resetButtonText}>Reset</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.priceRequestContent}>
              <View style={styles.priceRequestRow}>
                <Text style={styles.priceRequestLabel}>Unit Price:</Text>
                <Text style={styles.priceRequestValue}>
                  {formatCurrency(selectedItemForPrice.unitPrice)}
                </Text>
              </View>

              <View style={styles.priceRequestRow}>
                <Text style={styles.priceRequestLabel}>Request Type:</Text>
                <View style={styles.priceRequestTypeContainer}>
                  <TouchableOpacity
                    style={[
                      styles.priceRequestTypeButton,
                      priceRequestType === 'percentage' && styles.priceRequestTypeButtonActive
                    ]}
                    onPress={() => setPriceRequestType('percentage')}
                  >
                    <Text style={[
                      styles.priceRequestTypeText,
                      priceRequestType === 'percentage' && styles.priceRequestTypeTextActive
                    ]}>By Percentage</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.priceRequestTypeButton,
                      priceRequestType === 'price' && styles.priceRequestTypeButtonActive
                    ]}
                    onPress={() => setPriceRequestType('price')}
                  >
                    <Text style={[
                      styles.priceRequestTypeText,
                      priceRequestType === 'price' && styles.priceRequestTypeTextActive
                    ]}>By Price</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.priceRequestRow}>
                <Text style={styles.priceRequestLabel}>
                  {priceRequestType === 'percentage' ? 'Percentage:' : 'New Price:'}
                </Text>
                <TextInput
                  style={styles.priceRequestInput}
                  value={priceRequestValue}
                  onChangeText={setPriceRequestValue}
                  keyboardType="numeric"
                  placeholder={priceRequestType === 'percentage' ? 'Enter %' : 'Enter price'}
                />
              </View>

              {priceRequestValue !== '' && (
                <View style={styles.calculatedPriceRow}>
                  <Text style={styles.calculatedPriceLabel}>New Price:</Text>
                  <Text style={styles.calculatedPriceValue}>
                    {formatCurrency(
                      priceRequestType === 'percentage'
                        ? selectedItemForPrice.unitPrice * (1 - parseFloat(priceRequestValue) / 100)
                        : parseFloat(priceRequestValue) || 0
                    )}
                  </Text>
                </View>
              )}

              <View style={styles.priceRequestRow}>
                <Text style={styles.priceRequestLabel}>Remarks:</Text>
                <TextInput
                  style={[styles.priceRequestInput, styles.remarksInput]}
                  value={priceRequestRemarks}
                  onChangeText={setPriceRequestRemarks}
                  placeholder="Enter remarks"
                  multiline={true}
                  numberOfLines={3}
                />
              </View>
            </View>

            <View style={styles.priceRequestActions}>
              <TouchableOpacity
                style={styles.priceRequestButton}
                onPress={() => setShowPriceRequestModal(false)}
              >
                <Text style={styles.priceRequestButtonText}>Discard</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.priceRequestButton, styles.priceRequestSubmitButton]}
                onPress={handleSubmitPriceRequest}
              >
                <Text style={[styles.priceRequestButtonText, styles.priceRequestSubmitButtonText]}>Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  // Update the customer card to show approval status
  const renderCustomerCard = () => (
    <LinearGradient
      colors={['#4CD4C0', '#4A90E2']}
      style={styles.customerCard}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
    >
      <View style={styles.customerCardContent}>
        <View>
          <Text style={styles.customerID}>{orderDetails.customerId}</Text>
          <Text style={styles.customerName}>{orderDetails.customerName}</Text>
        </View>
        {orderDetails.items.some(item => item.hasPriceRequest) && (
          <View style={styles.approvalBadge}>
            <Text style={styles.approvalBadgeText}>Approval Needed</Text>
          </View>
        )}
      </View>
    </LinearGradient>
  );

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleDiscard}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Order</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.saveButton]}
              onPress={handleSave}
            >
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.postButton]}
              onPress={handlePost}
            >
              <Text style={styles.postButtonText}>Post</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Customer Info Card */}
        {renderCustomerCard()}
        
        <ScrollView style={styles.scrollView}>
          {/* Order Details */}
          <View style={styles.orderDetailsSection}>
            <View style={styles.orderDetailsColumns}>
              {/* Column 1: Payment Info */}
              <View style={styles.orderDetailsColumn}>
                <View style={styles.orderDetailItem}>
                  <Text style={styles.orderDetailLabel}>Mode of Payment</Text>
                  <View style={styles.orderDetailInputContainer}>
                    {renderPicker(
                      modeOfPayment,
                      (value: 'Credit' | 'Cash') => setModeOfPayment(value),
                      [
                        { label: 'Credit', value: 'Credit' },
                        { label: 'Cash', value: 'Cash' }
                      ]
                    )}
                  </View>
                </View>
                
                <View style={styles.orderDetailItem}>
                  <Text style={styles.orderDetailLabel}>Mode</Text>
                  <View style={[styles.orderDetailInputContainer, styles.warningInput]}>
                    {renderPicker(
                      visitMode,
                      (value: 'Visit' | 'Call' | 'Old') => setVisitMode(value),
                      [
                        { label: 'Visit', value: 'Visit' },
                        { label: 'Call', value: 'Call' },
                        { label: 'Old', value: 'Old' }
                      ],
                      true
                    )}
                  </View>
                </View>
              </View>
              
              {/* Column 2: Delivery Info */}
              <View style={styles.orderDetailsColumn}>
                <View style={styles.orderDetailItem}>
                  <Text style={styles.orderDetailLabel}>Credit Remaining</Text>
                  <View style={[styles.orderDetailInputContainer, styles.creditInput]}>
                    {isLoading ? (
                      <ActivityIndicator size="small" color="#EF4444" />
                    ) : (
                      <Text style={styles.orderDetailValue}>{formatCurrency(orderDetails.creditRemaining)}</Text>
                    )}
                  </View>
                </View>
                
                <View style={styles.orderDetailItem}>
                  <Text style={styles.orderDetailLabel}>Expected Delivery Date</Text>
                  <TouchableOpacity 
                    style={[styles.orderDetailInputContainer, styles.dateInput]}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Text style={styles.orderDetailValue}>
                      {deliveryDate.toLocaleDateString()}
                    </Text>
                    <Text style={styles.dropdownIcon}>▼</Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              {/* Column 3: Totals */}
              <View style={styles.orderTotalsColumn}>
                <Text style={[styles.orderDetailLabel, styles.summaryTitle]}>Order Summary</Text>
                <View style={styles.orderSummaryContainer}>
                  <View style={styles.orderSummarySection}>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Sub Total</Text>
                      <Text style={styles.summaryValue}>{formatCurrency(orderDetails.subTotal)}</Text>
                    </View>
                    
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Total Discount</Text>
                      <Text style={[styles.summaryValue, styles.discountValue]}>({formatCurrency(orderDetails.totalDiscount)})</Text>
                    </View>
                    
                    <View style={styles.grandTotalRow}>
                      <Text style={styles.grandTotalLabel}>Grand Total</Text>
                      <Text style={styles.grandTotalValue}>{formatCurrency(orderDetails.grandTotal)}</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </View>
          
          {/* Order Items Table */}
          <View style={styles.orderItemsTable}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, styles.numberCell]}>#</Text>
              <Text style={[styles.tableHeaderCell, styles.itemCell]}>Item</Text>
              <Text style={[styles.tableHeaderCell, styles.uomCell]}>UoM</Text>
              <Text style={[styles.tableHeaderCell, styles.priceCell]}>Unit Price</Text>
              <Text style={[styles.tableHeaderCell, styles.qtyCell]}>Qty</Text>
              <Text style={[styles.tableHeaderCell, styles.discountCell]}>Discount</Text>
              <Text style={[styles.tableHeaderCell, styles.totalCell]}>Total</Text>
            </View>
            
            {/* Table Rows */}
            {orderDetails.items.map((item, index) => renderTableRow(item, index))}
          </View>
          
        </ScrollView>

        {/* Add Items Button */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.addItemsButton} onPress={handleAddNewItem}>
            <LinearGradient
              colors={['#4CD4C0', '#4A90E2']}
              style={styles.addItemsGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.addItemsText}>Add Items</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={deliveryDate}
            mode="date"
            display="default"
            onChange={handleDateChange}
            minimumDate={new Date()}
          />
        )}

        {renderPriceRequestModal()}
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 10 : StatusBar.currentHeight! + 10,
    paddingBottom: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginLeft: 8,
  },
  saveButton: {
    backgroundColor: '#4ADE80',
  },
  postButton: {
    backgroundColor: '#F97316',
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
  },
  postButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
  },
  customerCard: {
    padding: 16,
    borderRadius: 0,
  },
  customerCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  customerID: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  customerName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  scrollView: {
    flex: 1,
  },
  orderDetailsSection: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: 'white',
    marginBottom: 8,
  },
  orderDetailsColumns: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderDetailsColumn: {
    width: '30%',
    paddingRight: 10,
  },
  orderTotalsColumn: {
    width: '36%',
  },
  orderDetailItem: {
    marginBottom: 20,
    width: '100%',
  },
  orderDetailLabel: {
    fontSize: 14,
    color: '#9333EA',
    marginBottom: 10,
    fontWeight: '600',
  },
  orderDetailInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 0,
    backgroundColor: 'white',
    height: 48,
    width: '100%',
  },
  warningInput: {
    borderColor: '#F59E0B',
  },
  warningIcon: {
    fontSize: 16,
    color: '#F59E0B',
    marginLeft: 4,
  },
  creditInput: {
    borderColor: '#EF4444',
    borderWidth: 2,
  },
  dateInput: {
    borderColor: '#E0E0E0',
  },
  orderDetailValue: {
    fontSize: 16,
    color: '#333',
    flex: 1,
    fontWeight: '500',
  },
  dropdownIcon: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
  orderSummaryContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    width: '100%',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  orderSummarySection: {
    width: '100%',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  summaryValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    textAlign: 'right',
    minWidth: 100,
  },
  discountValue: {
    color: '#EF4444',
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#E5E7EB',
    padding: 12,
    borderRadius: 6,
    marginTop: 12,
    marginBottom: 0,
    alignItems: 'center',
  },
  grandTotalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  grandTotalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'right',
    minWidth: 100,
  },
  orderItemsTable: {
    backgroundColor: 'white',
    marginBottom: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#60A5FA',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  tableHeaderCell: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  tableCell: {
    justifyContent: 'center',
  },
  numberCell: {
    width: '5%',
    textAlign: 'center',
  },
  itemCell: {
    width: '28%',
    flexDirection: 'row',
    alignItems: 'center',
  },
  uomCell: {
    width: '8%',
    textAlign: 'center',
  },
  priceCell: {
    width: '12%',
    textAlign: 'right',
  },
  qtyCell: {
    width: '18%',
    alignItems: 'center',
  },
  discountCell: {
    width: '8%',
    alignItems: 'center',
  },
  totalCell: {
    width: '15%',
    textAlign: 'right',
  },
  productImage: {
    width: 40,
    height: 40,
    borderRadius: 4,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  productInfo: {
    flex: 1,
  },
  productCode: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  productName: {
    fontSize: 12,
    color: '#666',
  },
  qtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 6,
    overflow: 'hidden',
  },
  qtyButton: {
    width: 28,
    height: 28,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyButtonText: {
    fontSize: 16,
    color: '#4B5563',
    fontWeight: '600',
  },
  qtyInput: {
    width: 40,
    height: 28,
    textAlign: 'center',
    fontSize: 14,
    color: '#1F2937',
    padding: 0,
    backgroundColor: 'white',
  },
  editButton: {
    marginLeft: 4,
    padding: 4,
  },
  editButtonText: {
    fontSize: 16,
    color: '#4B5563',
  },
  discountPercentage: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#10B981',
  },
  discountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  discountAmount: {
    fontSize: 12,
    color: '#10B981',
  },
  addNewItemButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 24,
  },
  addNewItemButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  footer: {
    backgroundColor: 'white',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  addItemsButton: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  addItemsGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  addItemsText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    height: '100%',
  },
  picker: {
    width: '90%',
    height: 48,
    marginRight: -8,
  },
  dateButton: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#333',
  },
  androidPickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    height: '100%',
  },
  androidPickerButtonText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  deleteAction: {
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '100%',
  },
  deleteActionText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  quantityButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  quantityButtonTextDisabled: {
    color: '#9CA3AF',
  },
  quantityInputMax: {
    borderColor: '#EF4444',
  },
  maxQuantityText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
  },
  approvalBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  approvalBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  standardDiscount: {
    color: '#10B981',
  },
  requestedDiscount: {
    color: '#EF4444',
  },
  priceRequestModal: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 440,
  },
  priceRequestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  resetButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  resetButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  priceRequestTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 20,
  },
  priceRequestContent: {
    gap: 16,
  },
  priceRequestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceRequestLabel: {
    fontSize: 14,
    color: '#4B5563',
    flex: 1,
  },
  priceRequestValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  priceRequestTypeContainer: {
    flexDirection: 'row',
    gap: 8,
    flex: 1,
  },
  priceRequestTypeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  priceRequestTypeButtonActive: {
    backgroundColor: '#4A90E2',
  },
  priceRequestTypeText: {
    fontSize: 14,
    color: '#4B5563',
  },
  priceRequestTypeTextActive: {
    color: 'white',
  },
  priceRequestInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 6,
    paddingHorizontal: 12,
    marginLeft: 12,
    fontSize: 16,
  },
  calculatedPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 6,
  },
  calculatedPriceLabel: {
    fontSize: 14,
    color: '#4B5563',
  },
  calculatedPriceValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  priceRequestActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 20,
  },
  priceRequestButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
  },
  priceRequestSubmitButton: {
    backgroundColor: '#4A90E2',
  },
  priceRequestButtonText: {
    fontSize: 14,
    color: '#4B5563',
  },
  priceRequestSubmitButtonText: {
    color: 'white',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  priceRequestResetButton: {
    backgroundColor: '#FEE2E2',
  },
  priceRequestResetButtonText: {
    color: '#EF4444',
  },
  remarksInput: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 8,
  },
});

export default CreateOrderScreen; 