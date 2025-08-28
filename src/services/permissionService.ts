import { Platform, Alert, PermissionsAndroid, Linking } from 'react-native';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';

export interface PermissionStatus {
  granted: boolean;
  denied: boolean;
  blocked: boolean;
  unavailable: boolean;
  limited?: boolean;
}

export interface PermissionConfig {
  title: string;
  message: string;
  buttonPositive: string;
  buttonNegative: string;
  buttonNeutral?: string;
}

export class PermissionService {
  private static instance: PermissionService;

  private constructor() {}

  public static getInstance(): PermissionService {
    if (!PermissionService.instance) {
      PermissionService.instance = new PermissionService();
    }
    return PermissionService.instance;
  }

  /**
   * Request location permissions with proper handling
   */
  public async requestLocationPermissions(): Promise<PermissionStatus> {
    try {
      console.log('Requesting location permissions...');

      if (Platform.OS === 'ios') {
        return await this.requestIOSLocationPermissions();
      } else {
        return await this.requestAndroidLocationPermissions();
      }
    } catch (error) {
      console.error('Error requesting location permissions:', error);
      return {
        granted: false,
        denied: true,
        blocked: false,
        unavailable: false,
      };
    }
  }

  /**
   * Request iOS location permissions
   */
  private async requestIOSLocationPermissions(): Promise<PermissionStatus> {
    try {
      // Check current permission status
      const currentStatus = await check(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
      
      console.log('Current iOS location permission status:', currentStatus);

      if (currentStatus === RESULTS.GRANTED) {
        return {
          granted: true,
          denied: false,
          blocked: false,
          unavailable: false,
        };
      }

      if (currentStatus === RESULTS.BLOCKED) {
        // Show alert to open settings
        this.showPermissionSettingsAlert('Location');
        return {
          granted: false,
          denied: false,
          blocked: true,
          unavailable: false,
        };
      }

      // Request permission
      const result = await request(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
      
      console.log('iOS location permission request result:', result);

      return {
        granted: result === RESULTS.GRANTED,
        denied: result === RESULTS.DENIED,
        blocked: result === RESULTS.BLOCKED,
        unavailable: result === RESULTS.UNAVAILABLE,
        limited: result === RESULTS.LIMITED,
      };
    } catch (error) {
      console.error('Error requesting iOS location permissions:', error);
      throw error;
    }
  }

  /**
   * Request Android location permissions
   */
  private async requestAndroidLocationPermissions(): Promise<PermissionStatus> {
    try {
      console.log('Requesting Android location permissions...');

      // Check if permissions are already granted
      const fineLocationGranted = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
      
      const coarseLocationGranted = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION
      );

      if (fineLocationGranted && coarseLocationGranted) {
        console.log('Android location permissions already granted');
        return {
          granted: true,
          denied: false,
          blocked: false,
          unavailable: false,
        };
      }

      // Request permissions
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
      ], {
        title: 'Location Permission',
        message: 'This app needs access to your location to provide better service and track your activities.',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      });

      console.log('Android location permission results:', granted);

      const fineLocationResult = granted[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION];
      const coarseLocationResult = granted[PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION];

      const isGranted = fineLocationResult === 'granted' || coarseLocationResult === 'granted';
      const isDenied = fineLocationResult === 'denied' || coarseLocationResult === 'denied';
      const isBlocked = fineLocationResult === 'never_ask_again' || coarseLocationResult === 'never_ask_again';

      if (isBlocked) {
        this.showPermissionSettingsAlert('Location');
      }

      return {
        granted: isGranted,
        denied: isDenied && !isBlocked,
        blocked: isBlocked,
        unavailable: false,
      };
    } catch (error) {
      console.error('Error requesting Android location permissions:', error);
      throw error;
    }
  }

  /**
   * Show permission settings alert
   */
  private showPermissionSettingsAlert(permissionType: string): void {
    Alert.alert(
      `${permissionType} Permission Required`,
      `This app needs ${permissionType.toLowerCase()} permission to function properly. Please enable it in your device settings.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Open Settings',
          onPress: () => this.openAppSettings(),
        },
      ],
      { cancelable: false }
    );
  }

  /**
   * Open app settings
   */
  private openAppSettings(): void {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings();
    }
  }

  /**
   * Check if location permissions are granted
   */
  public async checkLocationPermissions(): Promise<boolean> {
    try {
      if (Platform.OS === 'ios') {
        const status = await check(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
        return status === RESULTS.GRANTED;
      } else {
        const fineLocationGranted = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        const coarseLocationGranted = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION
        );
        return fineLocationGranted || coarseLocationGranted;
      }
    } catch (error) {
      console.error('Error checking location permissions:', error);
      return false;
    }
  }

  /**
   * Request location permission with user-friendly dialog
   */
  public async requestLocationPermissionWithDialog(): Promise<boolean> {
    try {
      // Show custom permission dialog first
      const userConsent = await this.showLocationPermissionDialog();
      
      if (!userConsent) {
        console.log('User declined location permission dialog');
        return false;
      }

      // Request actual permission
      const permissionStatus = await this.requestLocationPermissions();
      
      if (permissionStatus.granted) {
        console.log('Location permission granted');
        return true;
      } else if (permissionStatus.blocked) {
        console.log('Location permission blocked');
        Alert.alert(
          'Permission Required',
          'Location permission is required for this app. Please enable it in your device settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => this.openAppSettings() },
          ]
        );
        return false;
      } else {
        console.log('Location permission denied');
        Alert.alert(
          'Permission Denied',
          'Location permission was denied. Some features may not work properly.',
          [{ text: 'OK' }]
        );
        return false;
      }
    } catch (error) {
      console.error('Error requesting location permission with dialog:', error);
      return false;
    }
  }

  /**
   * Show custom location permission dialog
   */
  private showLocationPermissionDialog(): Promise<boolean> {
    return new Promise((resolve) => {
      Alert.alert(
        'Location Access',
        'This app needs access to your location to provide better service and track your activities. Would you like to grant location permission?',
        [
          {
            text: 'Not Now',
            style: 'cancel',
            onPress: () => resolve(false),
          },
          {
            text: 'Allow',
            onPress: () => resolve(true),
          },
        ],
        { cancelable: false }
      );
    });
  }

  /**
   * Request camera permissions
   */
  public async requestCameraPermissions(): Promise<PermissionStatus> {
    try {
      if (Platform.OS === 'ios') {
        const result = await request(PERMISSIONS.IOS.CAMERA);
        return {
          granted: result === RESULTS.GRANTED,
          denied: result === RESULTS.DENIED,
          blocked: result === RESULTS.BLOCKED,
          unavailable: result === RESULTS.UNAVAILABLE,
        };
      } else {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'This app needs access to your camera to take photos.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );

        return {
          granted: granted === 'granted',
          denied: granted === 'denied',
          blocked: granted === 'never_ask_again',
          unavailable: false,
        };
      }
    } catch (error) {
      console.error('Error requesting camera permissions:', error);
      return {
        granted: false,
        denied: true,
        blocked: false,
        unavailable: false,
      };
    }
  }

  /**
   * Request storage permissions
   */
  public async requestStoragePermissions(): Promise<PermissionStatus> {
    try {
      if (Platform.OS === 'ios') {
        // iOS doesn't have storage permissions like Android
        return {
          granted: true,
          denied: false,
          blocked: false,
          unavailable: false,
        };
      } else {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        ]);

        const writeGranted = granted[PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE] === 'granted';
        const readGranted = granted[PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE] === 'granted';

        return {
          granted: writeGranted && readGranted,
          denied: !writeGranted || !readGranted,
          blocked: false,
          unavailable: false,
        };
      }
    } catch (error) {
      console.error('Error requesting storage permissions:', error);
      return {
        granted: false,
        denied: true,
        blocked: false,
        unavailable: false,
      };
    }
  }
}

// Export singleton instance
export const permissionService = PermissionService.getInstance();
