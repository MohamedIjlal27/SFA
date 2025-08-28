import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Play, Square, Calendar } from 'lucide-react-native';
import { createSessionCardStyles } from '../utils/styles/SessionCard.styles';

interface SessionCardProps {
  currentDate: Date;
  isDayStarted: boolean;
  onDayToggle: () => void;
  progress?: number; // 0 to 1, optional
}

const SessionCard: React.FC<SessionCardProps> = ({
  currentDate,
  isDayStarted,
  onDayToggle,
  progress,
}) => {
  const styles = createSessionCardStyles();
  
  // Format date as "MMM DD, YYYY"
  const formatDate = (date: Date): string => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    return `${month} ${day}, ${year}`;
  };

  // Format time as "HH:MM AM/PM"
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return (
    <View style={styles.sessionCard}>
      <View style={styles.sessionInfo}>
        <View style={styles.dateSection}>
          <Calendar size={16} color="#6b7280" />
          <Text style={styles.sessionTitle}>SESSION</Text>
        </View>
        <Text style={styles.sessionDate}>{formatDate(currentDate)}</Text>
        <Text style={styles.sessionTime}>{formatTime(currentDate)}</Text>
      </View>
      
      <TouchableOpacity 
        style={[
          styles.dayToggleButton, 
          isDayStarted ? styles.dayEndButton : styles.dayStartButton
        ]}
        onPress={onDayToggle}
        activeOpacity={0.8}
      >
        {isDayStarted ? (
          <Square size={16} color="#ffffff" />
        ) : (
          <Play size={16} color="#ffffff" />
        )}
        <Text style={styles.dayToggleText}>
          {isDayStarted ? 'End Day' : 'Start Day'}
        </Text>
      </TouchableOpacity>
      {/* Progress Bar */}
      {typeof progress === 'number' && progress >= 0 && progress <= 1 && (
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: `${Math.round(progress * 100)}%` }]} />
        </View>
      )}
    </View>
  );
};

export default SessionCard; 