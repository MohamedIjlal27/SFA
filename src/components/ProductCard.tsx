import React from 'react';
import { View, Image } from 'react-native';
import ProductsScreenStyles from '../utils/styles/ProductsScreen.styles';
import { Product } from '../services/productService';
import { Card, Text, IconButton, useTheme, Avatar } from 'react-native-paper';

interface ProductCardProps {
  product: Product;
  onPress: () => void;
  onToggleSaved: () => void;
  formatCurrency: (amount: number) => string;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onPress, onToggleSaved, formatCurrency }) => {
  const theme = useTheme();
  return (
    <Card
      style={{
        marginBottom: 12,
        borderRadius: 16,
        elevation: 2,
        backgroundColor: theme.colors.surface,
        overflow: 'hidden',
      }}
      onPress={onPress}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 12 }}>
        {/* Product Image */}
        <Avatar.Image
          size={64}
          source={product.imageUrl ? { uri: product.imageUrl } : require('../assets/profile-placeholder.png')}
          style={{ backgroundColor: theme.colors.background, marginRight: 16 }}
        />
        {/* Product Details */}
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
            <Text style={{ fontWeight: 'bold', color: theme.colors.primary, fontSize: 16, marginRight: 8 }}>{product.itemCode}</Text>
            <IconButton
              icon={product.isSaved ? 'star' : 'star-outline'}
              size={20}
              onPress={onToggleSaved}
              iconColor={product.isSaved ? theme.colors.secondary : theme.colors.outline}
              style={{ margin: 0, padding: 0 }}
            />
            <Text style={{ color: theme.colors.onSurface, fontSize: 12, marginLeft: 4 }}>{product.uom}</Text>
          </View>
          <Text style={{ color: theme.colors.onSurface, fontSize: 14 }} numberOfLines={2}>
            {product.description}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
            <Text style={{ color: theme.colors.tertiary, fontWeight: 'bold', fontSize: 13, marginRight: 12 }}>
              Available: {product.qty}
            </Text>
            {product.discountPercentage > 0 && (
              <View style={{ backgroundColor: theme.colors.secondary, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2, marginLeft: 4 }}>
                <Text style={{ color: theme.colors.onSecondary, fontSize: 12 }}>
                  Save {product.discountPercentage}%
                </Text>
              </View>
            )}
          </View>
        </View>
        {/* Price & Discount */}
        <View style={{ alignItems: 'flex-end', marginLeft: 12, minWidth: 80 }}>
          <Text style={{ color: theme.colors.primary, fontWeight: 'bold', fontSize: 16 }}>
            {formatCurrency(product.price)}
          </Text>
          {product.discountPercentage > 0 && (
            <Text style={{ color: theme.colors.error, fontSize: 13, fontWeight: 'bold' }}>
              -{formatCurrency(product.discountAmount)}
            </Text>
          )}
        </View>
      </View>
    </Card>
  );
};

export default ProductCard; 