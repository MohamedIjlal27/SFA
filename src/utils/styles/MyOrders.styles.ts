import { StyleSheet, ScaledSize } from 'react-native';

const isTablet = (dimensions: ScaledSize) => Math.min(dimensions.width, dimensions.height) >= 768;
const isLandscape = (dimensions: ScaledSize) => dimensions.width > dimensions.height;

export const createMyOrdersStyles = (dimensions: ScaledSize) => {
  const isTab = isTablet(dimensions);
  const isLand = isLandscape(dimensions);
  
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#F5F7FA',
    },
    header: {
      backgroundColor: '#4A90E2',
      paddingVertical: 16,
      paddingHorizontal: 20,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    title: {
      fontSize: isTab ? 24 : 20,
      fontWeight: 'bold',
      color: 'white',
    },
    filterContainer: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: 'white',
      borderBottomWidth: 1,
      borderBottomColor: '#E0E0E0',
      flexWrap: 'wrap',
    },
    filterButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      marginRight: 8,
      marginBottom: 8,
      backgroundColor: '#F3F4F6',
    },
    activeFilterButton: {
      backgroundColor: '#4A90E2',
    },
    filterButtonText: {
      fontSize: 14,
      color: '#4B5563',
    },
    activeFilterText: {
      color: 'white',
      fontWeight: '600',
    },
    listContainer: {
      padding: 16,
    },
    orderCard: {
      backgroundColor: 'white',
      borderRadius: 8,
      padding: 16,
      marginBottom: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    orderHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    orderNo: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#1F2937',
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
    },
    statusText: {
      fontSize: 12,
      fontWeight: '600',
      color: 'white',
    },
    customerName: {
      fontSize: 15,
      color: '#4B5563',
      marginBottom: 12,
    },
    orderDetails: {
      marginBottom: 12,
    },
    detailItem: {
      flexDirection: 'row',
      marginBottom: 4,
    },
    detailLabel: {
      fontSize: 14,
      color: '#6B7280',
      width: 100,
    },
    detailValue: {
      fontSize: 14,
      color: '#1F2937',
      fontWeight: '500',
    },
    orderFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 8,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: '#E5E7EB',
    },
    totalAmount: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#1F2937',
    },
    viewButton: {
      backgroundColor: '#4A90E2',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 4,
    },
    viewButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: 'white',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#F5F7FA',
    },
    loadingText: {
      marginTop: 12,
      fontSize: 16,
      color: '#4B5563',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    emptyText: {
      fontSize: 16,
      color: '#6B7280',
      textAlign: 'center',
    },
  });
}; 