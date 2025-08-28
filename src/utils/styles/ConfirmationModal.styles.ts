import { StyleSheet } from 'react-native';

export const createConfirmationModalStyles = () => {
  return StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: '#f9fafb',
      borderRadius: 28,
      width: '85%',
      maxWidth: 420,
      paddingTop: 28,
      paddingBottom: 22,
      paddingHorizontal: 18,
      elevation: 8,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 8,
      },
      shadowOpacity: 0.18,
      shadowRadius: 16,
    },
    modalHeader: {
      alignItems: 'center',
      marginBottom: 18,
    },
    modalTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#1F2937',
      letterSpacing: 0.2,
    },
    modalMessage: {
      fontSize: 17,
      color: '#4B5563',
      textAlign: 'center',
      paddingHorizontal: 28,
      marginBottom: 28,
      fontWeight: '500',
    },
    modalActions: {
      flexDirection: 'row',
      justifyContent: 'center',
      paddingHorizontal: 16,
      gap: 16,
    },
    modalButton: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 16,
      alignItems: 'center',
      maxWidth: 170,
      transform: [{ scale: 1 }],
    },
    cancelButton: {
      backgroundColor: '#F3F4F6',
    },
    cancelButtonText: {
      color: '#4B5563',
      fontSize: 17,
      fontWeight: '700',
      letterSpacing: 0.1,
    },
    confirmButton: {
      backgroundColor: '#EF4444',
    },
    confirmButtonText: {
      color: 'white',
      fontSize: 17,
      fontWeight: '700',
      letterSpacing: 0.1,
    },
    dayStartConfirmButton: {
      backgroundColor: '#10B981',
    },
    dayEndConfirmButton: {
      backgroundColor: '#EF4444',
    },
    buttonPressable: {
      opacity: 0.93,
      transform: [{ scale: 0.97 }],
    },
  });
}; 