import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { getCustomerList, Customer } from '../../services/api';
import {
  getUserData,
  storeCustomerList,
  getCustomerList as getStoredCustomerList,
  getCustomerListSyncTime,
} from '../../services/storage';

type Props = NativeStackScreenProps<RootStackParamList, 'Journey'>;

const JourneyScreen: React.FC<Props> = ({ navigation }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  useEffect(() => {
    loadCustomerList();
  }, []);

  const loadCustomerList = async (forceSync: boolean = false) => {
    try {
      if (!forceSync) {
        const storedData = await getStoredCustomerList();
        const syncTime = await getCustomerListSyncTime();
        
        if (storedData) {
          setCustomers(storedData);
          setLastSyncTime(syncTime);
          setIsLoading(false);
          return;
        }
      }

      await syncCustomerList();
    } catch (error) {
      console.error('Error loading customer list:', error);
      setIsLoading(false);
    }
  };

  const syncCustomerList = async () => {
    try {
      setIsSyncing(true);
      const userData = await getUserData();
      
      if (!userData) {
        navigation.replace('Login');
        return;
      }

      const response = await getCustomerList(userData.exeId);
      await storeCustomerList(response);
      
      const syncTime = await getCustomerListSyncTime();
      setLastSyncTime(syncTime);
      setCustomers(response);
    } catch (error) {
      console.error('Error syncing customer list:', error);
    } finally {
      setIsSyncing(false);
      setIsLoading(false);
    }
  };

  const formatSyncTime = (timestamp: string | null): string => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const getFormattedAddress = (customer: Customer): string => {
    return [customer.addr1, customer.addr2, customer.addr3, customer.city]
      .filter(Boolean)
      .join(', ');
  };

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleSMS = (phone: string) => {
    Linking.openURL(`sms:${phone}`);
  };

  const getGradeColor = (grade: string): string => {
    switch (grade.toUpperCase()) {
      case 'A': return '#4CAF50';
      case 'B': return '#2196F3';
      case 'C': return '#FFC107';
      case 'D': return '#FF9800';
      case 'BL': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
  };

  const filteredCustomers = customers.filter(customer =>
    customer.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.customerId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.route.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderCustomerCard = ({ item: customer }: { item: Customer }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.customerIdContainer}>
          <Text style={styles.customerId}>{customer.customerId}</Text>
          <View style={[styles.gradeTag, { backgroundColor: getGradeColor(customer.grade) }]}>
            <Text style={styles.gradeText}>{customer.grade}</Text>
          </View>
        </View>
        <Text style={styles.customerName}>{customer.customerName}</Text>
      </View>
      
      <Text style={styles.address}>{getFormattedAddress(customer)}</Text>
      <Text style={styles.route}>{customer.route}</Text>
      
      <View style={styles.cardFooter}>
        <View style={styles.contactButtons}>
          {customer.phone1 && (
            <View style={styles.contactButtonGroup}>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => handleCall(customer.phone1)}
              >
                <Text style={styles.iconText}>📞</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => handleSMS(customer.phone1)}
              >
                <Text style={styles.iconText}>✉️</Text>
              </TouchableOpacity>
              <Text style={styles.phoneText}>{customer.phone1}</Text>
            </View>
          )}
          {customer.phone2 && (
            <View style={styles.contactButtonGroup}>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => handleCall(customer.phone2)}
              >
                <Text style={styles.iconText}>📞</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => handleSMS(customer.phone2)}
              >
                <Text style={styles.iconText}>✉️</Text>
              </TouchableOpacity>
              <Text style={styles.phoneText}>{customer.phone2}</Text>
            </View>
          )}
        </View>
      </View>
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
        <Text style={styles.headerTitle}>Start Journey</Text>
        <View style={styles.headerRight}>
          <Text style={styles.syncTimeText}>
            Last synced: {formatSyncTime(lastSyncTime)}
          </Text>
          <TouchableOpacity
            style={[styles.syncButton, isSyncing && styles.syncButtonDisabled]}
            onPress={() => loadCustomerList(true)}
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

      {/* Search */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by customer name, ID, or route"
          value={searchQuery}
          onChangeText={handleSearch}
        />
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text style={styles.loadingText}>Loading customers...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredCustomers}
          renderItem={renderCustomerCard}
          keyExtractor={customer => customer.customerId}
          contentContainerStyle={styles.listContainer}
        />
      )}
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
  },
  syncButtonDisabled: {
    opacity: 0.7,
  },
  syncButtonText: {
    fontSize: 14,
    color: '#4A90E2',
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
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
  listContainer: {
    padding: 16,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    marginBottom: 12,
  },
  customerIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  customerId: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  gradeTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  gradeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  customerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  address: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  route: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 12,
  },
  contactButtons: {
    flexDirection: 'column',
    gap: 8,
  },
  contactButtonGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: 8,
    marginRight: 8,
  },
  iconText: {
    fontSize: 16,
  },
  phoneText: {
    fontSize: 14,
    color: '#666',
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
});

export default JourneyScreen; 