import React from 'react';
import { View } from 'react-native';
import { Button, IconButton, Text, useTheme } from 'react-native-paper';
import ProductsScreenStyles from '../utils/styles/ProductsScreen.styles';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  total: number;
  hasPrev: boolean;
  hasNext: boolean;
  onPrev: () => void;
  onNext: () => void;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  total,
  hasPrev,
  hasNext,
  onPrev,
  onNext,
}) => {
  const theme = useTheme();
  return (
  <View style={ProductsScreenStyles.paginationContainer}>
    <View style={ProductsScreenStyles.paginationInfo}>
        <Text style={{ color: theme.colors.primary, fontWeight: 'bold' }}>
        Page {currentPage} of {totalPages} • {total} products
      </Text>
    </View>
    <View style={ProductsScreenStyles.paginationControls}>
        <IconButton
          icon="chevron-left"
        onPress={onPrev}
        disabled={!hasPrev}
          iconColor={hasPrev ? theme.colors.primary : 'rgba(0,0,0,0.26)'}
        />
        <IconButton
          icon="chevron-right"
        onPress={onNext}
        disabled={!hasNext}
          iconColor={hasNext ? theme.colors.primary : 'rgba(0,0,0,0.26)'}
        />
    </View>
  </View>
);
};

export default Pagination; 