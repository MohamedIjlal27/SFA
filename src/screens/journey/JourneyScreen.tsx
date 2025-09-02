import React, { useState, useEffect, useMemo } from 'react';
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
  Alert,
  ScrollView,
  Modal,
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
import { customerDetailService } from '../../services/customerDetailService';
import { mockCustomerDetails } from '../../data/mockCustomerDetails';

type Props = NativeStackScreenProps<RootStackParamList, 'Journey'>;

type GroupBy = 'city' | 'route';
type FilterGrade = 'ALL' | 'A' | 'B' | 'C' | 'D' | 'BL';

interface Section {
  title: string;
  data: Customer[];
  expanded: boolean;
}

interface DropdownOption {
  label: string;
  value: string;
}

const JourneyScreen: React.FC<Props> = ({ navigation }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter states
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [selectedRoute, setSelectedRoute] = useState<string>('');
  const [selectedGrade, setSelectedGrade] = useState<FilterGrade>('ALL');
  const [groupBy, setGroupBy] = useState<GroupBy>('city');
  
  // Search states for dropdowns
  const [citySearch, setCitySearch] = useState('');
  const [routeSearch, setRouteSearch] = useState('');
  const [gradeSearch, setGradeSearch] = useState('');
  
  // Dropdown visibility states
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [showRouteDropdown, setShowRouteDropdown] = useState(false);
  const [showGradeDropdown, setShowGradeDropdown] = useState(false);
  
  // Sections for grouped display
  const [sections, setSections] = useState<Section[]>([]);

  // Grade options
  const gradeOptions = React.useMemo(() => [
    { label: 'All Grades', value: 'ALL' },
    { label: 'Grade A', value: 'A' },
    { label: 'Grade B', value: 'B' },
    { label: 'Grade C', value: 'C' },
    { label: 'Grade D', value: 'D' },
    { label: 'Blacklisted', value: 'BL' },
  ], []);

  // Add memoized unique grades from customer data
  const uniqueGrades = useMemo(() => {
    const grades = ['ALL', ...new Set(customers.map(customer => customer.grade))];
    return grades.map(grade => ({
      label: grade,
      value: grade
    }));
  }, [customers]);

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
      Alert.alert('Error', 'Failed to load customer list');
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
    } catch (error: any) {
      console.error('Error syncing customer list:', error);
      
      // Check if it's an authentication error
      if (error.message?.includes('Session expired') || error.message?.includes('Authentication token not found')) {
        Alert.alert(
          'Session Expired',
          'Your session has expired. Please log in again.',
          [
            {
              text: 'OK',
              onPress: () => navigation.replace('Login'),
            },
          ]
        );
      } else {
        Alert.alert('Error', error?.message || 'Failed to sync customer list');
      }
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

  // Get unique cities and routes
  const cities = React.useMemo(() => {
    const uniqueCities = Array.from(new Set(customers.map(c => c.city))).sort();
    return uniqueCities.map(city => ({ label: city, value: city }));
  }, [customers]);

  const routes = React.useMemo(() => {
    const uniqueRoutes = Array.from(new Set(customers.map(c => c.route))).sort();
    return uniqueRoutes.map(route => ({ label: route, value: route }));
  }, [customers]);

  // Filter options based on search
  const filteredCities = React.useMemo(() => {
    return cities.filter(city => 
      city.label.toLowerCase().includes(citySearch.toLowerCase())
    );
  }, [cities, citySearch]);

  const filteredRoutes = React.useMemo(() => {
    return routes.filter(route => 
      route.label.toLowerCase().includes(routeSearch.toLowerCase())
    );
  }, [routes, routeSearch]);

  // Add filtered grades based on search
  const filteredGrades = React.useMemo(() => {
    return uniqueGrades.filter(grade =>
      grade.label.toLowerCase().includes(gradeSearch.toLowerCase())
    );
  }, [uniqueGrades, gradeSearch]);

  // Update sections when filters change
  useEffect(() => {
    const filtered = customers.filter(customer => {
      const matchesSearch = 
        customer.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.customerId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.route.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCity = !selectedCity || customer.city === selectedCity;
      const matchesRoute = !selectedRoute || customer.route === selectedRoute;
      const matchesGrade = selectedGrade === 'ALL' || customer.grade === selectedGrade;

      return matchesSearch && matchesCity && matchesRoute && matchesGrade;
    });

    const grouped = filtered.reduce((acc, customer) => {
      const key = groupBy === 'city' ? customer.city : customer.route;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(customer);
      return acc;
    }, {} as Record<string, Customer[]>);

    const newSections = Object.entries(grouped)
      .map(([title, data]) => ({
        title,
        data,
        expanded: true,
      }))
      .sort((a, b) => a.title.localeCompare(b.title));

    setSections(newSections);
  }, [customers, searchQuery, groupBy, selectedGrade, selectedCity, selectedRoute]);

  const toggleSection = (title: string) => {
    setSections(prev =>
      prev.map(section =>
        section.title === title
          ? { ...section, expanded: !section.expanded }
          : section
      )
    );
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = 
      customer.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.customerId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.route.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCity = !selectedCity || customer.city === selectedCity;
    const matchesRoute = !selectedRoute || customer.route === selectedRoute;

    return matchesSearch && matchesCity && matchesRoute;
  });

  const SearchableDropdown = ({ 
    options, 
    value, 
    onSelect, 
    searchValue, 
    onSearchChange, 
    placeholder,
    isVisible,
    onClose
  }: { 
    options: DropdownOption[],
    value: string,
    onSelect: (value: string) => void,
    searchValue: string,
    onSearchChange: (text: string) => void,
    placeholder: string,
    isVisible: boolean,
    onClose: () => void
  }) => (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.dropdownContainer}>
          <TextInput
            style={styles.dropdownSearch}
            placeholder={`Search ${placeholder.toLowerCase()}...`}
            value={searchValue}
            onChangeText={onSearchChange}
          />
          <ScrollView style={styles.dropdownList}>
            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={() => {
                onSelect('');
                onClose();
              }}
            >
              <Text style={styles.dropdownItemText}>All {placeholder}s</Text>
            </TouchableOpacity>
            {options.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.dropdownItem,
                  value === option.value && styles.dropdownItemSelected
                ]}
                onPress={() => {
                  onSelect(option.value);
                  onClose();
                }}
              >
                <Text style={[
                  styles.dropdownItemText,
                  value === option.value && styles.dropdownItemTextSelected
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  const renderCustomerCard = ({ item: customer }: { item: Customer }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={async () => {
        try {
          const customerId = customer.customerId;
          
          // Show loading indicator
          setIsLoading(true);
          
          // Check if customer details exist in local storage
          const localData = await customerDetailService.getCustomerDetails(customerId);
          
          // If not in local storage, fetch from API
          if (!localData) {
            await customerDetailService.syncCustomerDetails(customerId);
          }
          
          // Navigate to customer detail screen
          navigation.navigate('CustomerDetail', {
            customerId: customerId
          });
        } catch (error: any) {
          console.error('Error preparing customer details:', error);
          
          // Check if it's an authentication error
          if (error.message?.includes('Session expired') || error.message?.includes('Authentication token not found')) {
            Alert.alert(
              'Session Expired',
              'Your session has expired. Please log in again.',
              [
                {
                  text: 'OK',
                  onPress: () => navigation.replace('Login'),
                },
              ]
            );
          } else {
            Alert.alert('Error', 'Failed to load customer details');
          }
        } finally {
          setIsLoading(false);
        }
      }}
    >
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
                onPress={(e) => {
                  e.stopPropagation();
                  handleCall(customer.phone1);
                }}
              >
                <Text style={styles.iconText}>📞</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={(e) => {
                  e.stopPropagation();
                  handleSMS(customer.phone1);
                }}
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
                onPress={(e) => {
                  e.stopPropagation();
                  handleCall(customer.phone2);
                }}
              >
                <Text style={styles.iconText}>📞</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={(e) => {
                  e.stopPropagation();
                  handleSMS(customer.phone2);
                }}
              >
                <Text style={styles.iconText}>✉️</Text>
              </TouchableOpacity>
              <Text style={styles.phoneText}>{customer.phone2}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderSection = ({ item }: { item: Section }) => (
    <View style={styles.section}>
      <TouchableOpacity
        style={styles.sectionHeader}
        onPress={() => toggleSection(item.title)}
      >
        <Text style={styles.sectionHeaderText}>
          {item.expanded ? '▼' : '▶'} {item.title} ({item.data.length})
        </Text>
      </TouchableOpacity>
      {item.expanded && (
        <FlatList
          data={item.data}
          renderItem={renderCustomerCard}
          keyExtractor={customer => customer.customerId}
          scrollEnabled={false}
        />
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

      {/* Search and Filters */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, ID, or route"
            value={searchQuery}
            onChangeText={handleSearch}
          />
        </View>
        <TouchableOpacity
          style={[styles.filterToggle, showFilters && styles.filterToggleActive]}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Text style={[
            styles.filterToggleText,
            showFilters && styles.filterToggleTextActive
          ]}>Filter</Text>
        </TouchableOpacity>
      </View>

      {/* Filters */}
      {showFilters && (
        <View style={styles.filtersContainer}>
          {/* Group By */}
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Group By</Text>
            <View style={styles.groupByButtons}>
              <TouchableOpacity
                style={[
                  styles.groupByButton,
                  groupBy === 'city' && styles.groupByButtonActive
                ]}
                onPress={() => setGroupBy('city')}
              >
                <Text style={[
                  styles.groupByButtonText,
                  groupBy === 'city' && styles.groupByButtonTextActive
                ]}>City</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.groupByButton,
                  groupBy === 'route' && styles.groupByButtonActive
                ]}
                onPress={() => setGroupBy('route')}
              >
                <Text style={[
                  styles.groupByButtonText,
                  groupBy === 'route' && styles.groupByButtonTextActive
                ]}>Route</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Filters</Text>
            <View style={styles.filterRow}>
              <TouchableOpacity
                style={[styles.filterButton, styles.filterButtonThird]}
                onPress={() => setShowCityDropdown(true)}
              >
                <Text style={styles.filterButtonLabel}>City</Text>
                <Text style={styles.filterButtonValue} numberOfLines={1}>
                  {selectedCity || 'All Cities'}
                </Text>
                <Text style={styles.filterButtonIcon}>▼</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.filterButton, styles.filterButtonThird]}
                onPress={() => setShowRouteDropdown(true)}
              >
                <Text style={styles.filterButtonLabel}>Route</Text>
                <Text style={styles.filterButtonValue} numberOfLines={1}>
                  {selectedRoute || 'All Routes'}
                </Text>
                <Text style={styles.filterButtonIcon}>▼</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.filterButton, styles.filterButtonThird]}
                onPress={() => setShowGradeDropdown(true)}
              >
                <Text style={styles.filterButtonLabel}>Grade</Text>
                <View style={styles.gradeFilterValue}>
                  <View style={[
                    styles.gradeIndicator,
                    { backgroundColor: selectedGrade !== 'ALL' ? getGradeColor(selectedGrade) : '#9CA3AF' }
                  ]} />
                  <Text style={styles.filterButtonValue} numberOfLines={1}>
                    {selectedGrade === 'ALL' ? 'All Grades' : `Grade ${selectedGrade}`}
                  </Text>
                </View>
                <Text style={styles.filterButtonIcon}>▼</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Clear Filters */}
          {(selectedCity || selectedRoute || selectedGrade !== 'ALL') && (
            <TouchableOpacity
              style={styles.clearFiltersButton}
              onPress={() => {
                setSelectedCity('');
                setSelectedRoute('');
                setSelectedGrade('ALL');
              }}
            >
              <Text style={styles.clearFiltersText}>Clear All Filters</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Dropdowns */}
      <SearchableDropdown
        options={filteredCities}
        value={selectedCity}
        onSelect={setSelectedCity}
        searchValue={citySearch}
        onSearchChange={setCitySearch}
        placeholder="City"
        isVisible={showCityDropdown}
        onClose={() => setShowCityDropdown(false)}
      />

      <SearchableDropdown
        options={filteredRoutes}
        value={selectedRoute}
        onSelect={setSelectedRoute}
        searchValue={routeSearch}
        onSearchChange={setRouteSearch}
        placeholder="Route"
        isVisible={showRouteDropdown}
        onClose={() => setShowRouteDropdown(false)}
      />

      <SearchableDropdown
        options={filteredGrades}
        value={selectedGrade}
        onSelect={setSelectedGrade as (value: string) => void}
        searchValue={gradeSearch}
        onSearchChange={setGradeSearch}
        placeholder="Grade"
        isVisible={showGradeDropdown}
        onClose={() => setShowGradeDropdown(false)}
      />

      {/* Customer List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text style={styles.loadingText}>Loading customers...</Text>
        </View>
      ) : (
        <FlatList
          data={sections}
          renderItem={renderSection}
          keyExtractor={section => section.title}
          contentContainerStyle={styles.listContainer}
          refreshing={isSyncing}
          onRefresh={() => loadCustomerList(true)}
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
    flex: 1,
    textAlign: 'left',
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
  filtersContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  filterSection: {
    marginBottom: 16,
  },
  filterSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 8,
  },
  groupByButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  groupByButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  groupByButtonActive: {
    backgroundColor: '#4A90E2',
  },
  groupByButtonText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  groupByButtonTextActive: {
    color: 'white',
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  filterButton: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
  },
  filterButtonThird: {
    flex: 1,
    minWidth: '30%',
  },
  filterButtonLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  filterButtonValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
    marginRight: 16,
  },
  filterButtonIcon: {
    position: 'absolute',
    right: 12,
    top: '50%',
    fontSize: 12,
    color: '#6B7280',
  },
  clearFiltersButton: {
    marginTop: 12,
    alignSelf: 'center',
  },
  clearFiltersText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownContainer: {
    width: '80%',
    maxHeight: '70%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
  },
  dropdownSearch: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  dropdownList: {
    maxHeight: '80%',
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  dropdownItemSelected: {
    backgroundColor: '#EBF5FF',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#374151',
  },
  dropdownItemTextSelected: {
    color: '#2563EB',
    fontWeight: '500',
  },
  filterToggle: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
  },
  filterToggleActive: {
    backgroundColor: '#4A90E2',
  },
  filterToggleText: {
    color: '#666',
    fontWeight: '600',
  },
  filterToggleTextActive: {
    color: 'white',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  sectionHeaderText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  locationWarning: {
    backgroundColor: '#FEF3C7',
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  locationWarningText: {
    color: '#92400E',
    fontSize: 14,
  },
  gradeFilterValue: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 16,
  },
  gradeIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
});

export default JourneyScreen; 