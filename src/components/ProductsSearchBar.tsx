import React from 'react';
import { View } from 'react-native';
import { Searchbar, IconButton, Chip, useTheme, Badge } from 'react-native-paper';
import ProductsScreenStyles from '../utils/styles/ProductsScreen.styles';

type ViewMode = 'list' | 'grid';

interface ProductsSearchBarProps {
  searchQuery: string;
  onSearch: (text: string) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  onFilterPress: () => void;
  filterCount: number;
  onCategoryPress: () => void;
  selectedCategory: string;
}

const ProductsSearchBar: React.FC<ProductsSearchBarProps> = ({
  searchQuery,
  onSearch,
  viewMode,
  setViewMode,
  onFilterPress,
  filterCount,
  onCategoryPress,
  selectedCategory,
}) => {
  const theme = useTheme();
  return (
  <View style={ProductsScreenStyles.searchContainer}>
      {/* Category Chip and View Mode/Filter Icons */}
    <View style={ProductsScreenStyles.categoryRow}>
        <Chip
          mode="outlined"
          icon="chevron-down"
        onPress={onCategoryPress}
          style={{ marginRight: 8, backgroundColor: theme.colors.surface }}
          textStyle={{ color: theme.colors.primary }}
      >
          {selectedCategory || 'All Categories'}
        </Chip>
      <View style={ProductsScreenStyles.viewModeContainer}>
          <IconButton
            icon="view-list"
            iconColor={viewMode === 'list' ? theme.colors.primary : theme.colors.onSurface}
          onPress={() => setViewMode('list')}
            style={ProductsScreenStyles.viewModeButton}
            size={24}
          />
          <IconButton
            icon="view-grid"
            iconColor={viewMode === 'grid' ? theme.colors.primary : theme.colors.onSurface}
          onPress={() => setViewMode('grid')}
            style={ProductsScreenStyles.viewModeButton}
            size={24}
          />
          <View>
            <IconButton
              icon="filter-variant"
              iconColor={theme.colors.primary}
              onPress={onFilterPress}
          style={ProductsScreenStyles.filterIconButton}
              size={24}
            />
          {filterCount > 0 && (
              <Badge
                style={{ position: 'absolute', top: 2, right: 2, backgroundColor: theme.colors.error }}
                size={16}
              >
                {filterCount}
              </Badge>
            )}
          </View>
            </View>
      </View>
      {/* Search Bar */}
    <View style={ProductsScreenStyles.searchRow}>
        <Searchbar
          placeholder="Search products..."
          value={searchQuery}
          onChangeText={onSearch}
          style={{
            borderRadius: 24,
            elevation: 2,
            backgroundColor: theme.colors.surface,
            marginVertical: 8,
            marginHorizontal: 0,
          }}
          inputStyle={{
            color: theme.colors.onSurface,
            fontSize: 16,
            paddingLeft: 0,
          }}
          icon="magnify"
          clearIcon={searchQuery ? "close" : undefined}
          onIconPress={() => searchQuery && onSearch("")}
        />
    </View>
  </View>
);
};

export default ProductsSearchBar; 