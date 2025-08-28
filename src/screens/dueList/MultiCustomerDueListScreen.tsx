import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Dimensions,
  SafeAreaView,
  StatusBar,
  Animated,
  Alert,
  Modal,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import LinearGradient from 'react-native-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { getDueList, DueListCustomer, DueListInvoice } from '../../services/api';
import { getUserData, storeDueList, getDueList as getStoredDueList, getDueListSyncTime } from '../../services/storage';

type Props = NativeStackScreenProps<RootStackParamList, 'MultiCustomerDueList'>;

interface ExtendedDueListCustomer extends DueListCustomer {
  expanded: boolean;
  invoices: ExtendedDueListInvoice[];
  riskLevel: 'low' | 'medium' | 'high';
  totalDue: number;
}

interface ExtendedDueListInvoice extends DueListInvoice {
  comment?: string;
  hasComment?: boolean;
  selected?: boolean;
  customerId: string;
  exeId: string;
}

const MultiCustomerDueListScreen: React.FC<Props> = ({ navigation }) => {
  const [customerDueLists, setCustomerDueLists] = useState<ExtendedDueListCustomer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [currentTransaction, setCurrentTransaction] = useState<ExtendedDueListInvoice | null>(null);
  const [commentText, setCommentText] = useState('');
  const [isReminderEnabled, setIsReminderEnabled] = useState(false);
  const [reminderDate, setReminderDate] = useState(new Date());
  const [selectionMode, setSelectionMode] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [selectedAgeBucket, setSelectedAgeBucket] = useState<string | null>(null);
  const [showTransactionModal, setShowTransactionModal] = useState(false);

  const ageBuckets = [
    { label: '0-30', value: '0-30' },
    { label: '31-60', value: '31-60' },
    { label: '61-90', value: '61-90' },
    { label: '91-120', value: '91-120' },
    { label: '>120', value: '>120' },
  ];

  useEffect(() => {
    loadDueList();
  }, []);

  const loadDueList = async (forceSync: boolean = false) => {
    try {
      if (!forceSync) {
        const storedData = await getStoredDueList();
        const syncTime = await getDueListSyncTime();
        
        if (storedData) {
          setCustomerDueLists(storedData.duelist.map(customer => ({
            ...customer,
            expanded: false,
            riskLevel: calculateRiskLevel(customer.overdue),
            totalDue: customer.overdue,
            invoices: customer.invoices.map(invoice => ({
              ...invoice,
              selected: false,
              hasComment: false,
              customerId: customer.customerId,
              exeId: '', // This will be set from API response if available
            })),
          })));
          setLastSyncTime(syncTime);
          setIsLoading(false);
          return;
        }
      }

      await syncDueList();
    } catch (error) {
      console.error('Error loading due list:', error);
      Alert.alert('Error', 'Failed to load due list');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateRiskLevel = (overdue: number): 'low' | 'medium' | 'high' => {
    if (overdue > 1000000) return 'high';
    if (overdue > 500000) return 'medium';
    return 'low';
  };

  const syncDueList = async () => {
    try {
      setIsSyncing(true);
      const userData = await getUserData();
      
      if (!userData) {
        navigation.replace('Login');
        return;
      }

      const response = await getDueList(userData.exeId);
      await storeDueList(response);
      
      const syncTime = await getDueListSyncTime();
      setLastSyncTime(syncTime);
      setCustomerDueLists(response.duelist.map(customer => ({
        ...customer,
        expanded: false,
        riskLevel: calculateRiskLevel(customer.overdue),
        totalDue: customer.overdue,
        invoices: customer.invoices.map(invoice => ({
          ...invoice,
          selected: false,
          hasComment: false,
          customerId: customer.customerId,
          exeId: userData.exeId,
        })),
      })));
    } catch (error) {
      console.error('Error syncing due list:', error);
      Alert.alert('Error', 'Failed to sync due list');
    } finally {
      setIsSyncing(false);
    }
  };

  const formatSyncTime = (timestamp: string | null): string => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const formatCurrency = (amount: number): string => {
    return amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return `${date.getDate()}-${date.toLocaleString('default', { month: 'short' })}-${date.getFullYear()}`;
  };

  const toggleCustomerExpanded = (customerId: string) => {
    setCustomerDueLists(prevLists =>
      prevLists.map(customer =>
        customer.customerId === customerId
          ? { ...customer, expanded: !customer.expanded }
          : customer
      )
    );
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    // Implement search logic across all customers and their transactions
  };

  const handleCommentPress = (transaction: ExtendedDueListInvoice) => {
    setCurrentTransaction(transaction);
    setCommentText(transaction.comment || '');
    setShowCommentModal(true);
  };

  const saveComment = () => {
    if (!currentTransaction) return;

    setCustomerDueLists(prevLists =>
      prevLists.map(customer => ({
        ...customer,
        invoices: customer.invoices.map(t =>
          t.documentNo === currentTransaction.documentNo
            ? { ...t, hasComment: true, comment: commentText }
            : t
        )
      }))
    );

    setShowCommentModal(false);
    setCurrentTransaction(null);
    setCommentText('');
    setIsReminderEnabled(false);
  };

  const toggleSelection = (customerId: string, documentNo: string) => {
    setCustomerDueLists(prevLists =>
      prevLists.map(customer => ({
        ...customer,
        invoices: customer.invoices.map(t =>
          t.documentNo === documentNo
            ? { ...t, selected: !t.selected }
            : t
        )
      }))
    );
  };

  const getSelectedTotal = () => {
    return customerDueLists.reduce((total, customer) =>
      total + customer.invoices
        .filter(t => t.selected)
        .reduce((sum, t) => sum + t.dueAmount, 0),
      0
    );
  };

  const handleReceivePayment = () => {
    const selectedCount = customerDueLists.reduce((count, customer) =>
      count + customer.invoices.filter(t => t.selected).length,
      0
    );

    Alert.alert(
      'Receive Payment',
      `Process payment for ${selectedCount} selected items?\nTotal Amount: ${formatCurrency(getSelectedTotal())}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Proceed', onPress: () => {/* Implement payment processing */} }
      ]
    );
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setReminderDate(selectedDate);
    }
  };

  const getFilteredCustomers = () => {
    let filtered = customerDueLists;
    
    if (searchQuery) {
      filtered = filtered.filter(customer =>
        customer.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.customerId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.invoices.some(invoice =>
          invoice.documentNo.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }

    if (selectedAgeBucket) {
      filtered = filtered.map(customer => ({
        ...customer,
        invoices: customer.invoices.filter(invoice => {
          if (!invoice.daysDue) return false;
          
          switch (selectedAgeBucket) {
            case '0-30':
              return invoice.daysDue >= 0 && invoice.daysDue <= 30;
            case '31-60':
              return invoice.daysDue >= 31 && invoice.daysDue <= 60;
            case '61-90':
              return invoice.daysDue >= 61 && invoice.daysDue <= 90;
            case '91-120':
              return invoice.daysDue >= 91 && invoice.daysDue <= 120;
            case '>120':
              return invoice.daysDue > 120;
            default:
              return true;
          }
        })
      })).filter(customer => customer.invoices.length > 0);
    }

    return filtered;
  };

  const getFilteredTotal = () => {
    return getFilteredCustomers().reduce((total, customer) =>
      total + customer.invoices.reduce((sum, invoice) => sum + invoice.dueAmount, 0),
      0
    );
  };

  const renderTransaction = ({ item }: { item: ExtendedDueListInvoice }) => (
    <View style={[
      styles.transactionRow,
      (item.daysDue ?? 0) > 90 ? styles.overdueRow : null,
      item.selected ? styles.selectedRow : null
    ]}>
      {selectionMode && (
        <View style={[styles.transactionCell, { flex: 0.5 }]}>
          <TouchableOpacity
            style={styles.checkbox}
            onPress={() => toggleSelection(item.customerId, item.documentNo)}
          >
            {item.selected && <View style={styles.checkboxInner} />}
          </TouchableOpacity>
        </View>
      )}
      <Text style={[styles.transactionCell, { flex: 1.5 }]}>{item.documentNo}</Text>
      <Text style={[styles.transactionCell, { flex: 1 }]}>{formatDate(item.docDate)}</Text>
      <Text style={[styles.transactionCell, { flex: 1, textAlign: 'right', paddingRight: 8 }]}>{formatCurrency(item.docAmount)}</Text>
      <Text style={[styles.transactionCell, { flex: 1, backgroundColor: '#F0F9FF', textAlign: 'right', paddingRight: 8 }]}>{formatCurrency(item.dueAmount)}</Text>
      <Text style={[
        styles.transactionCell,
        { flex: 0.8 },
        (item.daysDue ?? 0) > 90 ? styles.overdueText : null
      ]}>{item.daysDue ?? 'N/A'}</Text>
      <Text style={[styles.transactionCell, { flex: 0.8 }]}>{item.docType}</Text>
      <Text style={[styles.transactionCell, { flex: 0.8 }]}>{item.exeId}</Text>
      <TouchableOpacity 
        style={[styles.actionButton, { flex: 0.3 }]}
        onPress={() => handleCommentPress(item)}
      >
        <Text style={styles.actionButtonText}>
          {item.hasComment ? '👁️' : '📝'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderCustomerSection = ({ item }: { item: ExtendedDueListCustomer }) => (
    <View style={styles.customerSection}>
      <TouchableOpacity 
        style={styles.customerHeader}
        onPress={() => toggleCustomerExpanded(item.customerId)}
      >
        <View style={styles.customerInfo}>
          <Text style={styles.customerId}>{item.customerId}</Text>
          <Text style={styles.customerName}>{item.customerName}</Text>
        </View>
        <View style={styles.customerHeaderRight}>
          <Text style={[
            styles.totalDue,
            item.riskLevel === 'high' ? styles.highRisk : null,
            item.riskLevel === 'medium' ? styles.mediumRisk : null
          ]}>
            {formatCurrency(item.totalDue)}
          </Text>
          <Text style={styles.expandIcon}>{item.expanded ? '▼' : '▶'}</Text>
        </View>
      </TouchableOpacity>
      
      {item.expanded && (
        <View style={styles.transactionsContainer}>
          <View style={styles.tableHeader}>
            {selectionMode && (
              <Text style={[styles.headerCell, { flex: 0.5 }]}></Text>
            )}
            <Text style={[styles.headerCell, { flex: 1.5 }]}>Document No</Text>
            <Text style={[styles.headerCell, { flex: 1 }]}>Date</Text>
            <Text style={[styles.headerCell, { flex: 1 }]}>Doc Amount</Text>
            <Text style={[styles.headerCell, { flex: 1, backgroundColor: '#EBF5FF' }]}>Due Amount</Text>
            <Text style={[styles.headerCell, { flex: 0.8 }]}>Days Due</Text>
            <Text style={[styles.headerCell, { flex: 0.8 }]}>Type</Text>
            <Text style={[styles.headerCell, { flex: 0.8 }]}>Exec ID</Text>
            <Text style={[styles.headerCell, { flex: 0.3 }]}>Action</Text>
          </View>
          {item.invoices.map(invoice => (
            <View key={invoice.documentNo}>
              {renderTransaction({ item: invoice })}
            </View>
          ))}
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Due List</Text>
        <View style={styles.headerRight}>
          <Text style={styles.syncTimeText}>
            Last synced: {formatSyncTime(lastSyncTime)}
          </Text>
          <TouchableOpacity
            style={[styles.syncButton, isSyncing && styles.syncButtonDisabled]}
            onPress={() => loadDueList(true)}
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

      {/* Search and Filter */}
      <View style={styles.searchFilterContainer}>
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search by customer name, ID, or document no."
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
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Total Due Amount:</Text>
            <Text style={styles.totalValue}>{formatCurrency(getFilteredTotal())}</Text>
          </View>
        </View>
      </View>

      {selectionMode && getSelectedTotal() > 0 && (
        <View style={styles.selectionSummary}>
          <View>
            <Text style={styles.selectionCountText}>
              {customerDueLists.reduce((count, customer) =>
                count + customer.invoices.filter(t => t.selected).length, 0)} items selected
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

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text style={styles.loadingText}>Loading due list...</Text>
        </View>
      ) : (
        <FlatList
          data={getFilteredCustomers()}
          renderItem={renderCustomerSection}
          keyExtractor={item => item.customerId}
          contentContainerStyle={styles.listContainer}
        />
      )}

      {/* Comment Modal */}
      <Modal
        visible={showCommentModal}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {currentTransaction?.hasComment ? 'View/Edit Comment' : 'Add Comment'}
            </Text>
            <Text style={styles.modalSubtitle}>
              Document: {currentTransaction?.documentNo}
            </Text>
            
            <TextInput
              style={styles.commentInput}
              multiline
              placeholder="Enter your comment..."
              value={commentText}
              onChangeText={setCommentText}
            />

            <View style={styles.reminderContainer}>
              <TouchableOpacity
                style={styles.reminderToggle}
                onPress={() => setIsReminderEnabled(!isReminderEnabled)}
              >
                <View style={[
                  styles.checkbox,
                  isReminderEnabled && { borderColor: '#2563EB', backgroundColor: '#2563EB' }
                ]}>
                  {isReminderEnabled && <View style={styles.checkboxInner} />}
                </View>
                <Text style={styles.reminderText}>Set Reminder</Text>
              </TouchableOpacity>

              {isReminderEnabled && (
                <TouchableOpacity
                  style={styles.datePickerButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={styles.datePickerButtonText}>
                    {reminderDate.toLocaleDateString()}
                  </Text>
                </TouchableOpacity>
              )}

              {showDatePicker && (
                <DateTimePicker
                  value={reminderDate}
                  mode="date"
                  display="default"
                  onChange={handleDateChange}
                  minimumDate={new Date()}
                />
              )}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowCommentModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={saveComment}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
                style={styles.closeButton}
                onPress={() => setShowTransactionModal(false)}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            {currentTransaction && (
              <ScrollView style={styles.transactionModalContent}>
                <View style={styles.transactionDetailRow}>
                  <Text style={styles.transactionDetailLabel}>Customer</Text>
                  <Text style={styles.transactionDetailValue}>
                    {customerDueLists.find(c => c.customerId === currentTransaction.customerId)?.customerName || 'N/A'}
                  </Text>
                </View>
                
                <View style={styles.transactionDetailRow}>
                  <Text style={styles.transactionDetailLabel}>Document No</Text>
                  <Text style={styles.transactionDetailValue}>{currentTransaction.documentNo}</Text>
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
                    currentTransaction.daysDue > 90 && styles.overdueText
                  ]}>{currentTransaction.daysDue}</Text>
                </View>
                
                <View style={styles.transactionDetailRow}>
                  <Text style={styles.transactionDetailLabel}>Document Type</Text>
                  <Text style={styles.transactionDetailValue}>{currentTransaction.docType}</Text>
                </View>
                
                <View style={styles.transactionDetailRow}>
                  <Text style={styles.transactionDetailLabel}>Executive ID</Text>
                  <Text style={styles.transactionDetailValue}>{currentTransaction.exeId}</Text>
                </View>
                
                <View style={styles.transactionActions}>
                  <TouchableOpacity 
                    style={styles.transactionActionButton}
                    onPress={() => {
                      setShowTransactionModal(false);
                      handleCommentPress(currentTransaction);
                    }}
                  >
                    <Text style={styles.transactionActionButtonText}>
                      {currentTransaction.hasComment ? 'View/Edit Comment' : 'Add Comment'}
                    </Text>
                  </TouchableOpacity>
                  
                  {selectionMode && (
                    <TouchableOpacity 
                      style={[
                        styles.transactionActionButton,
                        currentTransaction.selected && styles.transactionActionButtonSelected
                      ]}
                      onPress={() => {
                        toggleSelection(currentTransaction.customerId, currentTransaction.documentNo);
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
                  )}
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
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
    paddingTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight,
    paddingBottom: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 24,
    color: '#333',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  syncTimeText: {
    fontSize: 12,
    color: '#666',
    marginRight: 8,
  },
  syncButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
    flexDirection: 'row',
    alignItems: 'center',
  },
  syncButtonDisabled: {
    opacity: 0.7,
  },
  syncButtonText: {
    fontSize: 14,
    color: '#4A90E2',
    fontWeight: '600',
  },
  searchFilterContainer: {
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
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
    marginBottom: 12,
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
  totalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  listContainer: {
    padding: 16,
  },
  customerSection: {
    marginBottom: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  customerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customerId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 8,
  },
  customerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  customerHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  totalDue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 8,
  },
  expandIcon: {
    fontSize: 16,
    color: '#666',
    marginLeft: 8,
  },
  transactionsContainer: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  headerCell: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    paddingHorizontal: 4,
    textAlign: 'left',
  },
  transactionRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  transactionCell: {
    fontSize: 14,
    color: '#333',
    paddingHorizontal: 4,
    textAlign: 'left',
    justifyContent: 'center',
  },
  overdueRow: {
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
  },
  selectedRow: {
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
  },
  overdueText: {
    color: '#E74C3C',
    fontWeight: 'bold',
  },
  actionButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxInner: {
    width: 12,
    height: 12,
    borderRadius: 2,
    backgroundColor: '#2563EB',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  commentInput: {
    height: 100,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    textAlignVertical: 'top',
  },
  reminderContainer: {
    marginBottom: 16,
  },
  reminderToggle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reminderText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginLeft: 12,
  },
  cancelButton: {
    backgroundColor: '#F0F0F0',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#2563EB',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  datePickerButton: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  datePickerButtonText: {
    fontSize: 14,
    color: '#333',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
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
  transactionModalContent: {
    flex: 1,
  },
  transactionDetailRow: {
    marginBottom: 16,
  },
  transactionDetailLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  transactionDetailValue: {
    fontSize: 16,
    color: '#333',
  },
  overdueAmount: {
    color: '#E74C3C',
    fontWeight: 'bold',
  },
  transactionActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 24,
    gap: 12,
  },
  transactionActionButton: {
    backgroundColor: '#F0F0F0',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  transactionActionButtonSelected: {
    backgroundColor: '#2563EB',
  },
  transactionActionButtonText: {
    color: '#333',
    fontWeight: 'bold',
  },
  transactionActionButtonTextSelected: {
    color: 'white',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#333',
  },
  highRisk: {
    color: '#F44336',
  },
  mediumRisk: {
    color: '#FF9800',
  },
});

export default MultiCustomerDueListScreen; 