import React from 'react';
import { View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { TaskButton } from './index';

interface DashboardTasksProps {
  onStartJourney: () => void;
  onViewRoute: () => void;
  onViewDueList: () => void;
}

const DashboardTasks: React.FC<DashboardTasksProps> = ({
  onStartJourney,
  onViewRoute,
  onViewDueList,
}) => {
  const theme = useTheme();

  return (
    <View>
      <Text variant="titleMedium" style={{ 
        color: theme.colors.onBackground, 
        textTransform: 'uppercase', 
        letterSpacing: 0.5,
        marginBottom: 16 
      }}>
        GENERAL TASKS
      </Text>
      
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <TaskButton 
          title="Start Journey"
          onPress={onStartJourney}
        />
        <TaskButton 
          title="View Route"
          onPress={onViewRoute}
        />
        <TaskButton 
          title="View Due List"
          onPress={onViewDueList}
        />
      </View>
    </View>
  );
};

export default DashboardTasks; 