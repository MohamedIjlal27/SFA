import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import PermissionService from '../../../services/permissionService';
import { setFirstTimeFlag } from '../../../services/storage';

type Props = NativeStackScreenProps<RootStackParamList, 'PermissionRequest'>;

const PermissionRequestScreen: React.FC<Props> = ({ navigation }) => {
  const [isRequesting, setIsRequesting] = useState(false);

  const handleRequestPermissions = async () => {
    setIsRequesting(true);
    
    try {
      const permissionService = PermissionService.getInstance();
      const status = await permissionService.requestAllPermissions();
      
      // Set first time flag regardless of permission status
      await setFirstTimeFlag();
      
      if (status.allGranted) {
        navigation.replace('Login');
      } else {
        Alert.alert(
          'Permissions Partially Granted',
          'Some permissions were not granted. You can still use the app, but some features may be limited.',
          [
            {
              text: 'Continue to Login',
              onPress: () => navigation.replace('Login'),
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
      Alert.alert(
        'Permission Error',
        'There was an error requesting permissions. You can continue to login and grant permissions later.',
        [
          {
            text: 'Continue to Login',
            onPress: () => navigation.replace('Login'),
          },
        ]
      );
    } finally {
      setIsRequesting(false);
    }
  };

  const handleSkipPermissions = async () => {
    Alert.alert(
      'Skip Permissions',
      'You can still use the app, but some features like camera and file uploads may not work.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Skip & Continue', 
          onPress: async () => {
            await setFirstTimeFlag();
            navigation.replace('Login');
          }
        },
      ]
    );
  };

  return (
    <LinearGradient
      colors={['#00E5B0', '#0066FF']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <StatusBar backgroundColor="transparent" translucent barStyle="light-content" />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Welcome to SFA</Text>
            <Text style={styles.subtitle}>
              We need a few permissions to provide you with the best experience
            </Text>
          </View>

          <View style={styles.permissionsContainer}>
            <View style={styles.permissionItem}>
              <Text style={styles.iconText}>📷</Text>
              <View style={styles.permissionContent}>
                <Text style={styles.permissionTitle}>Camera Access</Text>
                <Text style={styles.permissionDescription}>
                  Take photos of documents, cheques, and receipts
                </Text>
              </View>
            </View>

            <View style={styles.permissionItem}>
              <Text style={styles.iconText}>📁</Text>
              <View style={styles.permissionContent}>
                <Text style={styles.permissionTitle}>Storage Access</Text>
                <Text style={styles.permissionDescription}>
                  Select images and documents from your device
                </Text>
              </View>
            </View>

            <View style={styles.permissionItem}>
              <Text style={styles.iconText}>📂</Text>
              <View style={styles.permissionContent}>
                <Text style={styles.permissionTitle}>File Manager Access</Text>
                <Text style={styles.permissionDescription}>
                  Access device files and folders for document uploads
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.primaryButton, isRequesting && styles.buttonDisabled]}
              onPress={handleRequestPermissions}
              disabled={isRequesting}
            >
              {isRequesting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>Grant Permissions</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton} onPress={handleSkipPermissions}>
              <Text style={styles.secondaryButtonText}>Skip for Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    opacity: 0.9,
    lineHeight: 24,
  },
  permissionsContainer: { marginBottom: 30 },
  permissionItem: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
  },
  iconText: { fontSize: 24, marginRight: 16 },
  permissionContent: { flex: 1 },
  permissionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  permissionDescription: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
  },
  buttonContainer: { marginBottom: 40 },
  primaryButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonDisabled: { opacity: 0.6 },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0066FF',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default PermissionRequestScreen;
