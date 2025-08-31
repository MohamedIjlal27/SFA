import React, { useState, useEffect } from 'react';
import { View, ScrollView, StatusBar, RefreshControl, Dimensions, ScaledSize, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Snackbar, useTheme } from 'react-native-paper';
import LinearGradient from 'react-native-linear-gradient';
import { useDispatch, useSelector } from 'react-redux';
import { setLastSyncTime, selectLastSyncTime } from '../../redux/syncSlice';

// Components
import {
  DashboardHeader,
  ProfileCard,
  SessionCard,
  DashboardStats,
  DashboardTasks,
  DashboardDialogs,
  MonthYearPickerModal,
} from '../../components';

// Custom hook
import { useDashboard } from '../../hooks/useDashboard';
import { productService } from '../../services/productService';
import { openDatabase, createTables } from '../../db';
import { getDashboardSummary } from '../../services/api';

// Styles
import { createDashboardScreenStyles } from '../../utils/styles/DashboardScreen.styles';

const monthLabels = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const DashboardScreen = () => {
  const theme = useTheme();
  const [dimensions, setDimensions] = useState<ScaledSize>(Dimensions.get('window'));
  const styles = createDashboardScreenStyles(dimensions);
  const dispatch = useDispatch();
  const lastSyncTime = useSelector(selectLastSyncTime);

  // Fade-in animation for main content
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });
    return () => subscription?.remove();
  }, []);
  
  const {
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
    onDismissLogout,
    onDismissDayToggle,
  } = useDashboard();

  // Fetch last sync time on mount
  useEffect(() => {
    const fetchSyncTime = async () => {
      const syncTime = await productService.getLastSyncTime();
      dispatch(setLastSyncTime(syncTime));
    };
    fetchSyncTime();
  }, []);

  // Update sync time after refresh/sync
  const handleRefreshWithSyncTime = async () => {
    // Sync dashboard and products from API to local DB (upsert)
    try {
      const db = await openDatabase();
      await createTables(db); // Ensure tables exist before syncing
      if (userData?.exeId) {
        // Dashboard upsert
        const dashboardData = await getDashboardSummary(userData.exeId);
        if (dashboardData) {
          await db.executeSql('INSERT OR REPLACE INTO dashboard (id, data, updatedAt) VALUES (?, ?, ?)', [1, JSON.stringify(dashboardData), new Date().toISOString()]);
        }
      }
      // Products upsert
      const allProducts = (await productService.getProducts()) || [];
      for (const p of allProducts) {
        if (!p) continue;
        await db.executeSql(
          `INSERT OR REPLACE INTO products (id, itemCode, description, price, qty, uom, imageUrl, discountPercentage, discountAmount, category, subCategory) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [p.itemCode, p.itemCode, p.description, p.price, p.qty, p.uom, p.imageUrl || '', p.discountPercentage, p.discountAmount, p.category, p.subCategory]
        );
      }
    } catch (err) {
      console.error('Error during dashboard/products sync:', err);
    }
    await handleRefresh();
    const syncTime = await productService.getLastSyncTime();
    dispatch(setLastSyncTime(syncTime));
  };

  return (
    <LinearGradient
      colors={[theme.colors.background, '#f5f7fa']}
      style={{ flex: 1 }}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: 'transparent', paddingHorizontal: 12, paddingTop: 8 }]} edges={['top']}>
        <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} translucent={false} />
        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          {/* Header */}
          <View style={{ marginBottom: 12, borderRadius: 18, overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8 }}>
            <DashboardHeader 
              onRefresh={handleRefreshWithSyncTime}
              onNotification={handleNotification}
            />
          </View>

          {/* Profile Card */}
          <View style={{ marginBottom: 16, borderRadius: 18, overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8 }}>
            <ProfileCard 
              userData={userData}
              userAvatar={userAvatar}
              onLogout={handleLogout}
            />
          </View>

          {/* Session Card */}
          <View style={{ marginBottom: 18, borderRadius: 18, overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8 }}>
            <SessionCard 
              currentDate={currentDate}
              isDayStarted={isDayStarted}
              onDayToggle={handleDayToggle}
            />
          </View>

          <ScrollView 
            style={[styles.scrollView, { backgroundColor: '#f8fafc', borderRadius: 18, padding: 8 }]}
            contentContainerStyle={{ paddingBottom: 32 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={theme.colors.primary}
                colors={[theme.colors.primary, theme.colors.secondary]}
                progressBackgroundColor={theme.colors.background}
              />
            }
          >
            {/* Achievements Section */}
            <View style={[styles.section, { marginBottom: 24 }]}> 
              <DashboardStats
                isLoading={isLoadingDashboard}
                dashboardError={dashboardError}
                dashboardData={dashboardData}
                selectedMonth={selectedMonth}
                selectedYear={selectedYear}
                monthLabels={monthLabels}
                onRetry={() => userData && handleRefresh()}
                onMonthYearPress={() => setShowMonthYearModal(true)}
              />
            </View>

            {/* Tasks Section */}
            <View style={[styles.section, { marginBottom: 24 }]}> 
              <DashboardTasks
                onStartJourney={handleStartJourney}
                onViewRoute={handleNewLead}
                onViewDueList={handleViewDueList}
              />
            </View>
          </ScrollView>

          {/* Dialogs */}
          <DashboardDialogs
            showLogoutModal={showLogoutModal}
            showDayToggleModal={showDayToggleModal}
            isDayStarted={isDayStarted}
            onDismissLogout={onDismissLogout}
            onDismissDayToggle={onDismissDayToggle}
            onConfirmLogout={confirmLogout}
            onConfirmDayToggle={confirmDayToggle}
          />

          {/* Snackbar for notifications */}
          <Snackbar
            visible={snackbarVisible}
            onDismiss={() => setSnackbarVisible(false)}
            duration={3000}
            action={{
              label: 'Dismiss',
              onPress: () => setSnackbarVisible(false),
            }}
            style={{ borderRadius: 12, margin: 8 }}
          >
            {snackbarMessage}
          </Snackbar>

          {/* Month/Year Picker Modal */}
          <MonthYearPickerModal
            visible={showMonthYearModal}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            monthOptions={Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'))}
            yearOptions={Array.from({ length: (new Date().getFullYear() + 2) - 2020 }, (_, i) => (2020 + i).toString())}
            monthLabels={monthLabels}
            onMonthChange={setSelectedMonth}
            onYearChange={setSelectedYear}
            onClose={() => setShowMonthYearModal(false)}
          />
        </Animated.View>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default DashboardScreen; 