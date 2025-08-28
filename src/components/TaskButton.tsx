import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { MapPin, UserPlus, List } from 'lucide-react-native';
import { useTheme } from 'react-native-paper';
import { createTaskButtonStyles } from '../utils/styles/TaskButton.styles';

interface TaskButtonProps {
  title: string;
  onPress?: () => void;
}

const TaskButton: React.FC<TaskButtonProps> = ({ title, onPress }) => {
  const theme = useTheme();
  const styles = createTaskButtonStyles();
  
  const getIcon = (title: string) => {
    switch (title.toLowerCase()) {
      case 'start journey':
        return <MapPin size={24} color="#ffffff" />;
      case 'new lead':
        return <UserPlus size={24} color="#ffffff" />;
      case 'view due list':
        return <List size={24} color="#ffffff" />;
      default:
        return null;
    }
  };

  return (
    <View style={styles.taskButton}>
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.secondary]}
        style={styles.taskButtonGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <TouchableOpacity
          onPress={onPress}
          style={styles.touchableButton}
          activeOpacity={0.8}
        >
          {getIcon(title)}
          <Text style={styles.buttonText}>{title}</Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
};

export default TaskButton; 