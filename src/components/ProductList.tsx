import React from 'react';
import { View, FlatList, Dimensions } from 'react-native';
import { ActivityIndicator, Text, useTheme } from 'react-native-paper';
import ProductsScreenStyles from '../utils/styles/ProductsScreen.styles';
import ProductCard from './ProductCard';
import GridProductCard from './GridProductCard';
import { Product } from '../services/productService';

type ViewMode = 'list' | 'grid';

interface ProductListProps {
  products: Product[];
  isLoading: boolean;
  isSyncing: boolean;
  viewMode: ViewMode;
  onRefresh: () => void;
  onProductPress: (index: number) => void;
  onToggleSaved: (itemCode: string) => void;
  formatCurrency: (amount: number) => string;
  listContainerStyle?: any;
}

const ProductList: React.FC<ProductListProps> = ({
  products,
  isLoading,
  isSyncing,
  viewMode,
  onRefresh,
  onProductPress,
  onToggleSaved,
  formatCurrency,
  listContainerStyle,
}) => {
  const theme = useTheme();
  const screenWidth = Dimensions.get('window').width;
  // 16px padding on each side, 12px gap between cards, 6px margin on each card
  const horizontalPadding = 16;
  const cardMargin = 6;
  const numColumns = viewMode === 'grid' ? 2 : 1;
  const cardWidth = viewMode === 'grid' ? (screenWidth - horizontalPadding * 2 - cardMargin * 2 * numColumns) / numColumns : undefined;

  if (isLoading) {
    return (
      <View style={ProductsScreenStyles.loadingContainer}>
        <ActivityIndicator size={32} animating color={theme.colors.primary} />
        <Text style={{ color: theme.colors.primary, marginTop: 12 }}>Loading products...</Text>
      </View>
    );
  }
  return (
    <FlatList
      data={products}
      renderItem={({ item, index }) =>
        viewMode === 'grid' ? (
          <GridProductCard
            product={item}
            onPress={() => onProductPress(index)}
            onToggleSaved={() => onToggleSaved(item.itemCode)}
            formatCurrency={formatCurrency}
            cardWidth={cardWidth}
            cardStyle={{
              marginLeft: index % numColumns === 0 ? 0 : cardMargin,
              marginRight: index % numColumns === numColumns - 1 ? 0 : cardMargin,
              marginBottom: 12,
            }}
          />
        ) : (
          <ProductCard
            product={item}
            onPress={() => onProductPress(index)}
            onToggleSaved={() => onToggleSaved(item.itemCode)}
            formatCurrency={formatCurrency}
          />
        )
      }
      keyExtractor={item => item.itemCode}
      refreshing={isSyncing}
      onRefresh={onRefresh}
      numColumns={numColumns}
      key={viewMode}
      columnWrapperStyle={viewMode === 'grid' ? { paddingHorizontal: horizontalPadding } : undefined}
      ListEmptyComponent={() => (
        <View style={ProductsScreenStyles.emptyContainer}>
          <Text style={{ color: theme.colors.onSurface, textAlign: 'center', marginTop: 32 }}>No products found</Text>
        </View>
      )}
      contentContainerStyle={listContainerStyle}
    />
  );
};

export default ProductList; 