import React from 'react';
import { View, Image } from 'react-native';
import { RefreshCw, Bell } from 'lucide-react-native';
import { Text, IconButton, TouchableRipple, useTheme } from 'react-native-paper';
import { createDashboardHeaderStyles } from '../utils/styles/DashboardHeader.styles';

interface DashboardHeaderProps {
  onRefresh?: () => void;
  onNotification?: () => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  onRefresh,
  onNotification,
}) => {
  const theme = useTheme();
  const styles = createDashboardHeaderStyles();
  
  return (
    <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.headerLeft}>
        <View style={styles.logoContainer}>
          <Image 
            source={require('../assets/company_logo.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <View style={styles.companyInfo}>
          <Text variant="titleMedium" style={[styles.companyName, { color: theme.colors.onSurface }]}>
            LGL Marketing Services (Pvt) Ltd
          </Text>
          <Text variant="bodySmall" style={[styles.companySubtitle, { color: theme.colors.onSurfaceVariant }]}>
            Sales Force Automation
          </Text>
        </View>
      </View>
      
      <View style={styles.headerRight}>
        <IconButton
          icon={() => <RefreshCw size={20} color={theme.colors.onSurfaceVariant} />}
          onPress={onRefresh}
          size={20}
          style={styles.iconButton}
        />
        
        <TouchableRipple onPress={onNotification} style={styles.notificationContainer}>
          <View>
            <Bell size={20} color={theme.colors.onSurfaceVariant} />
            <View style={[styles.notificationBadge, { backgroundColor: theme.colors.error }]}>
              <Text variant="labelSmall" style={[styles.badgeText, { color: theme.colors.onError }]}>
                3
              </Text>
            </View>
          </View>
        </TouchableRipple>
      </View>
    </View>
  );
};

export default DashboardHeader; 