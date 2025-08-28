import React from 'react';
import { useTheme } from 'react-native-paper';
import { IconButton } from 'react-native-paper';
import { StyleProp, ViewStyle } from 'react-native';

interface BackButtonProps {
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  iconColor?: string;
}

const BackButton: React.FC<BackButtonProps> = ({ onPress, style, accessibilityLabel, iconColor }) => {
  const theme = useTheme();
  return (
    <IconButton
      icon="arrow-left"
      size={28}
      onPress={onPress}
      style={style}
      accessibilityLabel={accessibilityLabel || 'Go back'}
      iconColor={iconColor || theme.colors.primary}
      rippleColor={theme.colors.primary + '22'}
    />
  );
};

export default BackButton; 