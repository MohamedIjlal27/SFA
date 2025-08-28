import React from 'react';
import { View } from 'react-native';
import { Text, TouchableRipple, Card, ActivityIndicator, useTheme } from 'react-native-paper';
import { AchievementCard, ErrorState } from './index';

interface DashboardStatsProps {
  isLoading: boolean;
  dashboardError: string | null;
  dashboardData: any;
  selectedMonth: string;
  selectedYear: string;
  monthLabels: string[];
  onRetry: () => void;
  onMonthYearPress: () => void;
}

const DashboardStats: React.FC<DashboardStatsProps> = ({
  isLoading,
  dashboardError,
  dashboardData,
  selectedMonth,
  selectedYear,
  monthLabels,
  onRetry,
  onMonthYearPress,
}) => {
  const theme = useTheme();

  const formatPercentage = (percentage: number): string => {
    if (percentage === 0) return '';
    const sign = percentage > 0 ? '+' : '';
    return `${sign}${percentage.toFixed(2)}%`;
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
        <Text variant="bodyMedium" style={{ marginTop: 12, }}>
          Loading dashboard data...
        </Text>
        </View>
   
    );
  }

  if (dashboardError) {
    return (
      <ErrorState
        title="Dashboard Data Unavailable"
        message={dashboardError}
        onRetry={onRetry}
        showContactSupport={true}
        supportEmail="support@lglmarketing.com"
      />
    );
  }

  if (!dashboardData) {
    return null;
  }

  return (
    <View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Text variant="titleMedium" style={{ color: theme.colors.onBackground, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          THIS MONTH ACHIEVEMENTS
        </Text>
        <TouchableRipple
          onPress={onMonthYearPress}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: theme.colors.surface,
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: theme.colors.outline,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text variant="labelLarge" style={{ color: theme.colors.onSurface, marginRight: 4 }}>
              {monthLabels[parseInt(selectedMonth, 10) - 1]} {selectedYear}
            </Text>
            <Text>📅</Text>
          </View>
        </TouchableRipple>
      </View>
      
      <View style={{ flexDirection: 'row', marginBottom: 12 }}>
        <AchievementCard 
          title="Sales" 
          percentage={formatPercentage(dashboardData.metrics.sales.percentage || 0)}
          value={dashboardData.metrics.sales.formattedValue || '0.00'}
          monthlyTarget={dashboardData.metrics.sales.monthlyTargetFormatted || dashboardData.metrics.sales.monthlyTarget || 'N/A'}
        />
        <AchievementCard 
          title="Collection" 
          percentage={formatPercentage(dashboardData.metrics.collections.percentage || 0)}
          value={dashboardData.metrics.collections.formattedValue || '0.00'}
          monthlyTarget={dashboardData.metrics.collections.monthlyTargetFormatted || dashboardData.metrics.collections.monthlyTarget || 'N/A'}
        />
      </View>
      
      <View style={{ flexDirection: 'row', marginBottom: 12 }}>
        <AchievementCard 
          title="Returns" 
          percentage={formatPercentage(dashboardData.metrics.returns.percentage || 0)}
          value={dashboardData.metrics.returns.formattedValue || '0.00'}
          monthlyTarget={dashboardData.metrics.returns.monthlyTargetFormatted || dashboardData.metrics.returns.monthlyTarget || 'N/A'}
        />
        <AchievementCard 
          title="Replacement" 
          percentage={formatPercentage(dashboardData.metrics.replacements.percentage || 0)}
          value={dashboardData.metrics.replacements.formattedValue || '0.00'}
          monthlyTarget={dashboardData.metrics.replacements.monthlyTargetFormatted || dashboardData.metrics.replacements.monthlyTarget || 'N/A'}
        />
      </View>
    </View>
  );
};

export default DashboardStats; 