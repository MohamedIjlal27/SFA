import React, { useEffect, useState } from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import { useSecurity } from '../hooks/useSecurity';

interface SecureViewProps {
  children: React.ReactNode;
  style?: ViewStyle;
  enableInDev?: boolean;
  showSecurityIndicator?: boolean;
}

export const SecureView: React.FC<SecureViewProps> = ({
  children,
  style,
  enableInDev = false,
  showSecurityIndicator = false,
}) => {
  const { isSecurityEnabled, isLoading } = useSecurity({ enableInDev });
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Only show content if security is enabled or we're in dev mode
    const shouldShow = isSecurityEnabled || __DEV__;
    setShowContent(shouldShow);
  }, [isSecurityEnabled]);

  if (isLoading) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.loadingContainer}>
          {/* You can add a loading indicator here */}
        </View>
      </View>
    );
  }

  if (!showContent) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.securityWarning}>
          {/* You can add a security warning message here */}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {children}
      {showSecurityIndicator && isSecurityEnabled && (
        <View style={styles.securityIndicator}>
          {/* You can add a security indicator here */}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  securityWarning: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  securityIndicator: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
  },
});
