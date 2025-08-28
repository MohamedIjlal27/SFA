import React from 'react';
import { View, Text } from 'react-native';

interface LoginBrandingProps {
  styles: any;
}

const LoginBranding: React.FC<LoginBrandingProps> = ({ styles }) => {
  return (
    <View style={styles.brandingContainer}>
      <Text style={styles.synqopsLogoText}>SYNQOPS</Text>
      <Text style={styles.copyrightText}>
        © All Rights Reserved - SYNQOPS (2025)
      </Text>
    </View>
  );
};

export default LoginBranding; 