import React from 'react';
import { View, Image } from 'react-native';
import ProductsScreenStyles from '../utils/styles/ProductsScreen.styles';
import { Product } from '../services/productService';
import { Card, Text, IconButton, useTheme } from 'react-native-paper';

interface GridProductCardProps {
  product: Product;
  onPress: () => void;
  onToggleSaved: () => void;
  formatCurrency: (amount: number) => string;
  cardWidth?: number;
  cardStyle?: any;
}

const GridProductCard: React.FC<GridProductCardProps> = ({ product, onPress, onToggleSaved, formatCurrency, cardWidth, cardStyle }) => {
  const theme = useTheme();
  return (
    <Card
      style={[
        {
          borderRadius: 16,
          elevation: 2,
          backgroundColor: theme.colors.surface,
          width: cardWidth,
          overflow: 'hidden',
        },
        cardStyle,
      ]}
      onPress={onPress}
    >
      {/* Large rectangular product image */}
      <Image
        source={product.imageUrl ? { uri: product.imageUrl } : require('../assets/profile-placeholder.png')}
        style={{
          width: '100%',
          height: 120,
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          backgroundColor: theme.colors.background,
        }}
        resizeMode="cover"
      />
      <View style={{ flex: 1, paddingHorizontal: 12, paddingBottom: 12, paddingTop: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2, justifyContent: 'space-between' }}>
          <Text style={{ fontWeight: 'bold', color: theme.colors.primary, fontSize: 15 }}>{product.itemCode}</Text>
          <IconButton
            icon={product.isSaved ? 'star' : 'star-outline'}
            size={18}
            onPress={onToggleSaved}
            iconColor={product.isSaved ? theme.colors.secondary : theme.colors.outline}
            style={{ margin: 0, padding: 0 }}
          />
        </View>
        <Text style={{ color: theme.colors.onSurface, fontSize: 13, marginBottom: 4 }} numberOfLines={3}>
          {product.description}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
          <Text style={{ color: theme.colors.primary, fontWeight: 'bold', fontSize: 15, marginRight: 8 }}>
            {formatCurrency(product.price)}
          </Text>
          {product.discountPercentage > 0 && (
            <View style={{ backgroundColor: theme.colors.secondary, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2, marginLeft: 2 }}>
              <Text style={{ color: theme.colors.onSecondary, fontSize: 11 }}>
                Save {product.discountPercentage}%
              </Text>
            </View>
          )}
        </View>
        {product.discountPercentage > 0 && (
          <Text style={{ color: theme.colors.error, fontSize: 12, fontWeight: 'bold', marginBottom: 2 }}>
            -{formatCurrency(product.discountAmount)}
          </Text>
        )}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ color: theme.colors.tertiary, fontSize: 12 }}>Available</Text>
            <Text style={{ color: theme.colors.tertiary, fontWeight: 'bold', fontSize: 14 }}>{product.qty}</Text>
          </View>
          <Text style={{ color: theme.colors.onSurface, fontSize: 12 }}>{product.uom}</Text>
        </View>
      </View>
    </Card>
  );
};

export default GridProductCard; 