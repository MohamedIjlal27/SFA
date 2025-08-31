import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { MapPin, UserPlus, List, Route } from 'lucide-react-native';
import { useTheme } from 'react-native-paper';
import { createTaskButtonStyles } from '../utils/styles/TaskButton.styles';

interface TaskButtonProps {
  title: string;
  onPress?: () => void;
  disabled?: boolean;
}

const TaskButton: React.FC<TaskButtonProps> = ({ title, onPress, disabled = false }) => {
  const theme = useTheme();
  const styles = createTaskButtonStyles();
  
  const getIcon = (title: string) => {
    const iconColor = disabled ? "#888888" : "#ffffff";
    switch (title.toLowerCase()) {
      case 'start journey':
        return <MapPin size={24} color={iconColor} />;
      case 'view route':
        return <Route size={24} color={iconColor} />;
      case 'view due list':
        return <List size={24} color={iconColor} />;
      default:
        return null;
    }
  };

  return (
    <View style={styles.taskButton}>
      <LinearGradient
        colors={disabled ? ['#cccccc', '#aaaaaa'] : [theme.colors.primary, theme.colors.secondary]}
        style={styles.taskButtonGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <TouchableOpacity
          onPress={disabled ? undefined : onPress}
          style={styles.touchableButton}
          activeOpacity={disabled ? 1 : 0.8}
          disabled={disabled}
        >
          {getIcon(title)}
          <Text style={[styles.buttonText, disabled && { color: '#888888' }]}>{title}</Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
};

export default TaskButton; 