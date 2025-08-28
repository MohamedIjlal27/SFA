import React from 'react';
import { View } from 'react-native';
import { Dialog, Portal, Button, TextInput, useTheme, Text, Chip } from 'react-native-paper';
import ProductsScreenStyles from '../utils/styles/ProductsScreen.styles';

type QtyFilter = { criterion: 'gte' | 'lte' | 'eq'; value: number } | null;

interface QuantityFilterModalProps {
  visible: boolean;
  onClose: () => void;
  tempQtyFilter: QtyFilter;
  setTempQtyFilter: (filter: QtyFilter) => void;
  onApply: () => void;
  onClear: () => void;
}

const QuantityFilterModal: React.FC<QuantityFilterModalProps> = ({
  visible,
  onClose,
  tempQtyFilter,
  setTempQtyFilter,
  onApply,
  onClear,
}) => {
  const theme = useTheme();
  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onClose} style={{ backgroundColor: theme.colors.background }}>
        <Dialog.Title>Filter by Quantity</Dialog.Title>
        <Dialog.Content>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ marginRight: 8 }}>Criterion:</Text>
            <Chip
              selected={tempQtyFilter?.criterion === 'gte'}
                onPress={() => setTempQtyFilter({ ...tempQtyFilter!, criterion: 'gte' })}
              style={{ marginRight: 4 }}
              textStyle={{ color: tempQtyFilter?.criterion === 'gte' ? theme.colors.primary : theme.colors.onSurface }}
            >
              ≥
            </Chip>
            <Chip
              selected={tempQtyFilter?.criterion === 'lte'}
                onPress={() => setTempQtyFilter({ ...tempQtyFilter!, criterion: 'lte' })}
              style={{ marginRight: 4 }}
              textStyle={{ color: tempQtyFilter?.criterion === 'lte' ? theme.colors.primary : theme.colors.onSurface }}
            >
              ≤
            </Chip>
            <Chip
              selected={tempQtyFilter?.criterion === 'eq'}
                onPress={() => setTempQtyFilter({ ...tempQtyFilter!, criterion: 'eq' })}
              textStyle={{ color: tempQtyFilter?.criterion === 'eq' ? theme.colors.primary : theme.colors.onSurface }}
            >
              =
            </Chip>
          </View>
            <TextInput
            mode="outlined"
            label="Quantity"
              keyboardType="numeric"
              value={tempQtyFilter?.value?.toString() || ''}
              onChangeText={text => setTempQtyFilter({ ...tempQtyFilter!, value: parseInt(text) || 0 })}
              placeholder="Enter quantity"
            style={{ marginBottom: 16 }}
          />
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onClose} textColor={theme.colors.primary}>Cancel</Button>
          <Button onPress={onApply} textColor={theme.colors.primary}>Apply</Button>
          <Button onPress={onClear} textColor={theme.colors.error}>Clear</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
);
};

export default QuantityFilterModal; 