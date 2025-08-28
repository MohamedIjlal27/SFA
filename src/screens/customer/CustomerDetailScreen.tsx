import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Dimensions,
  ScaledSize,
  FlatList,
  TextInput,
  Modal,
  TouchableWithoutFeedback,
  Animated,
  Alert,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { customerDetailService, CustomerDetailsResponse } from '../../services/customerDetailService';
import { directionService } from '../../services/directionService';

type Props = NativeStackScreenProps<RootStackParamList, 'CustomerDetail'>;

const isTablet = (dimensions: ScaledSize) => Math.min(dimensions.width, dimensions.height) >= 768;
const isLandscape = (dimensions: ScaledSize) => dimensions.width > dimensions.height;

// Transaction interface
interface Transaction {
  documentNo: string;
  docDate: string;
  docAmount: number;
  daysDue: number | null;
  docType: string;
  dueAmount: number;
  exeId: string;
  "Ref No": string;
  selected?: boolean;
  hasComment?: boolean;
  comment?: string;
}

// Add the Note interface after the Transaction interface
interface Note {
  id: string;
  text: string;
  createdBy: string;
  designation: string;
  createdAt: string;
}

// Add Order interface after the Note interface
interface Order {
  id: string;
  orderNo: string;
  orderDate: string;
  totalAmount: number;
  status: 'draft' | 'posted';
  items: OrderItem[];
}

