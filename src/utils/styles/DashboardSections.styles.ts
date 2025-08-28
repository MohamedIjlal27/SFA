import { StyleSheet } from 'react-native';

export const createDashboardSectionsStyles = () => {
  return StyleSheet.create({
    section: {
      marginBottom: 24,
      paddingHorizontal: 16,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#555',
    },
    fallbackIndicator: {
      fontSize: 12,
      color: '#4A90E2',
      fontWeight: 'bold',
    },
    fallbackSubtext: {
      fontSize: 10,
      color: '#666',
      fontWeight: 'normal',
    },
    achievementsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    tasksGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      fontSize: 16,
      color: '#4A90E2',
      marginTop: 16,
    },
  });
}; 