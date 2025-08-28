import React, { useState, useEffect } from 'react';
import {
  View,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  ScaledSize,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { loginAPI } from '../../../services/api';
import { storeUserData, getUserData, clearUserData } from '../../../services/storage';
import { createLoginStyles } from '../../../utils/styles/LoginScreen.styles';
import { fetchAndStoreAvatar, validateLoginInputs } from '../../../utils/authHelpers';
import { getUserLocation, getUserLocationFallback, UserLocation, sendUserLocationToBackend } from '../../../services/locationService';
import { logLocationInfo } from '../../../utils/locationUtils';
import { initLocalDb, openDatabase } from '../../../db';
import { getDashboardSummary } from '../../../services/api';
import { productService } from '../../../services/productService';
import { LoginHeader, LoginForm, LoginBranding } from '../components';
import NetInfo from '@react-native-community/netinfo';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));
  const [companyId, setCompanyId] = useState('');
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });

    return () => subscription?.remove();
  }, []);

  const collectUserLocation = async (): Promise<UserLocation | null> => {
    try {
      console.log('Attempting to get user location with high accuracy...');
      const location = await getUserLocation({
        enableHighAccuracy: true,
        timeout: 45000, // 45 seconds
      });
      
      setUserLocation(location);
      logLocationInfo(location, 'User Login Location (High Accuracy)');
      return location;
    } catch (error: any) {
      console.warn('High accuracy location failed, trying fallback:', error.message);
      
      try {
        const fallbackLocation = await getUserLocationFallback();
        setUserLocation(fallbackLocation);
        logLocationInfo(fallbackLocation, 'User Login Location (Fallback)');
        return fallbackLocation;
      } catch (fallbackError: any) {
        console.warn('Fallback location also failed:', fallbackError.message);
        return null;
      }
    }
  };

  const handleLogin = async () => {
    console.log('Login handler called');
    const validationError = validateLoginInputs(companyId, userId, password);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Step 0: Check network status
      const netState = await NetInfo.fetch();
      if (!netState.isConnected) {
        // Try to load dashboard and products from local DB
        try {
          const db = await openDatabase();
          // Dashboard
          const dashboardRes = await db.executeSql('SELECT data FROM dashboard ORDER BY updatedAt DESC LIMIT 1');
          const dashboardData = dashboardRes[0].rows.length > 0 ? JSON.parse(dashboardRes[0].rows.item(0).data) : null;
          // Products
          const productsRes = await db.executeSql('SELECT * FROM products');
          const products = [];
          for (let i = 0; i < productsRes[0].rows.length; i++) {
            products.push(productsRes[0].rows.item(i));
          }
          if (dashboardData && products.length > 0) {
            // Store in-memory or context if needed, then navigate
            navigation.replace('Dashboard');
            setIsLoading(false);
            return;
          } else {
            setError('No local data available. Please connect to the internet and try again.');
            setIsLoading(false);
            return;
          }
        } catch (localDbError) {
          setError('Failed to load local data. Please connect to the internet and try again.');
          setIsLoading(false);
          return;
        }
      }
      // Step 1: Call login API
      console.log('Calling login API...');
      const response = await loginAPI(companyId, userId, password);
      console.log('Login API successful');
      
      // Step 2: Store user data
      await storeUserData(response);
      console.log('User data stored successfully');

      // Step 2.5: Initialize local DB and sync dashboard/products
      try {
        const db = await initLocalDb();
        // Sync dashboard data
        const dashboardData = await getDashboardSummary(response.exeId);
        if (dashboardData) {
          console.log('Upserting dashboard data:', dashboardData);
          await db.executeSql('INSERT OR REPLACE INTO dashboard (id, data, updatedAt) VALUES (?, ?, ?)', [1, JSON.stringify(dashboardData), new Date().toISOString()]);
        } else {
          console.warn('Dashboard data is null or undefined, skipping insert.');
        }
        // Sync products data
        const allProducts = (await productService.getProducts()) || [];
        for (const p of allProducts) {
          if (!p) {
            console.warn('Skipping null/undefined product:', p);
            continue;
          }
          console.log('Upserting product:', p);
          await db.executeSql(
            `INSERT OR REPLACE INTO products (id, itemCode, description, price, qty, uom, imageUrl, discountPercentage, discountAmount, category, subCategory) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [p.itemCode, p.itemCode, p.description, p.price, p.qty, p.uom, p.imageUrl || '', p.discountPercentage, p.discountAmount, p.category, p.subCategory]
          );
        }
        console.log('Local DB sync complete');
      } catch (dbError) {
        console.error('Local DB sync failed:', dbError);
      }
      
      // Step 3: Fetch and store avatar if available
      if (response.imageLocation) {
        try {
          await fetchAndStoreAvatar(response.imageLocation);
          console.log('Avatar stored successfully');
        } catch (avatarError) {
          console.warn('Avatar fetch failed, but login continues:', avatarError);
        }
      }

      // Step 4: NOW collect user location (after successful authentication)
      console.log('Login successful, now collecting user location...');
      const location = await collectUserLocation();
      if (location) {
        console.log('Location collection completed successfully');
        // Send location to backend
        await sendUserLocationToBackend({
          exeId: response.exeId,
          latitude: location.latitude,
          longitude: location.longitude,
        });
      } else {
        console.log('Location collection failed, but login continues');
      }
      
      // Step 5: Navigate to Dashboard
      console.log('Navigating to Dashboard...');
      navigation.replace('Dashboard');
    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.message || 'Failed to login. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const styles = createLoginStyles(dimensions);

  return (
    <LinearGradient
      colors={['#00E5B0', '#0066FF']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <StatusBar
        backgroundColor="transparent"
        translucent
        barStyle="light-content"
      />
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
        >
          <View style={styles.contentContainer}>
            <LoginHeader styles={styles} />
            
            <LoginForm
              styles={styles}
              companyId={companyId}
              userId={userId}
              password={password}
              error={error}
              isLoading={isLoading}
              onCompanyIdChange={setCompanyId}
              onUserIdChange={setUserId}
              onPasswordChange={setPassword}
              onLogin={handleLogin}
            />
            
            <LoginBranding styles={styles} />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default LoginScreen; 