interface OrderItem {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

// Add Reason interface
interface Reason {
  id: string;
  label: string;
}

const reasons: Reason[] = [
  { id: '1', label: 'Shop Closed' },
  { id: '2', label: 'Owner Not Available in the shop' },
  { id: '3', label: 'Outlet Payment Issue' },
  { id: '4', label: 'No order from retailer' },
  { id: '5', label: 'Low bill value' },
  { id: '6', label: 'Duplicate order' },
  { id: '7', label: 'Other' },
];

// Empty arrays for data that will be loaded from API
const mockOrders: Order[] = [];

const CustomerDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));
  const [customerDetails, setCustomerDetails] = useState<CustomerDetailsResponse | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [showDueList, setShowDueList] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectionMode, setSelectionMode] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [currentTransaction, setCurrentTransaction] = useState<Transaction | null>(null);
  const [commentText, setCommentText] = useState('');
  const [isReminderEnabled, setIsReminderEnabled] = useState(false);
  const [reminderDate, setReminderDate] = useState(new Date());
  const bottomSheetAnim = useRef(new Animated.Value(0)).current;
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [newNoteText, setNewNoteText] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [showOrdersSheet, setShowOrdersSheet] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const ordersSheetAnim = useRef(new Animated.Value(0)).current;
  const [selectedAgeBucket, setSelectedAgeBucket] = useState<string | null>(null);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [distance, setDistance] = useState<string | null>(null);
  const [isLoadingDistance, setIsLoadingDistance] = useState(false);
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [selectedReason, setSelectedReason] = useState<Reason | null>(null);
  const [reasonRemarks, setReasonRemarks] = useState('');

  const ageBuckets = [
    { label: '0-30', value: '0-30' },
    { label: '31-60', value: '31-60' },
    { label: '61-90', value: '61-90' },
    { label: '91-120', value: '91-120' },
    { label: '>120', value: '>120' },
  ];

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });

    loadCustomerDetails();
    loadOrders();
    loadNotes();

    return () => subscription?.remove();
  }, []);

  useEffect(() => {
    if (customerDetails?.result?.location) {
      fetchDistance(customerDetails.result.location);
    }
  }, [customerDetails]);

  const fetchDistance = async (location: string) => {
    if (!location) return;
    
    try {
      setIsLoadingDistance(true);
      const distanceText = await directionService.getDistance(location);
      setDistance(distanceText);
    } catch (error) {
      console.error('Error fetching distance:', error);
    } finally {
      setIsLoadingDistance(false);
    }
  };

  const loadCustomerDetails = async () => {
    const customerId = route.params?.customerId;
    if (!customerId) return;

    try {
      setIsLoading(true);
      // Try to get from local storage first
      const localData = await customerDetailService.getCustomerDetails(customerId);
      if (localData) {
        // Process the data to ensure proper formatting
        processCustomerData(localData);
      }

      // Get last sync time
      const lastSync = await customerDetailService.getLastSyncTime();
      setLastSyncTime(lastSync);

      // If no local data or force sync, sync from API
      if (!localData) {
        await syncData();
      }
    } catch (error) {
      console.error('Error loading customer details:', error);
      Alert.alert('Error', 'Failed to load customer details');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to process customer data
  const processCustomerData = (data: CustomerDetailsResponse) => {
    // Set customer details
    setCustomerDetails(data);
    
    // Process transactions to trim whitespace and add selected/hasComment flags
    const processedTransactions = data.overdueInvoices.map(invoice => ({
      ...invoice,
      // Trim whitespace from string fields if needed
      documentNo: typeof invoice.documentNo === 'string' ? invoice.documentNo.trim() : invoice.documentNo,
      exeId: typeof invoice.exeId === 'string' ? invoice.exeId.trim() : invoice.exeId,
      "Ref No": typeof invoice["Ref No"] === 'string' ? invoice["Ref No"].trim() : invoice["Ref No"],
      // Add UI state properties
      selected: false,
      hasComment: false
    }));
    
    setTransactions(processedTransactions);
  };

  const syncData = async () => {
    const customerId = route.params?.customerId;
    if (!customerId) return;

    try {
      setIsSyncing(true);
      const data = await customerDetailService.syncCustomerDetails(customerId);
      if (data) {
        // Process the data to ensure proper formatting
        processCustomerData(data);
        
        // Update last sync time
        const lastSync = await customerDetailService.getLastSyncTime();
        setLastSyncTime(lastSync);
        
        // Fetch distance if location is available
        if (data.result.location) {
          fetchDistance(data.result.location);
        }
      }
    } catch (error) {
      console.error('Error syncing customer details:', error);
      Alert.alert('Error', 'Failed to sync customer details');
    } finally {
      setIsSyncing(false);
    }
  };

  // Add a function to load orders from the API
  const loadOrders = async () => {
    const customerId = route.params?.customerId;
    if (!customerId) return;
    
    try {
      // In a real app, this would call an API to get orders for this customer
      // Example API call:
      // const response = await api.get(`/api/orders/customer/${customerId}`);
      // setOrders(response.data);
      
      // For now, we'll just set an empty array
      setOrders([]);
    } catch (error) {
      console.error('Error loading orders:', error);
    }
  };

  // Add a function to load notes from the API
  const loadNotes = async () => {
    const customerId = route.params?.customerId;
    if (!customerId) return;
    
    try {
      // In a real app, this would call an API to get notes for this customer
      // Example API call:
      // const response = await api.get(`/api/notes/customer/${customerId}`);
      // setNotes(response.data);
      
      // For now, we'll just set an empty array
      setNotes([]);
    } catch (error) {
      console.error('Error loading notes:', error);
    }
  };

  useEffect(() => {
    if (showDueList) {
      Animated.timing(bottomSheetAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(bottomSheetAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [showDueList]);

  useEffect(() => {
    if (showOrdersSheet) {
      Animated.timing(ordersSheetAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(ordersSheetAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [showOrdersSheet]);

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (text.trim() === '') {
      setTransactions(customerDetails?.overdueInvoices.map(invoice => ({
        ...invoice,
        selected: false,
        hasComment: false
      })) || []);
    } else {
      const filtered = (customerDetails?.overdueInvoices || []).filter(
        item => 
          item.documentNo.toLowerCase().includes(text.toLowerCase()) ||
          item.exeId.toLowerCase().includes(text.toLowerCase()) ||
          item["Ref No"].toLowerCase().includes(text.toLowerCase())
      ).map(invoice => ({
        ...invoice,
        selected: false,
        hasComment: false
      }));
      setTransactions(filtered);
    }
  };

  const sortTransactionsByDate = () => {
    const sorted = [...transactions].sort((a, b) => {
      return new Date(b.docDate).getTime() - new Date(a.docDate).getTime();
    });
    setTransactions(sorted);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return `${date.getDate()}-${date.toLocaleString('default', { month: 'short' })}-${date.getFullYear()}`;
  };

  const formatCurrency = (amount: number): string => {
    return amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const styles = createStyles(dimensions);

  const translateY = bottomSheetAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [dimensions.height, 0],
  });

  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    // Reset all selections when toggling off
    if (selectionMode) {
      setTransactions(transactions.map(t => ({ ...t, selected: false })));
    }
  };

  const toggleSelection = (documentNo: string) => {
    setTransactions(
      transactions.map(t => 
        t.documentNo === documentNo 
          ? { ...t, selected: !t.selected } 
          : t
      )
    );
  };

  const getSelectedTotal = () => {
    return transactions
      .filter(t => t.selected)
      .reduce((sum, t) => sum + t.dueAmount, 0);
  };

  const handleCommentPress = (transaction: Transaction) => {
    setCurrentTransaction(transaction);
    setCommentText(transaction.comment || '');
    setIsReminderEnabled(false);
    setReminderDate(new Date());
    setShowCommentModal(true);
  };

  const saveComment = () => {
    if (currentTransaction) {
      setTransactions(
        transactions.map(t => 
          t.documentNo === currentTransaction.documentNo 
            ? { 
                ...t, 
                hasComment: commentText.trim() !== '', 
                comment: commentText.trim() 
              } 
            : t
        )
      );
    }
    setShowCommentModal(false);
  };

  const handleReceivePayment = () => {
    // In a real app, this would open a payment processing flow
    Alert.alert(
      'Payment Processing',
      `Processing payment of ${formatCurrency(getSelectedTotal())} for ${transactions.filter(t => t.selected).length} invoices`
    );
    
    // Reset selections after payment
    setTransactions(transactions.map(t => ({ ...t, selected: false })));
    setSelectionMode(false);
  };

  // Add function to handle adding a new note
  const addNote = () => {
    if (newNoteText.trim() === '') return;
    
    const newNote: Note = {
      id: `note${Date.now()}`,
      text: newNoteText,
      createdBy: "Current User", // In a real app, get from auth context
      designation: "Sales Executive", // In a real app, get from auth context
      createdAt: new Date().toISOString()
    };
    
    setNotes([newNote, ...notes]);
    setNewNoteText('');
    setShowNotesModal(false);
  };

  // Add these functions after the addNote function
  const handleEditOrder = (order: Order) => {
    setSelectedOrder(order);
    // In a real app, this would navigate to an order edit screen
    Alert.alert(
      "Edit Order",
      `Editing order ${order.orderNo} with total amount ${formatCurrency(order.totalAmount)}`,
      [{ text: "OK" }]
    );
  };

  const handleCreateOrder = () => {
    navigation.navigate('CreateOrder', {
      customerId: customerDetails?.result.customerId || '',
      customerName: customerDetails?.result.customerName || ''
    });
  };

  const handlePostOrder = (order: Order) => {
    // In a real app, this would call an API to post the order
    Alert.alert(
      "Post Order",
      `Posting order ${order.orderNo} with total amount ${formatCurrency(order.totalAmount)}`,
      [{ text: "OK" }]
    );
  };

  const getAddress = () => {
    if (!customerDetails) return '';
    const { result } = customerDetails;
    return [result.address1, result.address2, result.address3, result.city]
      .filter(Boolean)
      .join(', ');
  };

  const getPhoneNumbers = () => {
    if (!customerDetails) return '';
    const { result } = customerDetails;
    return [result.telephone1, result.telephone2]
      .filter(Boolean)
      .join(' | ');
  };

  const getCreditUsagePercentage = () => {
    if (!customerDetails) return 0;
    const { result, balanceDue } = customerDetails;
    const used = balanceDue;
    const total = result.creditLimit;
    return Math.min(100, Math.max(0, (used / total) * 100));
  };

  const CreditRemainingCard = () => {
    const creditLimit = customerDetails?.result.creditLimit || 0;
    const balanceDue = customerDetails?.balanceDue || 0;
    const remaining = creditLimit - balanceDue;
    const percentage = (balanceDue / creditLimit) * 100;

    const getProgressColor = () => {
      if (percentage >= 100) return '#EF4444';
      if (percentage >= 75) return '#F59E0B';
      return '#10B981';
    };

    return (
      <View style={styles.infoCard}>
        <View style={styles.infoCardIconContainer}>
          <Text style={styles.infoCardIcon}>💰</Text>
        </View>
        <Text style={styles.infoCardTitle}>Credit Limit</Text>
        <Text style={styles.infoCardValue}>{formatCurrency(creditLimit)}</Text>
        <Text style={styles.infoCardSubtitle}>Remaining: {formatCurrency(remaining)}</Text>
        <Text style={[styles.creditPercentage, { color: getProgressColor() }]}>
          {percentage.toFixed(1)}% Used
        </Text>
        <View style={styles.progressBarContainer}>
          <View 
            style={[
              styles.progressBar,
              { 
                width: `${Math.min(percentage, 100)}%`,
                backgroundColor: getProgressColor()
              }
            ]} 
          />
        </View>
      </View>
    );
  };

  // Profile Modal
  const ProfileModal = () => (
    <Modal
      visible={showProfileModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowProfileModal(false)}
    >
      <TouchableWithoutFeedback onPress={() => setShowProfileModal(false)}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={e => e.stopPropagation()}>
            <View style={styles.profileModal}>
              <View style={styles.profileModalHeader}>
                <Text style={styles.profileModalTitle}>Customer Profile</Text>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={() => setShowProfileModal(false)}
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
              
              {customerDetails && (
                <View style={styles.profileContent}>
                  <View style={styles.profileField}>
                    <Text style={styles.profileLabel}>Contact Name</Text>
                    <Text style={styles.profileValue}>{customerDetails.result.contactName || 'N/A'}</Text>
                  </View>
                  <View style={styles.profileField}>
                    <Text style={styles.profileLabel}>Contact Phone</Text>
                    <Text style={styles.profileValue}>{getPhoneNumbers()}</Text>
                  </View>
                  <View style={styles.profileField}>
                    <Text style={styles.profileLabel}>Phone Numbers</Text>
                    <Text style={styles.profileValue}>{getPhoneNumbers()}</Text>
                  </View>
                  <View style={styles.profileField}>
                    <Text style={styles.profileLabel}>Address</Text>
                    <Text style={styles.profileValue}>{getAddress()}</Text>
                  </View>
                </View>
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );

  const getFilteredTransactions = () => {
    let filtered = transactions;
    
    if (searchQuery) {
      filtered = filtered.filter(transaction =>
        transaction.documentNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        transaction["Ref No"].toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedAgeBucket) {
      filtered = filtered.filter(transaction => {
        if (!transaction.daysDue) return false;
        
        switch (selectedAgeBucket) {
          case '0-30':
            return transaction.daysDue >= 0 && transaction.daysDue <= 30;
          case '31-60':
            return transaction.daysDue >= 31 && transaction.daysDue <= 60;
          case '61-90':
            return transaction.daysDue >= 61 && transaction.daysDue <= 90;
          case '91-120':
            return transaction.daysDue >= 91 && transaction.daysDue <= 120;
          case '>120':
            return transaction.daysDue > 120;
          default:
            return true;
        }
      });
    }

    return filtered;
  };

  const getFilteredTotal = () => {
    return getFilteredTransactions().reduce((sum, transaction) => sum + transaction.dueAmount, 0);
  };

  const handleReasonSubmit = () => {
    if (!selectedReason) {
      Alert.alert('Error', 'Please select a reason');
      return;
    }

    Alert.alert(
      'Confirm Submission',
      'Are you sure you want to submit this reason?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Submit',
          onPress: () => {
            // Here you would typically make an API call to save the reason
            console.log('Reason submitted:', {
              reason: selectedReason.label,
              remarks: reasonRemarks
            });
            
            // Reset and close modal
            setSelectedReason(null);
            setReasonRemarks('');
            setShowReasonModal(false);
          }
        }
      ]
    );
  };

  const renderReasonModal = () => (
    <Modal
      visible={showReasonModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowReasonModal(false)}
    >
      <TouchableWithoutFeedback onPress={() => setShowReasonModal(false)}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={styles.reasonModalContent}>
              <Text style={styles.reasonModalTitle}>Select Reason</Text>
              
              <ScrollView style={styles.reasonList}>
                {reasons.map((reason) => (
                  <TouchableOpacity
                    key={reason.id}
                    style={[
                      styles.reasonItem,
                      selectedReason?.id === reason.id && styles.reasonItemSelected
                    ]}
                    onPress={() => setSelectedReason(reason)}
                  >
                    <Text style={[
                      styles.reasonItemText,
                      selectedReason?.id === reason.id && styles.reasonItemTextSelected
                    ]}>{reason.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TextInput
                style={styles.remarksInput}
                placeholder="Enter remarks"
                value={reasonRemarks}
                onChangeText={setReasonRemarks}
                multiline={true}
                numberOfLines={3}
              />

              <View style={styles.reasonModalActions}>
                <TouchableOpacity
                  style={[styles.reasonModalButton, styles.reasonModalCancelButton]}
                  onPress={() => setShowReasonModal(false)}
                >
                  <Text style={styles.reasonModalCancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.reasonModalButton, styles.reasonModalSubmitButton]}
                  onPress={handleReasonSubmit}
                >
                  <Text style={styles.reasonModalSubmitButtonText}>Submit</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );

  if (!customerDetails) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text style={styles.loadingText}>Loading customer details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const InfoCard = ({ title, value, icon }: { title: string; value: string | number, icon: string }) => (
    <View style={styles.infoCard}>
      <View style={styles.infoCardIconContainer}>
        <Text style={styles.infoCardIcon}>{icon}</Text>
      </View>
      <Text style={styles.infoCardTitle}>{title}</Text>
      <Text style={styles.infoCardValue}>{value}</Text>
    </View>
  );

  const AgeingCard = ({ title, value, index }: { title: string; value: number; index: number }) => {
    // Determine risk level based on ageing period
    // Higher index means higher risk
    const getRiskColor = () => {
      switch(index) {
        case 0: return '#4CD4C0'; // Low risk - teal
        case 1: return '#4A90E2'; // Low-medium risk - blue
        case 2: return '#9B59B6'; // Medium risk - purple
        case 3: return '#F1C40F'; // Medium-high risk - yellow
        case 4: return '#E67E22'; // High risk - orange
        case 5: return '#E74C3C'; // Very high risk - red
        case 6: return '#C0392B'; // Extreme risk - dark red
        default: return '#4CD4C0';
      }
    };
    
    return (
      <View style={[styles.ageingCard, { borderTopColor: getRiskColor() }]}>
        <Text style={styles.ageingCardTitle}>{title}</Text>
        <Text style={styles.ageingCardValue}>{formatCurrency(value)}</Text>
      </View>
    );
  };

  const ActionButton = ({ title, icon, type, onPress }: { title: string; icon: string; type: 'sales' | 'marketing'; onPress?: () => void }) => {
    const gradientColors = type === 'sales' 
      ? ['#4CD4C0', '#4A90E2']
      : ['#34D399', '#10B983'];

    const handlePress = () => {
      if (onPress) {
        onPress();
      } else {
        switch (title) {
          case 'Create Order':
            handleCreateOrder();
            break;
          // Add other cases as needed
        }
      }
    };
    
    return (
      <TouchableOpacity 
        style={styles.actionButton}
        onPress={handlePress}
      >
        <LinearGradient
          colors={gradientColors}
          style={styles.actionButtonGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Text style={styles.actionButtonIcon}>{icon}</Text>
          <Text style={styles.actionButtonText}>{title}</Text>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      {/* Header with Back Button, Location Button, and Sync Button */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        
        {/* Location Button */}
        {customerDetails && (
          <TouchableOpacity
            style={[
              styles.locationButton,
              !customerDetails.result.location ? styles.noLocationButton : styles.hasLocationButton
            ]}
            onPress={() => {
              if (customerDetails.result.location) {
                // Refresh distance
                fetchDistance(customerDetails.result.location);
              } else {
                Alert.alert('No Location', 'This customer has no location set.');
              }
            }}
          >
            {isLoadingDistance ? (
              <ActivityIndicator color="white" size="small" />
            ) : !customerDetails.result.location ? (
              <Text style={styles.locationButtonText}>No Location Set</Text>
            ) : (
              <Text style={styles.locationButtonText}>
                {distance ? `You're ${distance} away` : 'Check Distance'}
              </Text>
            )}
          </TouchableOpacity>
        )}
        
        <View style={styles.headerRight}>
          <Text style={styles.syncTimeText}>
            Last synced: {lastSyncTime ? formatDate(lastSyncTime) : 'Never'}
          </Text>
          <TouchableOpacity
            style={[styles.syncButton, isSyncing && styles.syncButtonDisabled]}
            onPress={syncData}
            disabled={isSyncing}
          >
            {isSyncing ? (
              <ActivityIndicator color="#4A90E2" size="small" />
            ) : (
              <Text style={styles.syncButtonText}>↻ Sync</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Customer Info Card */}
      {customerDetails && (
        <LinearGradient
          colors={['#2C3E50', '#34495E']}
          style={styles.customerCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <View style={styles.customerCardContent}>
            <View style={styles.customerInfo}>
              <Text style={styles.customerID}>{customerDetails.result.customerId}</Text>
              <Text style={styles.customerName}>{customerDetails.result.customerName}</Text>
              
              <View style={styles.detailRow}>
                <View style={styles.iconContainer}>
                  <Text style={styles.icon}>📍</Text>
                </View>
                <Text style={styles.detailText}>{getAddress()}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <View style={styles.iconContainer}>
                  <Text style={styles.icon}>📞</Text>
                </View>
                <Text style={styles.detailText}>{getPhoneNumbers()}</Text>
              </View>
            </View>
            
            <View style={styles.customerActions}>
              <TouchableOpacity 
                style={styles.customerActionButton}
                onPress={() => setShowProfileModal(true)}
              >
                <Text style={styles.customerActionIcon}>👤</Text>
                <Text style={styles.customerActionText}>Profile</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.customerActionButton}>
                <Text style={styles.customerActionIcon}>📄</Text>
                <Text style={styles.customerActionText}>Documents</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.customerActionButton}
                onPress={() => setShowNotesModal(true)}
              >
                <Text style={styles.customerActionIcon}>📝</Text>
                {notes.length > 0 && <View style={styles.noteDotIndicator} />}
                <Text style={styles.customerActionText}>Notes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      )}

      <ScrollView style={styles.scrollView}>
        {/* General Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>GENERAL INFORMATION</Text>
          <View style={styles.infoCardsContainer}>
            <InfoCard 
              title="Customer Since" 
              value={formatDate(customerDetails.result.startDate)} 
              icon="📅" 
            />
            <CreditRemainingCard />
            <InfoCard 
              title="Credit Period" 
              value={`${customerDetails.result.creditPeriod} Days`} 
              icon="⏱️" 
            />
            <InfoCard 
              title="R/C Amount" 
              value="0.00" 
              icon="📊" 
            />
            <InfoCard 
              title="Due Amount" 
              value={formatCurrency(customerDetails.balanceDue)} 
              icon="⚠️" 
            />
          </View>
        </View>
        
        {/* Credit Ageing */}
        {customerDetails && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>CREDIT AGEING</Text>
              <TouchableOpacity 
                style={styles.viewDueListButton}
                onPress={() => setShowDueList(true)}
              >
                <Text style={styles.viewDueListText}>View Due List</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.ageingCardsContainer}>
              <AgeingCard title="0-30 days" value={customerDetails.ageing["0-30"]} index={0} />
              <AgeingCard title="31-60 days" value={customerDetails.ageing["31-60"]} index={1} />
              <AgeingCard title="61-90 days" value={customerDetails.ageing["61-90"]} index={2} />
              <AgeingCard title="91-120 days" value={customerDetails.ageing["91-120"]} index={3} />
              <AgeingCard title="> 120 days" value={customerDetails.ageing[">120"]} index={4} />
            </View>
          </View>
        )}
        
        {/* Sales Actions */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderWithIcon}>
            <View style={styles.sectionTitleContainer}>
              <Text style={styles.sectionTitle}>SALES ACTIONS</Text>
            </View>
          </View>
          
          <View style={[styles.actionButtonsContainer, styles.salesActionsContainer]}>
            <ActionButton title="Create Order" icon="📝" type="sales" />
            <ActionButton 
              title="Enter Reason" 
              icon="📝" 
              type="sales"
              onPress={() => setShowReasonModal(true)} 
            />
            <ActionButton title="Collect Payment" icon="💵" type="sales" />
            <ActionButton title="Collect Return Goods" icon="📦" type="sales" />
            <ActionButton title="Check Inventory" icon="🔍" type="sales" />
          </View>
        </View>
        
        {/* Marketing Actions */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderWithIcon}>
            <View style={styles.sectionTitleContainer}>
              <Text style={styles.sectionTitle}>MARKETING ACTIONS</Text>
            </View>
          </View>
          
          <View style={[styles.actionButtonsContainer, styles.marketingActionsContainer]}>
            <ActionButton title="Issue Merchandise" icon="🎁" type="marketing" />
            <ActionButton title="Market Feedbacks" icon="📣" type="marketing" />
            <ActionButton title="Gallery" icon="🖼️" type="marketing" />
            <ActionButton title="Promotions" icon="🏷️" type="marketing" />
            <ActionButton title="Customer Survey" icon="📋" type="marketing" />
          </View>
        </View>
      </ScrollView>

      {/* Profile Modal */}
      <ProfileModal />
      
      {/* Due List Bottom Sheet */}
      <Modal
        visible={showDueList}
        transparent={true}
        animationType="none"
        onRequestClose={() => setShowDueList(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowDueList(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={e => e.stopPropagation()}>
              <Animated.View 
                style={[
                  styles.bottomSheet,
                  { transform: [{ translateY }] }
                ]}
              >
                <View style={styles.bottomSheetHeader}>
                  <Text style={styles.bottomSheetTitle}>Due List</Text>
                  <View style={styles.headerActions}>
                    <TouchableOpacity 
                      style={[
                        styles.selectionModeButton,
                        selectionMode && styles.selectionModeButtonActive
                      ]}
                      onPress={toggleSelectionMode}
                    >
                      <Text style={[
                        styles.selectionModeButtonText,
                        selectionMode && styles.selectionModeButtonTextActive
                      ]}>
                        {selectionMode ? 'Exit Selection Mode' : 'Select Items'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.closeButton}
                      onPress={() => setShowDueList(false)}
                    >
                      <Text style={styles.closeButtonText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                
                {selectionMode && getSelectedTotal() > 0 && (
                  <View style={styles.selectionSummary}>
                    <View>
                      <Text style={styles.selectionCountText}>
                        {transactions.filter(t => t.selected).length} items selected
                      </Text>
                      <Text style={styles.selectionTotalText}>
                        {formatCurrency(getSelectedTotal())}
                      </Text>
                    </View>
                    <TouchableOpacity 
                      style={styles.receivePaymentButton}
                      onPress={handleReceivePayment}
                    >
                      <Text style={styles.receivePaymentText}>Receive Payment</Text>
                    </TouchableOpacity>
                  </View>
                )}
                
                <View style={styles.searchContainer}>
                  <View style={styles.searchInputContainer}>
                    <Text style={styles.searchIcon}>🔍</Text>
                    <TextInput
                      style={styles.searchInput}
                      placeholder="Search by document no. or reference"
                      value={searchQuery}
                      onChangeText={handleSearch}
                    />
                  </View>
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    style={styles.filterTagsContainer}
                  >
                    {ageBuckets.map((bucket) => (
                      <TouchableOpacity
                        key={bucket.value}
                        style={[
                          styles.filterTag,
                          selectedAgeBucket === bucket.value && styles.filterTagSelected
                        ]}
                        onPress={() => setSelectedAgeBucket(
                          selectedAgeBucket === bucket.value ? null : bucket.value
                        )}
                      >
                        <Text style={[
                          styles.filterTagText,
                          selectedAgeBucket === bucket.value && styles.filterTagTextSelected
                        ]}>
                          {bucket.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
                
                {/* Due List Table */}
                <View style={styles.tableContainer}>
                  <View style={styles.tableHeader}>
                    {selectionMode && (
                      <Text style={[styles.tableHeaderCell, { flex: 0.5 }]}></Text>
                    )}
                    <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Document No</Text>
                    <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Date</Text>
                    <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Doc Amount</Text>
                    <Text style={[styles.tableHeaderCell, { flex: 1, backgroundColor: '#EBF5FF' }]}>Due Amount</Text>
                    <Text style={[styles.tableHeaderCell, { flex: 0.8 }]}>Days Due</Text>
                    <Text style={[styles.tableHeaderCell, { flex: 0.8 }]}>Type</Text>
                    <Text style={[styles.tableHeaderCell, { flex: 0.8 }]}>Exec ID</Text>
                    <Text style={[styles.tableHeaderCell, { flex: 0.3 }]}>Action</Text>
                  </View>
                  
                  <FlatList
                    data={getFilteredTransactions()}
                    keyExtractor={(item) => item.documentNo}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        onPress={() => {
                          if (selectionMode) {
                            // Toggle selection when in selection mode
                            toggleSelection(item.documentNo);
                          } else {
                            // Open transaction modal when not in selection mode
                            setCurrentTransaction(item);
                            setShowTransactionModal(true);
                          }
                        }}
                        activeOpacity={0.7}
                        style={item.selected ? { backgroundColor: 'rgba(37, 99, 235, 0.1)' } : null}
                      >
                        <View style={[
                          styles.tableRow,
                          (item.daysDue ?? 0) > 90 ? styles.overdueRow : null,
                          item.selected ? styles.selectedRow : null
                        ]}>
                          {selectionMode && (
                            <TouchableOpacity 
                              style={[styles.tableCell, { flex: 0.5, alignItems: 'center', justifyContent: 'center' }]}
                              onPress={(e) => {
                                e.stopPropagation();
                                toggleSelection(item.documentNo);
                              }}
                              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                              <View style={[
                                styles.checkbox,
                                item.selected && styles.checkboxSelected
                              ]}>
                                {item.selected && <View style={styles.checkboxInner} />}
                              </View>
                            </TouchableOpacity>
                          )}
                          <Text style={[styles.tableCell, { flex: 1.5 }]}>{item.documentNo}</Text>
                          <Text style={[styles.tableCell, { flex: 1 }]}>{formatDate(item.docDate)}</Text>
                          <Text style={[styles.tableCell, { flex: 1, textAlign: 'right', paddingRight: 8 }]}>{formatCurrency(item.docAmount)}</Text>
                          <Text style={[styles.tableCell, { flex: 1, backgroundColor: '#F0F9FF', textAlign: 'right', paddingRight: 8 }]}>{formatCurrency(item.dueAmount)}</Text>
                          <Text style={[
                            styles.tableCell,
                            { flex: 0.8 },
                            (item.daysDue ?? 0) > 90 ? styles.overdueText : null
                          ]}>{item.daysDue ?? 'N/A'}</Text>
                          <Text style={[styles.tableCell, { flex: 0.8 }]}>{item.docType}</Text>
                          <Text style={[styles.tableCell, { flex: 0.8 }]}>{item.exeId}</Text>
                          <TouchableOpacity 
                            style={[styles.tableActionButton, { flex: 0.3 }]}
                            onPress={() => handleCommentPress(item)}
                          >
                            <Text style={styles.tableActionButtonText}>
                              {item.hasComment ? '👁️' : '📝'}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </TouchableOpacity>
                    )}
                  />
                </View>
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
      
      {/* Comment Modal */}
      <Modal
        visible={showCommentModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCommentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.commentModal}>
            <View style={styles.commentModalHeader}>
              <Text style={styles.commentModalTitle}>
                {currentTransaction?.hasComment ? 'View/Edit Comment' : 'Add Comment'}
              </Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowCommentModal(false)}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <Text style={styles.commentDocumentLabel}>Document No:</Text>
            <Text style={styles.commentDocumentNo}>{currentTransaction?.documentNo}</Text>
            
            <Text style={styles.commentLabel}>Notes:</Text>
            <TextInput
              style={styles.commentInput}
              multiline
              value={commentText}
              onChangeText={setCommentText}
              placeholder="Enter notes or reminders about this transaction"
            />
            
            <View style={styles.reminderContainer}>
              <View style={styles.reminderToggleContainer}>
                <Text style={styles.reminderLabel}>Set Reminder</Text>
                <TouchableOpacity 
                  style={[
                    styles.reminderToggle,
                    isReminderEnabled ? styles.reminderToggleActive : null
                  ]}
                  onPress={() => setIsReminderEnabled(!isReminderEnabled)}
                >
                  <View style={[
                    styles.reminderToggleHandle,
                    isReminderEnabled ? styles.reminderToggleHandleActive : null
                  ]} />
                </TouchableOpacity>
              </View>
              
              {isReminderEnabled && (
                <View style={styles.datePickerContainer}>
                  <Text style={styles.datePickerLabel}>Reminder Date:</Text>
                  <TouchableOpacity style={styles.datePicker}>
                    <Text style={styles.datePickerText}>
                      {reminderDate.toLocaleDateString()}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
            
            <View style={styles.commentModalActions}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowCommentModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.saveButton}
                onPress={saveComment}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Notes Modal */}
      <Modal
        visible={showNotesModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowNotesModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowNotesModal(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={e => e.stopPropagation()}>
              <View style={styles.notesModalContainer}>
                <View style={styles.notesModalHeader}>
                  <Text style={styles.notesModalTitle}>Customer Notes</Text>
                  <TouchableOpacity 
                    style={styles.closeButton}
                    onPress={() => setShowNotesModal(false)}
                  >
                    <Text style={styles.closeButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
                
                {/* Add new note section */}
                <View style={styles.addNoteContainer}>
                  <TextInput
                    style={styles.addNoteInput}
                    placeholder="Add a new note..."
                    value={newNoteText}
                    onChangeText={setNewNoteText}
                    multiline
                  />
                  <TouchableOpacity 
                    style={[
                      styles.addNoteButton,
                      newNoteText.trim() === '' && styles.addNoteButtonDisabled
                    ]}
                    onPress={addNote}
                    disabled={newNoteText.trim() === ''}
                  >
                    <Text style={styles.addNoteButtonText}>Add Note</Text>
                  </TouchableOpacity>
                </View>
                
                {/* Notes list */}
                <FlatList
                  data={notes}
                  keyExtractor={item => item.id}
                  renderItem={({ item }) => (
                    <View style={styles.noteItem}>
                      <View style={styles.noteHeader}>
                        <Text style={styles.noteAuthor}>{item.createdBy}</Text>
                        <Text style={styles.noteDesignation}>{item.designation}</Text>
                        <Text style={styles.noteDate}>
                          {formatDate(item.createdAt)}
                        </Text>
                      </View>
                      <Text style={styles.noteText}>{item.text}</Text>
                    </View>
                  )}
                  ListEmptyComponent={
                    <Text style={styles.emptyNotesText}>No notes available</Text>
                  }
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Orders Bottom Sheet */}
      <Modal
        visible={showOrdersSheet}
        transparent={true}
        animationType="none"
        onRequestClose={() => setShowOrdersSheet(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowOrdersSheet(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={e => e.stopPropagation()}>
              <Animated.View 
                style={[
                  styles.bottomSheet,
                  { 
                    transform: [{ 
                      translateY: ordersSheetAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [600, 0]
                      }) 
                    }] 
                  }
                ]}
              >
                <View style={styles.bottomSheetHeader}>
                  <Text style={styles.bottomSheetTitle}>Open Orders</Text>
                  <TouchableOpacity 
                    style={styles.closeButton}
                    onPress={() => setShowOrdersSheet(false)}
                  >
                    <Text style={styles.closeButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
                
                {/* New Order Button */}
                <TouchableOpacity 
                  style={styles.newOrderButtonLarge}
                  onPress={handleCreateOrder}
                >
                  <Text style={styles.newOrderButtonText}>+ New Order</Text>
                </TouchableOpacity>
                
                {/* Orders List */}
                {orders.length > 0 ? (
                  <ScrollView style={styles.ordersScrollView}>
                    {orders.map(order => (
                      <View key={order.id} style={styles.orderSimpleCard}>
                        <View style={styles.orderSimpleHeader}>
                          <View>
                            <Text style={styles.orderNumber}>{order.orderNo}</Text>
                            <Text style={styles.orderDate}>{formatDate(order.orderDate)}</Text>
                          </View>
                          <Text style={styles.orderAmount}>{formatCurrency(order.totalAmount)}</Text>
                        </View>
                        
                        <View style={styles.orderActions}>
                          <TouchableOpacity 
                            style={styles.editOrderButton}
                            onPress={() => handleEditOrder(order)}
                          >
                            <Text style={styles.editOrderButtonText}>Edit</Text>
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={styles.postOrderButton}
                            onPress={() => handlePostOrder(order)}
                          >
                            <Text style={styles.postOrderButtonText}>Post Order</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </ScrollView>
                ) : (
                  <View style={styles.emptyOrdersContainer}>
                    <Text style={styles.emptyOrdersText}>No open orders</Text>
                  </View>
                )}
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Transaction Details Modal */}
      <Modal
        visible={showTransactionModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowTransactionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.transactionModal}>
            <View style={styles.transactionModalHeader}>
              <Text style={styles.transactionModalTitle}>Transaction Details</Text>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setShowTransactionModal(false)}
              >
                <Text style={styles.modalCloseButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            {currentTransaction && (
              <ScrollView style={styles.transactionModalContent}>
                {/* Basic Information */}
                <View style={styles.transactionDetailRow}>
                  <Text style={styles.transactionDetailLabel}>Document No</Text>
                  <Text style={styles.transactionDetailValue}>{currentTransaction.documentNo}</Text>
                </View>
                
                <View style={styles.transactionDetailRow}>
                  <Text style={styles.transactionDetailLabel}>Document Type</Text>
                  <Text style={styles.transactionDetailValue}>{currentTransaction.docType}</Text>
                </View>
                
                <View style={styles.transactionDetailRow}>
                  <Text style={styles.transactionDetailLabel}>Date</Text>
                  <Text style={styles.transactionDetailValue}>{formatDate(currentTransaction.docDate)}</Text>
                </View>
                
                <View style={styles.transactionDetailRow}>
                  <Text style={styles.transactionDetailLabel}>Document Amount</Text>
                  <Text style={styles.transactionDetailValue}>{formatCurrency(currentTransaction.docAmount)}</Text>
                </View>
                
                <View style={styles.transactionDetailRow}>
                  <Text style={styles.transactionDetailLabel}>Due Amount</Text>
                  <Text style={[
                    styles.transactionDetailValue,
                    currentTransaction.dueAmount > 0 && styles.overdueAmount
                  ]}>{formatCurrency(currentTransaction.dueAmount)}</Text>
                </View>
                
                <View style={styles.transactionDetailRow}>
                  <Text style={styles.transactionDetailLabel}>Days Due</Text>
                  <Text style={[
                    styles.transactionDetailValue,
                    (currentTransaction.daysDue ?? 0) > 90 && styles.overdueAmount
                  ]}>{currentTransaction.daysDue ?? 'N/A'}</Text>
                </View>
                
                <View style={styles.transactionDetailRow}>
                  <Text style={styles.transactionDetailLabel}>Executive ID</Text>
                  <Text style={styles.transactionDetailValue}>{currentTransaction.exeId}</Text>
                </View>
                
                <View style={styles.transactionDetailRow}>
                  <Text style={styles.transactionDetailLabel}>Reference No</Text>
                  <Text style={styles.transactionDetailValue}>{currentTransaction["Ref No"] || 'N/A'}</Text>
                </View>

                {/* Remarks Section */}
                <View style={styles.remarksSection}>
                  <View style={styles.remarksSectionHeader}>
                    <Text style={styles.remarksSectionTitle}>Remarks</Text>
                    <TouchableOpacity 
                      style={styles.addRemarkButton}
                      onPress={() => {
                        setShowTransactionModal(false);
                        handleCommentPress(currentTransaction);
                      }}
                    >
                      <Text style={styles.addRemarkButtonText}>
                        {currentTransaction.hasComment ? '✎ Edit Remarks' : '+ Add Remarks'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  
                  {currentTransaction.hasComment ? (
                    <View style={styles.remarkCard}>
                      <Text style={styles.remarkText}>{currentTransaction.comment}</Text>
                      <Text style={styles.remarkDate}>Last updated: {formatDate(currentTransaction.docDate)}</Text>
                    </View>
                  ) : (
                    <View style={styles.noRemarksContainer}>
                      <Text style={styles.noRemarksText}>No remarks added yet</Text>
                      <Text style={styles.noRemarksSubtext}>Click the button above to add remarks</Text>
                    </View>
                  )}
                </View>

                {/* Action Buttons */}
                <View style={styles.transactionActions}>
                  <TouchableOpacity 
                    style={[
                      styles.transactionActionButton,
                      currentTransaction.selected && styles.transactionActionButtonSelected
                    ]}
                    onPress={() => {
                      toggleSelection(currentTransaction.documentNo);
                      setShowTransactionModal(false);
                    }}
                  >
                    <Text style={[
                      styles.transactionActionButtonText,
                      currentTransaction.selected && styles.transactionActionButtonTextSelected
                    ]}>
                      {currentTransaction.selected ? 'Deselect' : 'Select for Payment'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Reason Modal */}
      {renderReasonModal()}
    </SafeAreaView>
  );
};

const createStyles = (dimensions: ScaledSize) => {
  const tablet = isTablet(dimensions);
  const landscape = isLandscape(dimensions);
  
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#F5F7FA',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#F5F7FA',
    },
    loadingText: {
      fontSize: 16,
      color: '#666',
      marginTop: 16,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: 50,
      paddingBottom: 16,
      backgroundColor: 'white',
      borderBottomWidth: 1,
      borderBottomColor: '#E0E0E0',
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#F3F4F6',
      justifyContent: 'center',
      alignItems: 'center',
    },
    backButtonText: {
      fontSize: 24,
      color: '#4B5563',
    },
    locationButton: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 6,
      marginLeft: 10,
    },
    noLocationButton: {
      backgroundColor: '#EF4444', // Red
    },
    hasLocationButton: {
      backgroundColor: '#4A90E2', // Blue
    },
    locationButtonText: {
      color: 'white',
      fontWeight: 'bold',
      fontSize: 14,
    },
    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
      marginLeft: 'auto',
    },
    syncTimeText: {
      fontSize: 12,
      color: '#666',
      marginRight: 8,
    },
    syncButton: {
      backgroundColor: '#4CD4C0',
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 8,
      marginRight: 8,
    },
    syncButtonDisabled: {
      backgroundColor: '#A0AEC0',
    },
    syncButtonText: {
      fontSize: 14,
      color: 'white',
      fontWeight: '500',
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#333',
    },
    customerCard: {
      marginHorizontal: 16,
      borderRadius: 16,
      overflow: 'hidden',
    },
    customerCardContent: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
    },
    customerInfo: {
      flex: 1,
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
      marginBottom: 12,
    },
    detailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    iconContainer: {
      width: 24,
      alignItems: 'center',
      marginRight: 8,
    },
    icon: {
      fontSize: 16,
      color: 'white',
    },
    detailText: {
      flex: 1,
      fontSize: 14,
      color: 'white',
    },
    customerActions: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    customerActionButton: {
      alignItems: 'center',
      marginLeft: 12,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: 8,
      padding: 8,
      width: 80,
      height: 80,
      justifyContent: 'center',
    },
    customerActionIcon: {
      fontSize: 24,
      color: 'white',
      marginBottom: 8,
    },
    customerActionText: {
      fontSize: 12,
      color: 'white',
      textAlign: 'center',
    },
    cardCompletenessContainer: {
      padding: 12,
      backgroundColor: 'rgba(0, 0, 0, 0.2)',
    },
    cardCompletenessText: {
      fontSize: 14,
      fontWeight: 'bold',
      color: 'white',
      marginBottom: 6,
    },
    cardProgressBarContainer: {
      height: 16,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      borderRadius: 8,
      overflow: 'hidden',
      marginTop: 8,
    },
    cardProgressBar: {
      height: '100%',
      borderRadius: 2,
    },
    creditMeterContainer: {
      marginTop: 12,
    },
    creditMeterBackground: {
      height: 4,
      backgroundColor: '#E0E0E0',
      borderRadius: 2,
      overflow: 'hidden',
    },
    creditMeterFill: {
      height: '100%',
      backgroundColor: '#4CAF50',
    },
    riskyCard: {
      backgroundColor: '#FFF5F5',
    },
    riskyCreditMeter: {
      backgroundColor: '#EF4444',
    },
    creditPercentage: {
      fontSize: 12,
      fontWeight: '600',
      marginBottom: 4,
    },
    riskyCreditPercentage: {
      color: '#EF4444',
    },
    ageingCardsGrid: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 12,
    },
    ageingCard: {
      width: '18.4%',
      backgroundColor: 'white',
      borderRadius: 12,
      padding: 16,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      borderTopWidth: 4,
    },
    ageingCardTitle: {
      fontSize: 14,
      color: '#666',
      marginBottom: 8,
      textAlign: 'center',
    },
    ageingCardValue: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#333',
      textAlign: 'center',
    },
    actionButtonsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      marginTop: 12,
      padding: 16,
      borderRadius: 16,
      backgroundColor: '#F8FAFC',
    },
    salesActionsContainer: {
      backgroundColor: '#EFF6FF', // Light blue background for sales
      borderWidth: 1,
      borderColor: '#DBEAFE',
    },
    marketingActionsContainer: {
      backgroundColor: '#ECFDF5', // Light green background for marketing
      borderWidth: 1,
      borderColor: '#D1FAE5',
    },
    actionButton: {
      width: tablet ? '19%' : '32%',
      marginBottom: 16,
      borderRadius: 16,
      overflow: 'hidden',
      minWidth: 80,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    actionButtonGradient: {
      padding: 10,
      paddingVertical: 30,
      alignItems: 'center',
      justifyContent: 'center',
      height: 120,
    },
    actionButtonIcon: {
      fontSize: 24,
      color: 'white',
      marginBottom: 10,
    },
    actionButtonText: {
      fontSize: 14,
      fontWeight: 'bold',
      color: 'white',
      textAlign: 'center',
    },
    notesContainer: {
      marginHorizontal: 16,
      marginTop: 16,
      backgroundColor: '#FFF9C4',
      borderRadius: 16,
      overflow: 'hidden',
    },
    notesHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#F9A825',
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    notesTitle: {
      fontSize: 14,
      fontWeight: 'bold',
      color: 'white',
    },
    notesIndicator: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#FF5722',
      marginLeft: 8,
    },
    notesContent: {
      padding: 16,
    },
    notesText: {
      fontSize: 14,
      color: '#333',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    bottomSheet: {
      backgroundColor: 'white',
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingHorizontal: 0,
      paddingTop: 0,
      paddingBottom: 30,
      height: 'auto',
      maxHeight: '80%',
      width: '100%',
      position: 'absolute',
      bottom: 0,
    },
    bottomSheetHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#E0E0E0',
      backgroundColor: '#F8F9FA',
    },
    bottomSheetTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#333',
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    selectionModeButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
      backgroundColor: '#F1F5F9',
      borderWidth: 1,
      borderColor: '#CBD5E1',
    },
    selectionModeButtonActive: {
      backgroundColor: '#2563EB',
      borderColor: '#1E40AF',
    },
    selectionModeButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#475569',
    },
    selectionModeButtonTextActive: {
      color: 'white',
    },
    selectionSummary: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      backgroundColor: '#EFF6FF',
      borderBottomWidth: 1,
      borderBottomColor: '#DBEAFE',
    },
    selectionCountText: {
      fontSize: 14,
      color: '#333',
    },
    selectionTotalText: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#2563EB',
    },
    receivePaymentButton: {
      backgroundColor: '#2563EB',
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 8,
    },
    receivePaymentText: {
      color: 'white',
      fontWeight: 'bold',
    },
    searchContainer: {
      padding: 16,
      backgroundColor: 'white',
      borderBottomWidth: 1,
      borderBottomColor: '#E0E0E0',
    },
    searchInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#F5F7FA',
      borderRadius: 8,
      paddingHorizontal: 12,
      marginBottom: 12,
    },
    searchIcon: {
      fontSize: 16,
      color: '#999',
      marginRight: 8,
    },
    searchInput: {
      flex: 1,
      height: 40,
      fontSize: 16,
      color: '#333',
    },
    filterTagsContainer: {
      flexDirection: 'row',
      marginTop: 8,
    },
    filterTag: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      backgroundColor: '#F5F7FA',
      borderRadius: 16,
      marginRight: 8,
      borderWidth: 1,
      borderColor: '#E0E0E0',
    },
    filterTagSelected: {
      backgroundColor: '#4A90E2',
      borderColor: '#4A90E2',
    },
    filterTagText: {
      fontSize: 14,
      color: '#666',
    },
    filterTagTextSelected: {
      color: 'white',
    },
    tableContainer: {
      flex: 1,
      padding: 16,
    },
    tableHeader: {
      flexDirection: 'row',
      backgroundColor: '#F5F5F5',
      paddingVertical: 12,
      paddingHorizontal: 8,
      borderRadius: 8,
      marginBottom: 8,
    },
    tableHeaderCell: {
      fontSize: 14,
      fontWeight: 'bold',
      color: '#333',
      paddingHorizontal: 4,
      textAlign: 'left', // Changed from center to left
    },
    tableRow: {
      flexDirection: 'row',
      paddingVertical: 12,
      paddingHorizontal: 8,
      borderBottomWidth: 1,
      borderBottomColor: '#E0E0E0',
    },
    overdueRow: {
      backgroundColor: 'rgba(231, 76, 60, 0.1)',
    },
    selectedRow: {
      backgroundColor: 'rgba(37, 99, 235, 0.1)',
    },
    tableCell: {
      fontSize: 14,
      color: '#333',
      paddingHorizontal: 4,
      textAlign: 'left', // Changed from center to left
      justifyContent: 'center',
    },
    overdueText: {
      color: '#E74C3C',
      fontWeight: 'bold',
    },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: 4,
      borderWidth: 2,
      borderColor: '#2563EB',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'white',
    },
    checkboxSelected: {
      borderColor: '#1E40AF',
      backgroundColor: '#EBF4FF',
    },
    checkboxInner: {
      width: 16,
      height: 16,
      borderRadius: 2,
      backgroundColor: '#2563EB',
    },
    commentModal: {
      width: '90%',
      maxWidth: 500,
      backgroundColor: 'white',
      borderRadius: 16,
      padding: 20,
      alignSelf: 'center',
    },
    commentModalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    commentModalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#333',
    },
    commentDocumentLabel: {
      fontSize: 14,
      color: '#666',
      marginBottom: 4,
    },
    commentDocumentNo: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#333',
      marginBottom: 16,
    },
    commentLabel: {
      fontSize: 14,
      color: '#666',
      marginBottom: 4,
    },
    commentInput: {
      borderWidth: 1,
      borderColor: '#E0E0E0',
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: '#333',
      minHeight: 100,
      textAlignVertical: 'top',
      marginBottom: 16,
    },
    reminderContainer: {
      marginBottom: 20,
    },
    reminderToggleContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    reminderLabel: {
      fontSize: 16,
      color: '#333',
    },
    reminderToggle: {
      width: 50,
      height: 30,
      borderRadius: 15,
      backgroundColor: '#E0E0E0',
      padding: 2,
    },
    reminderToggleActive: {
      backgroundColor: '#2563EB',
    },
    reminderToggleHandle: {
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: 'white',
    },
    reminderToggleHandleActive: {
      transform: [{ translateX: 20 }],
    },
    datePickerContainer: {
      marginTop: 8,
    },
    datePickerLabel: {
      fontSize: 14,
      color: '#666',
      marginBottom: 4,
    },
    datePicker: {
      borderWidth: 1,
      borderColor: '#E0E0E0',
      borderRadius: 8,
      padding: 12,
    },
    datePickerText: {
      fontSize: 16,
      color: '#333',
    },
    commentModalActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginTop: 16,
    },
    cancelButton: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      marginRight: 12,
    },
    cancelButtonText: {
      fontSize: 16,
      color: '#666',
    },
    saveButton: {
      backgroundColor: '#2563EB',
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 8,
    },
    saveButtonText: {
      fontSize: 16,
      fontWeight: 'bold',
      color: 'white',
    },
    closeButton: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: '#F0F0F0',
      justifyContent: 'center',
      alignItems: 'center',
    },
    closeButtonText: {
      fontSize: 16,
      color: '#333',
    },
    tableActionButton: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 0,
      width: 24,
      height: 24,
    },
    tableActionButtonText: {
      fontSize: 12,
    },
    noteDotIndicator: {
      position: 'absolute',
      top: 8,
      right: 8,
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: '#E74C3C',
    },
    notesModalContainer: {
      width: '90%',
      maxHeight: '80%',
      backgroundColor: 'white',
      borderRadius: 16,
      padding: 20,
      elevation: 5,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      alignSelf: 'center',
    },
    notesModalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#E0E0E0',
    },
    notesModalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#333',
    },
    addNoteContainer: {
      marginBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#E0E0E0',
      paddingBottom: 16,
    },
    addNoteInput: {
      borderWidth: 1,
      borderColor: '#E0E0E0',
      borderRadius: 8,
      padding: 12,
      minHeight: 80,
      textAlignVertical: 'top',
      marginBottom: 12,
    },
    addNoteButton: {
      backgroundColor: '#2563EB',
      borderRadius: 8,
      padding: 12,
      alignItems: 'center',
    },
    addNoteButtonDisabled: {
      backgroundColor: '#A0AEC0',
    },
    addNoteButtonText: {
      color: 'white',
      fontWeight: 'bold',
      fontSize: 16,
    },
    noteItem: {
      backgroundColor: '#F9FAFB',
      borderRadius: 8,
      padding: 16,
      marginBottom: 12,
    },
    noteHeader: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      marginBottom: 8,
    },
    noteAuthor: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#333',
      marginRight: 8,
    },
    noteDesignation: {
      fontSize: 14,
      color: '#666',
      marginRight: 8,
    },
    noteDate: {
      fontSize: 12,
      color: '#999',
    },
    noteText: {
      fontSize: 16,
      color: '#333',
      lineHeight: 24,
    },
    emptyNotesText: {
      fontSize: 16,
      color: '#666',
      textAlign: 'center',
      marginTop: 20,
    },
    newOrderButtonLarge: {
      backgroundColor: '#4361EE',
      padding: 16,
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: '#E0E0E0',
    },
    newOrderButtonText: {
      color: 'white',
      fontWeight: 'bold',
      fontSize: 16,
    },
    orderSimpleCard: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#E0E0E0',
    },
    orderSimpleHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    orderNumber: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#333',
    },
    orderDate: {
      fontSize: 14,
      color: '#666',
      marginTop: 4,
    },
    orderAmount: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#2563EB',
    },
    orderActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginTop: 8,
    },
    editOrderButton: {
      backgroundColor: '#F0F0F0',
      borderRadius: 6,
      paddingVertical: 8,
      paddingHorizontal: 16,
      marginRight: 12,
    },
    editOrderButtonText: {
      color: '#333',
      fontWeight: 'bold',
    },
    postOrderButton: {
      backgroundColor: '#2563EB',
      borderRadius: 6,
      paddingVertical: 8,
      paddingHorizontal: 16,
    },
    postOrderButtonText: {
      color: 'white',
      fontWeight: 'bold',
    },
    emptyOrdersContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 40,
    },
    emptyOrdersText: {
      fontSize: 16,
      color: '#666',
    },
    ordersScrollView: {
      maxHeight: 400,
    },
    profileModal: {
      width: '90%',
      maxWidth: 500,
      backgroundColor: 'white',
      borderRadius: 16,
      padding: 20,
      alignSelf: 'center',
    },
    profileModalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#E0E0E0',
    },
    profileModalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#333',
    },
    profileContent: {
      paddingHorizontal: 8,
    },
    profileField: {
      marginBottom: 16,
    },
    profileLabel: {
      fontSize: 14,
      color: '#666',
      marginBottom: 4,
    },
    profileValue: {
      fontSize: 16,
      color: '#333',
    },
    section: {
      marginBottom: 24,
      paddingHorizontal: 16,
      paddingTop: 16,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    sectionHeaderWithIcon: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    sectionTitleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    sectionIconSales: {
      fontSize: 20,
      marginRight: 8,
    },
    sectionIconMarketing: {
      fontSize: 20,
      marginRight: 8,
    },
    infoCardsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      gap: 12,
    },
    infoCard: {
      width: '18.4%',
      backgroundColor: 'white',
      borderRadius: 12,
      padding: 16,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    infoCardIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#F0F0F0',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
    },
    infoCardIcon: {
      fontSize: 20,
    },
    infoCardTitle: {
      fontSize: 14,
      color: '#666',
      marginBottom: 4,
    },
    infoCardValue: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#333',
      marginBottom: 4,
    },
    infoCardSubtitle: {
      fontSize: 14,
      color: '#666',
      marginBottom: 4,
    },
    scrollView: {
      flex: 1,
    },
    viewDueListButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: '#F0F0F0',
      borderRadius: 16,
    },
    viewDueListText: {
      fontSize: 14,
      color: '#4A90E2',
      fontWeight: '600',
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#555',
      letterSpacing: 0.5,
      marginBottom: 16,
      textTransform: 'uppercase',
    },
    creditCard: {
      width: '18.4%',
      backgroundColor: 'white',
      borderRadius: 12,
      padding: 16,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    creditTitle: {
      fontSize: 14,
      fontWeight: 'bold',
      color: '#555',
      marginBottom: 8,
    },
    creditLimitAmount: {
      fontSize: 21,
      fontWeight: 'bold',
      color: '#333',
      marginBottom: 4,
    },
    creditRemaining: {
      fontSize: 14,
      color: '#666',
      marginBottom: 4,
    },
    progressBarContainer: {
      height: 4,
      backgroundColor: '#E0E0E0',
      borderRadius: 2,
      overflow: 'hidden',
    },
    progressBar: {
      height: '100%',
      borderRadius: 2,
    },
    ageingCardsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      gap: 12,
    },
    transactionModal: {
      width: '90%',
      maxWidth: 600,
      backgroundColor: 'white',
      borderRadius: 16,
      padding: 20,
      maxHeight: '80%',
    },
    transactionModalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#E0E0E0',
    },
    transactionModalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#333',
    },
    modalCloseButton: {
      padding: 8,
    },
    modalCloseButtonText: {
      fontSize: 24,
      color: '#333',
    },
    transactionModalContent: {
      flex: 1,
    },
    transactionDetailRow: {
      marginBottom: 16,
      backgroundColor: '#F8FAFC',
      padding: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#E2E8F0',
    },
    transactionDetailLabel: {
      fontSize: 14,
      color: '#64748B',
      marginBottom: 4,
    },
    transactionDetailValue: {
      fontSize: 16,
      color: '#1E293B',
      fontWeight: '500',
    },
    overdueAmount: {
      color: '#EF4444',
      fontWeight: 'bold',
    },
    remarksSection: {
      marginTop: 24,
      backgroundColor: '#F8FAFC',
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#E2E8F0',
    },
    remarksSectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    remarksSectionTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#475569',
      textTransform: 'uppercase',
    },
    addRemarkButton: {
      backgroundColor: '#F1F5F9',
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 16,
    },
    addRemarkButtonText: {
      fontSize: 14,
      color: '#2563EB',
      fontWeight: '600',
    },
    remarkCard: {
      backgroundColor: '#F1F5F9',
      borderRadius: 8,
      padding: 16,
    },
    remarkText: {
      fontSize: 14,
      color: '#334155',
      lineHeight: 20,
      marginBottom: 8,
    },
    remarkDate: {
      fontSize: 12,
      color: '#64748B',
    },
    noRemarksContainer: {
      padding: 24,
      alignItems: 'center',
      backgroundColor: '#F1F5F9',
      borderRadius: 8,
    },
    noRemarksText: {
      fontSize: 16,
      color: '#64748B',
      marginBottom: 4,
    },
    noRemarksSubtext: {
      fontSize: 14,
      color: '#94A3B8',
    },
    transactionActions: {
      marginTop: 24,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: '#E2E8F0',
      alignItems: 'center',
    },
    transactionActionButton: {
      backgroundColor: '#F1F5F9',
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#CBD5E1',
      minWidth: 200,
      alignItems: 'center',
    },
    transactionActionButtonSelected: {
      backgroundColor: '#2563EB',
      borderColor: '#1E40AF',
    },
    transactionActionButtonText: {
      fontSize: 16,
      color: '#475569',
      fontWeight: '600',
    },
    transactionActionButtonTextSelected: {
      color: 'white',
    },
    reasonModalContent: {
      width: '90%',
      maxWidth: 500,
      backgroundColor: 'white',
      borderRadius: 16,
      padding: 20,
      alignSelf: 'center',
    },
    reasonModalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#333',
      marginBottom: 16,
    },
    reasonList: {
      maxHeight: 200,
      marginBottom: 16,
    },
    reasonItem: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#E0E0E0',
    },
    reasonItemSelected: {
      backgroundColor: '#F1F5F9',
    },
    reasonItemText: {
      fontSize: 16,
      color: '#333',
    },
    reasonItemTextSelected: {
      color: '#2563EB',
    },
    remarksInput: {
      borderWidth: 1,
      borderColor: '#E0E0E0',
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: '#333',
      minHeight: 100,
      textAlignVertical: 'top',
      marginBottom: 16,
    },
    reasonModalActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginTop: 16,
    },
    reasonModalButton: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      marginRight: 12,
      borderRadius: 8,
    },
    reasonModalCancelButton: {
      backgroundColor: '#A0AEC0',
    },
    reasonModalCancelButtonText: {
      fontSize: 16,
      color: '#666',
    },
    reasonModalSubmitButton: {
      backgroundColor: '#2563EB',
    },
    reasonModalSubmitButtonText: {
      fontSize: 16,
      color: 'white',
      fontWeight: 'bold',
    },
    reasonButton: {
      backgroundColor: '#4ADE80',
      marginRight: 8,
    },
    reasonButtonText: {
      color: 'white',
      fontSize: 14,
      fontWeight: '600',
    },
  });
};

export default CustomerDetailScreen; 