import { StyleSheet } from 'react-native';

export const createMonthYearPickerModalStyles = (theme: any) => {
  return StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 20,
      width: '85%',
      maxWidth: 400,
      paddingTop: 12,
      paddingBottom: 20,
      paddingHorizontal: 16,
      elevation: 6,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.18,
      shadowRadius: 6,
      alignItems: 'stretch',
      minWidth: 280,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.onSurface,
      flex: 1,
    },
    closeButton: {
      marginLeft: 8,
      marginTop: -8,
      marginRight: -8,
    },
    divider: {
      height: 1,
      backgroundColor: theme.colors.outlineVariant,
      marginBottom: 16,
    },
    pickerContainer: {
      flexDirection: 'row',
      marginBottom: 24,
      width: '100%',
      justifyContent: 'center',
      alignItems: 'flex-start',
    },
    pickerColumn: {
      flex: 1,
      alignItems: 'center',
    },
    pickerLabel: {
      fontSize: 15,
      color: theme.colors.onSurface,
      marginBottom: 4,
      fontWeight: '600',
    },
    pickerWrapper: {
      borderWidth: 1,
      borderColor: theme.colors.outline,
      borderRadius: 8,
      backgroundColor: theme.colors.background,
      width: 120,
      marginBottom: 4,
    },
    picker: {
      width: 160,
      color: theme.colors.onSurface,
      fontSize: 16,
    },
    verticalDivider: {
      width: 1,
      backgroundColor: theme.colors.outlineVariant,
      marginHorizontal: 8,
      alignSelf: 'stretch',
    },
    doneButton: {
      marginTop: 8,
      borderRadius: 22,
      alignSelf: 'center',
      width: 160,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.10,
      shadowRadius: 4,
      elevation: 2,
    },
  });
}; 