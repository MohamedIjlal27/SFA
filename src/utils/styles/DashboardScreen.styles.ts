import { StyleSheet, ScaledSize, Dimensions } from 'react-native';

const isTablet = (dimensions: ScaledSize) => Math.min(dimensions.width, dimensions.height) >= 768;
const isLandscape = (dimensions: ScaledSize) => dimensions.width > dimensions.height;

export const createDashboardScreenStyles = (dimensions: ScaledSize) => {
  const tablet = isTablet(dimensions);
  const landscape = isLandscape(dimensions);
  
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#f9fafb',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: 50,
      paddingBottom: 16,
      backgroundColor: 'white',
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      marginRight: 10,
    },
    companyLogoContainer: {
      width: 60,
      height: 60,
      borderRadius: 10,
      backgroundColor: 'white',
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
      padding: 5,
    },
    companyLogo: {
      width: '130%',
      height: '130%',
      resizeMode: 'contain',
    },
    companyName: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#0A2463',
      marginLeft: 12,
      flexShrink: 1,
    },
    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    iconButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#F0F0F0',
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 12,
    },
    iconText: {
      fontSize: 20,
      color: '#555',
    },
    notificationBadge: {
      position: 'absolute',
      top: 8,
      right: 8,
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: '#FF3B30',
      zIndex: 1,
    },
    profileCard: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      marginHorizontal: 16,
      marginTop: 16,
      borderRadius: 16,
    },
    profileInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    profilePhoto: {
      width: 80,
      height: 80,
      borderRadius: 40,
      borderWidth: 3,
      borderColor: 'white',
    },
    profileDetails: {
      marginLeft: 16,
    },
    profileInitials: {
      fontSize: 28,
      fontWeight: 'bold',
      color: 'white',
    },
    profileName: {
      fontSize: 18,
      fontWeight: 'bold',
      color: 'white',
    },
    profileRole: {
      fontSize: 14,
      color: 'white',
      opacity: 0.9,
      marginTop: 4,
    },
    lastSynced: {
      fontSize: 12,
      color: 'white',
      opacity: 0.8,
      marginTop: 4,
    },
    logoutButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.1)',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
    },
    logoutIcon: {
      fontSize: 24,
      fontWeight: 'bold',
      color: 'white',
    },
    logoutText: {
      fontSize: 16,
      fontWeight: 'bold',
      color: 'white',
      marginLeft: 8,
    },
    scrollView: {
      flex: 1,
      paddingBottom: 100, // Add padding to account for tab bar
    },
    section: {
      marginHorizontal: 16,
      marginTop: 24,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#111827',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    monthYearButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#ffffff',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: '#e5e7eb',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    monthYearText: {
      fontWeight: 'bold',
      marginRight: 4,
      color: '#374151',
    },
    calendarIcon: {
      fontSize: 16,
    },
    loadingContainer: {
      alignItems: 'center',
      paddingVertical: 40,
    },
    loadingText: {
      marginTop: 12,
      fontSize: 14,
      color: '#6b7280',
    },
    achievementsRow: {
      flexDirection: 'row',
      marginBottom: 12,
    },
    tasksGrid: {
      flexDirection: 'row',
      gap: 8,
    },
    footer: {
      paddingVertical: 24,
      alignItems: 'center',
      justifyContent: 'center',
      opacity: 0.6,
    },
    footerText: {
      fontSize: 12,
      color: '#666',
      textAlign: 'center',
      marginVertical: 2,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: 'white',
      borderRadius: 20,
      width: '80%',
      maxWidth: 400,
      paddingTop: 20,
      paddingBottom: 16,
      elevation: 5,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
    },
    modalHeader: {
      alignItems: 'center',
      marginBottom: 16,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#1F2937',
    },
    modalMessage: {
      fontSize: 16,
      color: '#4B5563',
      textAlign: 'center',
      paddingHorizontal: 24,
      marginBottom: 24,
    },
    modalActions: {
      flexDirection: 'row',
      justifyContent: 'center',
      paddingHorizontal: 16,
      gap: 12,
    },
    modalButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 12,
      alignItems: 'center',
      maxWidth: 150,
    },
    cancelButton: {
      backgroundColor: '#F3F4F6',
    },
    cancelButtonText: {
      color: '#4B5563',
      fontSize: 16,
      fontWeight: '600',
    },
    logoutConfirmButton: {
      backgroundColor: '#EF4444',
    },
    logoutConfirmText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
    },
    sessionCard: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: 'white',
      borderRadius: 8,
      marginHorizontal: 16,
      marginTop: 16,
      marginBottom: 8,
      padding: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    sessionInfo: {
      flexDirection: 'column',
    },
    sessionTitle: {
      fontSize: 14,
      fontWeight: 'bold',
      color: '#4B5563',
      marginBottom: 4,
    },
    sessionDate: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#1F2937',
    },
    dayToggleButton: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 6,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dayStartButton: {
      backgroundColor: '#10B981', // Green
    },
    dayEndButton: {
      backgroundColor: '#EF4444', // Red
    },
    dayToggleText: {
      color: 'white',
      fontWeight: 'bold',
      fontSize: 14,
    },
    dayStartConfirmButton: {
      backgroundColor: '#10B981',
    },
    dayEndConfirmButton: {
      backgroundColor: '#EF4444',
    },
    dayToggleConfirmText: {
      color: 'white',
      fontWeight: 'bold',
    },
  });
}; 