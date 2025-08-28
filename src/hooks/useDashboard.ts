import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { getUserData, getUserAvatar, clearUserData } from '../services/storage';
import { LoginResponse, getDashboardSummary, DashboardSummary } from '../services/api';
import NetInfo from '@react-native-community/netinfo';
import { openDatabase } from '../db';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const currentYear = new Date().getFullYear();
const currentMonth = (new Date().getMonth() + 1).toString().padStart(2, '0');

export const useDashboard = () => {
  const navigation = useNavigation<NavigationProp>();
  const [refreshing, setRefreshing] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [userData, setUserData] = useState<LoginResponse | null>(null);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [isDayStarted, setIsDayStarted] = useState(false);
  const [showDayToggleModal, setShowDayToggleModal] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dashboardData, setDashboardData] = useState<DashboardSummary | null>(null);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(true);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth);
  const [selectedYear, setSelectedYear] = useState<string>(currentYear.toString());
  const [showMonthYearModal, setShowMonthYearModal] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const loadDashboardData = useCallback(async (executiveId: string, month?: string, year?: string) => {
    try {
      setIsLoadingDashboard(true);
      setDashboardError(null);
      // Check network status
      const netState = await NetInfo.fetch();
      if (!netState.isConnected) {
        // Try to load from local DB
        try {
          const db = await openDatabase();
          const dashboardRes = await db.executeSql('SELECT data FROM dashboard ORDER BY updatedAt DESC LIMIT 1');
          const dashboardData = dashboardRes[0].rows.length > 0 ? JSON.parse(dashboardRes[0].rows.item(0).data) : null;
          if (dashboardData) {
            setDashboardData(dashboardData);
            setDashboardError(null);
            return;
          } else {
            setDashboardError('No local dashboard data available. Please connect to the internet and try again.');
            setDashboardData(null);
            return;
          }
        } catch (localDbError) {
          setDashboardError('Failed to load local dashboard data. Please connect to the internet and try again.');
          setDashboardData(null);
          return;
        }
      }
      // Online: fetch from API
      const data = await getDashboardSummary(executiveId, month, year);
      setDashboardData(data);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      
      let errorMessage = 'Unable to load dashboard data. Please try again.';
      
      if (error instanceof Error) {
        if (error.message.includes('404')) {
          errorMessage = 'Dashboard data is currently unavailable. Please try again later.';
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = 'Network connection issue. Please check your internet connection and try again.';
        } else if (error.message.includes('timeout')) {
          errorMessage = 'Request timed out. Please try again.';
        } else if (error.message.includes('401') || error.message.includes('403')) {
          errorMessage = 'Authentication error. Please log in again.';
        }
      }
      
      setDashboardError(errorMessage);
      setDashboardData(null);
    } finally {
      setIsLoadingDashboard(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (userData) {
      await loadDashboardData(userData.exeId, selectedMonth, selectedYear);
    }
    setRefreshing(false);
  }, [userData, selectedMonth, selectedYear, loadDashboardData]);

  const handleLogout = () => setShowLogoutModal(true);

  const confirmLogout = async () => {
    try {
      await clearUserData();
      setShowLogoutModal(false);
      setSnackbarMessage('Successfully logged out');
      setSnackbarVisible(true);
      navigation.replace('Login');
    } catch (error) {
      console.error('Error during logout:', error);
      setShowLogoutModal(false);
      setSnackbarMessage('Error logging out. Please try again.');
      setSnackbarVisible(true);
    }
  };

  const handleDayToggle = () => setShowDayToggleModal(true);

  const confirmDayToggle = async () => {
    try {
      setIsDayStarted(!isDayStarted);
      setShowDayToggleModal(false);
      
      if (!isDayStarted) {
        console.log('Day started at:', new Date().toISOString());
        setSnackbarMessage('Day started successfully!');
        setSnackbarVisible(true);
      } else {
        console.log('Day ended at:', new Date().toISOString());
        setSnackbarMessage('Day ended successfully!');
        setSnackbarVisible(true);
      }
    } catch (error) {
      console.error('Error toggling day state:', error);
      setIsDayStarted(isDayStarted);
      setSnackbarMessage('Error updating day status. Please try again.');
      setSnackbarVisible(true);
    }
  };

  const handleRefresh = () => {
    if (userData) {
      loadDashboardData(userData.exeId, selectedMonth, selectedYear);
    }
  };

  const handleNotification = () => {
    console.log('Notification pressed');
    setSnackbarMessage('Notifications coming soon!');
    setSnackbarVisible(true);
  };

  const handleStartJourney = () => navigation.navigate('Journey');
  const handleViewDueList = () => navigation.navigate('MultiCustomerDueList');
  const handleNewLead = () => {
    setSnackbarMessage('New Lead feature coming soon!');
    setSnackbarVisible(true);
  };

  // Load user data on mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const data = await getUserData();
        const avatar = await getUserAvatar();
        
        if (!data) {
          navigation.replace('Login');
          return;
        }
        
        setUserData(data);
        setUserAvatar(avatar);
        await loadDashboardData(data.exeId);
      } catch (error) {
        console.error('Error loading user data:', error);
        Alert.alert(
          'Data Loading Error',
          'There was an issue loading your profile data. Please try again.',
          [
            { text: 'Try Again', onPress: () => loadUserData() },
            { text: 'Logout', onPress: () => navigation.replace('Login') }
          ]
        );
      }
    };

    loadUserData();
  }, [navigation, loadDashboardData]);

  // Update dashboard when month/year changes
  useEffect(() => {
    if (userData) {
      loadDashboardData(userData.exeId, selectedMonth, selectedYear);
    }
  }, [selectedMonth, selectedYear, userData, loadDashboardData]);

  // Update current date every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDate(new Date());
    }, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return {
    // State
    refreshing,
    userData,
    userAvatar,
    isDayStarted,
    showLogoutModal,
    showDayToggleModal,
    currentDate,
    dashboardData,
    isLoadingDashboard,
    dashboardError,
    selectedMonth,
    selectedYear,
    showMonthYearModal,
    snackbarVisible,
    snackbarMessage,
    
    // Setters
    setSelectedMonth,
    setSelectedYear,
    setShowMonthYearModal,
    setSnackbarVisible,
    
    // Handlers
    onRefresh,
    handleLogout,
    confirmLogout,
    handleDayToggle,
    confirmDayToggle,
    handleRefresh,
    handleNotification,
    handleStartJourney,
    handleViewDueList,
    handleNewLead,
    
    // Modal handlers
    onDismissLogout: () => setShowLogoutModal(false),
    onDismissDayToggle: () => setShowDayToggleModal(false),
  };
}; 