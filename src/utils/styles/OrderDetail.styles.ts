import { StyleSheet, ScaledSize } from 'react-native';

const isTablet = (dimensions: ScaledSize) => Math.min(dimensions.width, dimensions.height) >= 768;
const isLandscape = (dimensions: ScaledSize) => dimensions.width > dimensions.height;

export const createOrderDetailStyles = (dimensions: ScaledSize) => {
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
    backButton: {
      padding: 8,
    },
    backButtonText: {
      fontSize: 16,
      color: 'white',
      fontWeight: '600',
    },
    editButton: {
      padding: 8,
    },
    editButtonText: {
      fontSize: 16,
      color: 'white',
      fontWeight: '600',
    },
    scrollContainer: {
      flex: 1,
    },
    orderHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      backgroundColor: 'white',
      borderBottomWidth: 1,
      borderBottomColor: '#E0E0E0',
    },
    orderNoContainer: {
      flexDirection: 'column',
    },
    orderNoLabel: {
      fontSize: 14,
      color: '#6B7280',
    },
    orderNo: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#1F2937',
    },
    statusBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 4,
    },
    statusText: {
      fontSize: 14,
      fontWeight: '600',
      color: 'white',
    },
    section: {
      marginVertical: 8,
      padding: 16,
      backgroundColor: 'white',
      borderRadius: 8,
      marginHorizontal: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#1F2937',
      marginBottom: 12,
    },
    infoRow: {
      flexDirection: 'row',
      marginBottom: 8,
    },
    infoLabel: {
      fontSize: 15,
      color: '#6B7280',
      width: 120,
    },
    infoValue: {
      fontSize: 15,
      color: '#1F2937',
      flex: 1,
    },
    notesContainer: {
      marginTop: 8,
    },
    notesText: {
      fontSize: 15,
      color: '#1F2937',
      marginTop: 4,
      backgroundColor: '#F9FAFB',
      padding: 8,
      borderRadius: 4,
    },
    tableHeader: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: '#E0E0E0',
      paddingBottom: 8,
      marginBottom: 8,
    },
    columnHeader: {
      fontSize: 14,
      fontWeight: 'bold',
      color: '#4B5563',
    },
    itemRow: {
      flexDirection: 'row',
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: '#F3F4F6',
    },
    evenRow: {
      backgroundColor: '#FFFFFF',
    },
    oddRow: {
      backgroundColor: '#F9FAFB',
    },
    itemCell: {
      flex: 3,
      paddingRight: 8,
    },
    quantityCell: {
      flex: 1,
      alignItems: 'center',
    },
    priceCell: {
      flex: 1.5,
      alignItems: 'flex-end',
    },
    discountCell: {
      flex: 1,
      alignItems: 'center',
    },
    totalCell: {
      flex: 1.5,
      alignItems: 'flex-end',
    },
    itemName: {
      fontSize: 15,
      color: '#1F2937',
      fontWeight: '500',
    },
    itemCode: {
      fontSize: 13,
      color: '#6B7280',
      marginTop: 2,
    },
    itemQuantity: {
      fontSize: 15,
      color: '#1F2937',
    },
    itemPrice: {
      fontSize: 15,
      color: '#1F2937',
    },
    itemDiscount: {
      fontSize: 15,
      color: '#EF4444',
    },
    itemTotal: {
      fontSize: 15,
      color: '#1F2937',
      fontWeight: '500',
    },
    summaryContainer: {
      marginTop: 16,
      borderTopWidth: 1,
      borderTopColor: '#E0E0E0',
      paddingTop: 16,
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    summaryLabel: {
      fontSize: 15,
      color: '#6B7280',
    },
    summaryValue: {
      fontSize: 15,
      color: '#1F2937',
    },
    discountValue: {
      fontSize: 15,
      color: '#EF4444',
    },
    totalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 8,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: '#E0E0E0',
    },
    totalLabel: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#1F2937',
    },
    totalValue: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#1F2937',
    },
    actionContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      padding: 16,
      marginBottom: 20,
    },
    actionButton: {
      backgroundColor: '#4A90E2',
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 8,
      flex: 1,
      marginHorizontal: 8,
      alignItems: 'center',
    },
    actionButtonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
    },
    secondaryButton: {
      backgroundColor: 'white',
      borderWidth: 1,
      borderColor: '#4A90E2',
    },
    secondaryButtonText: {
      color: '#4A90E2',
      fontSize: 16,
      fontWeight: '600',
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
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
      backgroundColor: '#F5F7FA',
    },
    errorText: {
      fontSize: 18,
      color: '#EF4444',
      marginBottom: 16,
    },
  });
}; 