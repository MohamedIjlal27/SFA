import { Platform, PermissionsAndroid, Alert } from 'react-native';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';

export interface PermissionStatus {
  camera: boolean;
  storage: boolean;
  fileManager: boolean;
  allGranted: boolean;
}

class PermissionService {
  private static instance: PermissionService;
  private permissionStatus: PermissionStatus = {
    camera: false,
    storage: false,
    fileManager: false,
    allGranted: false,
  };

  private constructor() {}

  public static getInstance(): PermissionService {
    if (!PermissionService.instance) {
      PermissionService.instance = new PermissionService();
    }
    return PermissionService.instance;
  }

  public async requestAllPermissions(): Promise<PermissionStatus> {
    if (Platform.OS === 'android') {
      const cameraPermission = await this.requestCameraPermission();
      const storagePermission = await this.requestStoragePermission();
      const fileManagerPermission = await this.requestFileManagerPermission();

      this.permissionStatus = {
        camera: cameraPermission,
        storage: storagePermission,
        fileManager: fileManagerPermission,
        allGranted: cameraPermission && storagePermission && fileManagerPermission,
      };

      // Show a single alert if any permissions were denied
      if (!this.permissionStatus.allGranted) {
        Alert.alert(
          'Permissions Required',
          'Some permissions are required for full app functionality. You can grant them later in Settings if needed.',
          [
            { text: 'Continue', style: 'default' },
          ]
        );
      }
    } else {
      // iOS permissions are handled differently and usually requested when needed
      this.permissionStatus = {
        camera: true,
        storage: true,
        fileManager: true,
        allGranted: true,
      };
    }

    return this.permissionStatus;
  }

  public async requestCameraPermission(): Promise<boolean> {
    if (Platform.OS === 'android') {
      try {
        const result = await request(PERMISSIONS.ANDROID.CAMERA);
        return result === 'granted';
      } catch (err) {
        console.warn('Camera permission request failed:', err);
        return false;
      }
    }
    return true; // iOS handles this differently
  }

  public async requestStoragePermission(): Promise<boolean> {
    if (Platform.OS === 'android') {
      try {
        // For Android 13+ (API 33+), we need to request different permissions
        if (Platform.Version >= 33) {
          // Android 13+ uses READ_MEDIA_* permissions
          const photoPermission = await request(PERMISSIONS.ANDROID.READ_MEDIA_IMAGES);
          const videoPermission = await request(PERMISSIONS.ANDROID.READ_MEDIA_VIDEO);
          
          // For documents, we might need additional permissions
          let documentPermission = 'granted';
          try {
            documentPermission = await request(PERMISSIONS.ANDROID.READ_MEDIA_AUDIO);
          } catch (e) {
            // READ_MEDIA_AUDIO might not be available, try alternative approach
            console.log('READ_MEDIA_AUDIO not available, using alternative');
          }

          return (
            photoPermission === 'granted' &&
            videoPermission === 'granted' &&
            documentPermission === 'granted'
          );
        } else {
          // For Android 12 and below, use the old storage permissions
          const readPermission = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
            {
              title: 'Storage Permission',
              message: 'This app needs access to your storage to select and save documents.',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
            },
          );

          const writePermission = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
            {
              title: 'Storage Permission',
              message: 'This app needs write access to save files.',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            },
          );

          return (
            readPermission === PermissionsAndroid.RESULTS.GRANTED &&
            writePermission === PermissionsAndroid.RESULTS.GRANTED
          );
        }
      } catch (err) {
        console.warn('Storage permission request failed:', err);
        return false;
      }
    }
    return true; // iOS handles this differently
  }

  public async requestFileManagerPermission(): Promise<boolean> {
    if (Platform.OS === 'android') {
      try {
        // File manager access is typically included in storage permissions
        // For Android 13+, we need to request additional permissions for file access
        if (Platform.Version >= 33) {
          // Request MANAGE_EXTERNAL_STORAGE for full file access (requires special permission)
          // Note: This is a special permission that requires user to go to settings
          const storagePermission = await this.requestStoragePermission();
          
          // For file manager access, we might need to check if we can access all files
          // This is a complex permission that might require user to enable "Allow management of all files"
          return storagePermission;
        } else {
          // For older Android versions, storage permission includes file manager access
          return await this.requestStoragePermission();
        }
      } catch (err) {
        console.warn('File manager permission request failed:', err);
        return false;
      }
    }
    return true; // iOS handles this differently
  }

  public getPermissionStatus(): PermissionStatus {
    return { ...this.permissionStatus };
  }

  public async checkAndRequestPermission(permissionType: 'camera' | 'storage'): Promise<boolean> {
    if (permissionType === 'camera') {
      return await this.requestCameraPermission();
    } else if (permissionType === 'storage') {
      return await this.requestStoragePermission();
    }
    return false;
  }

  public showPermissionSettingsAlert() {
    Alert.alert(
      'Permissions Required',
      'Some features require permissions. Please go to Settings and grant the required permissions.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Settings', onPress: () => {
          // TODO: Open app settings
          console.log('Open app settings');
        }},
      ]
    );
  }
}

export default PermissionService;
