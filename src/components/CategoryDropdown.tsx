import React from 'react';
import { ScrollView, View } from 'react-native';
import { Dialog, Portal, List, TextInput, IconButton, useTheme, Text, Divider } from 'react-native-paper';
import ProductsScreenStyles from '../utils/styles/ProductsScreen.styles';

interface CategoryDropdownProps {
  visible: boolean;
  onClose: () => void;
  categories: string[];
  selectedCategory: string;
  onSelect: (category: string) => void;
  searchQuery: string;
  onSearch: (text: string) => void;
}

const CategoryDropdown: React.FC<CategoryDropdownProps> = ({
  visible,
  onClose,
  categories,
  selectedCategory,
  onSelect,
  searchQuery,
  onSearch,
}) => {
  const theme = useTheme();
  return (
    <Portal>
      <Dialog
    visible={visible}
        onDismiss={onClose}
        style={{ backgroundColor: theme.colors.background, borderRadius: 20, elevation: 6 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8, paddingTop: 8 }}>
          <Text variant="titleLarge" style={{ fontWeight: 'bold' }}>Select Category</Text>
          <IconButton icon="close" onPress={onClose} iconColor={theme.colors.primary} />
        </View>
        <Divider style={{ marginBottom: 8 }} />
        <Dialog.Content style={{ paddingTop: 0 }}>
          <TextInput
            mode="outlined"
            placeholder="Search categories..."
            value={searchQuery}
            onChangeText={onSearch}
            right={searchQuery ? <TextInput.Icon icon="close" onPress={() => onSearch('')} /> : null}
            style={{ marginBottom: 8, backgroundColor: theme.colors.surface, borderRadius: 8 }}
            autoFocus
          />
          <ScrollView style={{ maxHeight: 250 }}>
            <List.Item
              title="All Categories"
            onPress={() => onSelect('')}
              left={props => <List.Icon {...props} icon="format-list-bulleted" color={selectedCategory === '' ? theme.colors.primary : theme.colors.onSurface} />}
              titleStyle={{ color: selectedCategory === '' ? theme.colors.primary : theme.colors.onSurface, fontWeight: selectedCategory === '' ? 'bold' : 'normal' }}
              style={selectedCategory === '' ? { backgroundColor: theme.colors.surface } : undefined}
            />
            {categories.map(cat => (
              <List.Item
              key={cat}
                title={cat}
              onPress={() => onSelect(cat)}
                left={props => <List.Icon {...props} icon={selectedCategory === cat ? 'check' : 'label-outline'} color={selectedCategory === cat ? theme.colors.primary : theme.colors.onSurface} />}
                titleStyle={{ color: selectedCategory === cat ? theme.colors.primary : theme.colors.onSurface, fontWeight: selectedCategory === cat ? 'bold' : 'normal' }}
                style={selectedCategory === cat ? { backgroundColor: theme.colors.surface } : undefined}
              />
          ))}
          {categories.length === 0 && (
              <>
                <Divider style={{ marginVertical: 8 }} />
                <Text style={{ color: theme.colors.onSurface, textAlign: 'center', marginTop: 16 }}>No categories found</Text>
              </>
          )}
        </ScrollView>
        </Dialog.Content>
      </Dialog>
    </Portal>
);
};

export default CategoryDropdown; 