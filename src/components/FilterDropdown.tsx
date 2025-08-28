import React from 'react';
import { ScrollView, View } from 'react-native';
import { Dialog, Portal, List, Checkbox, Button, useTheme, Text } from 'react-native-paper';
import ProductsScreenStyles from '../utils/styles/ProductsScreen.styles';

type FilterType = 'newShipment' | 'promotional' | 'lighting' | 'hardware' | 'saved';
type QtyFilter = { criterion: 'gte' | 'lte' | 'eq'; value: number } | null;

interface FilterDropdownProps {
  visible: boolean;
  onClose: () => void;
  activeFilters: Set<FilterType>;
  toggleFilter: (filter: FilterType) => void;
  qtyFilter: QtyFilter;
  onQtyFilterPress: () => void;
  onClearAll: () => void;
  filterOptions: { label: string; value: FilterType; section: string }[];
}

const FilterDropdown: React.FC<FilterDropdownProps> = ({
  visible,
  onClose,
  activeFilters,
  toggleFilter,
  qtyFilter,
  onQtyFilterPress,
  onClearAll,
  filterOptions,
}) => {
  const theme = useTheme();
  const sections = Array.from(new Set(filterOptions.map(opt => opt.section)));
  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onClose} style={{ backgroundColor: theme.colors.background }}>
        <Dialog.Title>Filters</Dialog.Title>
        <Dialog.Content>
          <Button mode="text" onPress={onClearAll} textColor={theme.colors.error} style={{ alignSelf: 'flex-end', marginBottom: 8 }}>
            Clear All
          </Button>
          <ScrollView style={{ maxHeight: 300 }}>
            {sections.map(section => (
              <View key={section} style={{ marginBottom: 8 }}>
                <Text style={{ color: theme.colors.primary, fontWeight: 'bold', marginBottom: 4 }}>{section}</Text>
                {filterOptions.filter(opt => opt.section === section).map(opt => (
                  <List.Item
                    key={opt.value}
                    title={opt.label}
                    onPress={() => toggleFilter(opt.value)}
                    left={props => (
                      <Checkbox
                        status={activeFilters.has(opt.value) ? 'checked' : 'unchecked'}
                        onPress={() => toggleFilter(opt.value)}
                        color={theme.colors.primary}
                      />
                    )}
                    titleStyle={{ color: activeFilters.has(opt.value) ? theme.colors.primary : theme.colors.onSurface }}
                    style={activeFilters.has(opt.value) ? { backgroundColor: theme.colors.surface } : undefined}
                  />
                ))}
              </View>
            ))}
            {/* Quantity Filter */}
            <View style={{ marginBottom: 8 }}>
              <Text style={{ color: theme.colors.primary, fontWeight: 'bold', marginBottom: 4 }}>Quantity</Text>
              <List.Item
                title={qtyFilter ? `Qty ${qtyFilter.criterion === 'gte' ? '>=' : qtyFilter.criterion === 'lte' ? '<=' : '='} ${qtyFilter.value}` : 'Filter by Quantity'}
                onPress={onQtyFilterPress}
                left={props => (
                  <Checkbox
                    status={qtyFilter ? 'checked' : 'unchecked'}
                    onPress={onQtyFilterPress}
                    color={theme.colors.primary}
                  />
                )}
                titleStyle={{ color: qtyFilter ? theme.colors.primary : theme.colors.onSurface }}
                style={qtyFilter ? { backgroundColor: theme.colors.surface } : undefined}
              />
            </View>
          </ScrollView>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onClose} textColor={theme.colors.primary}>Close</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

export default FilterDropdown; 