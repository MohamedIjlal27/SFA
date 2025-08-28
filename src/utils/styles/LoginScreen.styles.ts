import { StyleSheet, Dimensions, ScaledSize } from 'react-native';

const isTablet = (dimensions: ScaledSize) => Math.min(dimensions.width, dimensions.height) >= 768;
const isLandscape = (dimensions: ScaledSize) => dimensions.width > dimensions.height;

export const createLoginStyles = (dimensions: ScaledSize) => {
  const tablet = isTablet(dimensions);
  const landscape = isLandscape(dimensions);
  
  return StyleSheet.create({
    container: {
      flex: 1,
      width: '100%',
      height: '100%',
    },
    safeArea: {
      flex: 1,
      width: '100%',
    },
    keyboardAvoidingView: {
      flex: 1,
      width: '100%',
    },
    contentContainer: {
      flex: 1,
      paddingHorizontal: tablet ? (landscape ? 40 : 32) : 20,
      paddingVertical: tablet ? 20 : 10,
      justifyContent: 'space-between',
      alignItems: 'center',
      width: '100%',
    },
    headerContainer: {
      alignItems: 'center',
      marginTop: tablet ? (landscape ? 20 : 100) : 20,
      width: '100%',
    },
    logoContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: tablet ? 16 : 10,
    },
    logoImage: {
      width: tablet ? (landscape ? 40 : 60) : 35,
      height: tablet ? (landscape ? 40 : 60) : 35,
      marginRight: 10,
    },
    logoTextContainer: {
      flexDirection: 'row',
    },
    logoTextLight: {
      fontSize: tablet ? (landscape ? 48 : 54) : 42,
      fontWeight: '300',
      color: 'white',
      letterSpacing: 2,
    },
    logoTextBold: {
      fontSize: tablet ? (landscape ? 48 : 54) : 42,
      fontWeight: '700',
      color: 'white',
      letterSpacing: 2,
    },
    versionContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      width: 'auto',
      minWidth: tablet ? 200 : 180,
      maxWidth: tablet ? 300 : 250,
      marginBottom: tablet ? 30 : 20,
    },
    versionText: {
      color: 'white',
      fontSize: tablet ? 16 : 14,
      marginRight: 20,
    },
    editionBadge: {
      backgroundColor: 'rgba(0, 0, 0, 0.2)',
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 16,
    },
    editionText: {
      color: 'white',
      fontSize: tablet ? 14 : 12,
      fontWeight: '600',
    },
    formContainer: {
      width: '100%',
      maxWidth: tablet ? 450 : 350,
      backgroundColor: 'white',
      borderRadius: 16,
      padding: tablet ? 32 : 24,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.2,
      shadowRadius: 3.84,
    },
    inputContainer: {
      marginBottom: tablet ? 24 : 20,
    },
    label: {
      fontSize: tablet ? 16 : 14,
      color: '#333',
      marginBottom: 8,
      fontWeight: '600',
    },
    input: {
      backgroundColor: 'white',
      borderWidth: 1,
      borderColor: '#ddd',
      borderRadius: 8,
      padding: tablet ? 14 : 10,
      fontSize: tablet ? 16 : 14,
      color: '#333',
      height: tablet ? 50 : 40,
    },
    loginButton: {
      backgroundColor: '#0066FF',
      borderRadius: 8,
      padding: tablet ? 16 : 14,
      alignItems: 'center',
      marginTop: tablet ? 32 : 20,
      height: tablet ? 60 : 52,
      justifyContent: 'center',
    },
    loginButtonText: {
      color: 'white',
      fontSize: tablet ? 18 : 16,
      fontWeight: '600',
    },
    brandingContainer: {
      alignItems: 'center',
      marginTop: 5,
      marginBottom: tablet ? 20 : 15,
    },
    synqopsLogoText: {
      fontSize: tablet ? 20 : 18,
      fontWeight: 'bold',
      color: 'rgba(255, 255, 255, 0.8)',
      letterSpacing: 2,
      marginBottom: 8,
    },
    copyrightText: {
      color: 'rgba(255, 255, 255, 0.7)',
      fontSize: tablet ? 14 : 12,
      textAlign: 'center',
    },
    errorContainer: {
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      padding: 12,
      borderRadius: 8,
      marginBottom: 16,
    },
    errorText: {
      color: '#EF4444',
      fontSize: 14,
      textAlign: 'center',
    },
    loginButtonDisabled: {
      opacity: 0.7,
    },
  });
}; 