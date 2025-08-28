import React, { useState } from 'react';
import { View } from 'react-native';
import { Appbar, Button, ActivityIndicator, Snackbar, useTheme, Text } from 'react-native-paper';
import ProductsScreenStyles from '../utils/styles/ProductsScreen.styles';
import LinearGradient from 'react-native-linear-gradient';

interface ProductsHeaderProps {
  syncError: string | null;
  lastSyncTime: string | null;
  isSyncing: boolean;
  onSync: () => void;
}

const ProductsHeader: React.FC<ProductsHeaderProps> = ({ syncError, lastSyncTime, isSyncing, onSync }) => {
  const theme = useTheme();
  const [snackbarVisible, setSnackbarVisible] = useState(!!syncError);

  React.useEffect(() => {
    setSnackbarVisible(!!syncError);
  }, [syncError]);

  return (
    <>
      <LinearGradient
        colors={(theme as any).gradient || [theme.colors.primary, theme.colors.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ elevation: 2 }}
      >
        <Appbar.Header style={{ backgroundColor: 'transparent', elevation: 0 }}>
          <Appbar.Content title="Products" titleStyle={{ color: theme.colors.onPrimary, fontWeight: 'bold' }} />
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ color: theme.colors.onPrimary, marginRight: 12, fontSize: 12 }}>
        Last synced: {lastSyncTime ? new Date(lastSyncTime).toLocaleString() : 'Never'}
      </Text>
            <Button
              mode="contained"
              icon={isSyncing ? undefined : 'sync'}
        onPress={onSync}
        disabled={isSyncing}
              style={{ marginRight: 8 }}
              contentStyle={{ flexDirection: 'row-reverse' }}
              buttonColor={theme.colors.secondary}
              textColor={theme.colors.onPrimary}
      >
              {isSyncing ? <ActivityIndicator animating color={theme.colors.onPrimary} size={16} /> : 'Sync'}
            </Button>
          </View>
        </Appbar.Header>
      </LinearGradient>
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={4000}
        style={{ backgroundColor: theme.colors.error }}
        action={{ label: 'Dismiss', onPress: () => setSnackbarVisible(false) }}
      >
        {syncError}
      </Snackbar>
    </>
);
};

export default ProductsHeader; 