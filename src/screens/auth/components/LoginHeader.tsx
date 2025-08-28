import React from 'react';
import { View, Text, Image, ScaledSize } from 'react-native';

interface LoginHeaderProps {
  styles: any;
}

const LoginHeader: React.FC<LoginHeaderProps> = ({ styles }) => {
  return (
    <View style={styles.headerContainer}>
      <View style={styles.logoContainer}>
        <Image
          source={require('../../../assets/smartrix_logo.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />
        <View style={styles.logoTextContainer}>
          <Text style={styles.logoTextLight}>SMAR</Text>
          <Text style={styles.logoTextBold}>TRIX</Text>
        </View>
      </View>
      <View style={styles.versionContainer}>
        <Text style={styles.versionText}>v1.0</Text>
        <View style={styles.editionBadge}>
          <Text style={styles.editionText}>SFA EDITION</Text>
        </View>
      </View>
    </View>
  );
};

export default LoginHeader; 