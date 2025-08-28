import { StyleSheet } from 'react-native';

export const createErrorStateStyles = () => {
  return StyleSheet.create({
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
      paddingVertical: 24,
    },
    errorIcon: {
      fontSize: 64,
      marginBottom: 16,
    },
    errorTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#EF4444',
      textAlign: 'center',
      marginBottom: 8,
    },
    errorMessage: {
      fontSize: 16,
      color: '#6B7280',
      textAlign: 'center',
      marginBottom: 24,
      lineHeight: 24,
    },
    retryButton: {
      backgroundColor: '#4A90E2',
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
      marginBottom: 12,
    },
    retryButtonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
    },
    contactSupportButton: {
      backgroundColor: 'transparent',
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#D1D5DB',
    },
    contactSupportButtonText: {
      color: '#6B7280',
      fontSize: 14,
      fontWeight: '500',
    },
  });
}; 