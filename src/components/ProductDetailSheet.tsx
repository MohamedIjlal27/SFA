import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  Dimensions,
  Image,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import ImageViewer from 'react-native-image-zoom-viewer';
import { Product } from '../services/productService';
import LinearGradient from 'react-native-linear-gradient';
import { Card, IconButton, Button, Text, useTheme, Portal } from 'react-native-paper';

interface Props {
  products: Product[];
  currentIndex: number;
  isVisible: boolean;
  onClose: () => void;
  onIndexChange: (index: number) => void;
}

const ProductDetailSheet: React.FC<Props> = ({
  products,
  currentIndex,
  isVisible,
  onClose,
  onIndexChange,
}) => {
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const currentProduct = products[currentIndex];
  const theme = useTheme();

  const handleNextProduct = () => {
    if (currentIndex < products.length - 1) {
      onIndexChange(currentIndex + 1);
    }
  };

  const handlePreviousProduct = () => {
    if (currentIndex > 0) {
      onIndexChange(currentIndex - 1);
    }
  };

  const formatCurrency = (amount: number): string => {
    return amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  if (!isVisible || !currentProduct) {
    return null;
  }

  return (
    <Portal>
      <Modal
        visible={isVisible}
        animationType="slide"
        transparent
        onRequestClose={onClose}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.contentWrapper}>
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
              {/* Close Button */}
              <IconButton
                icon="close"
                onPress={onClose}
                style={[styles.closeButton, { backgroundColor: theme.colors.primary }]}
                iconColor={theme.colors.onPrimary}
                size={24}
              />
              {/* Header with Item Code and Name */}
              <LinearGradient
                colors={(theme as any).gradient || [theme.colors.primary, theme.colors.secondary || theme.colors.primary]}
                style={styles.headerGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.itemCode}>{currentProduct.itemCode}</Text>
                <Text style={styles.itemName}>{currentProduct.description}</Text>
              </LinearGradient>
              {/* Navigation Arrows */}
              <View style={styles.navigationContainer}>
                <IconButton
                  icon="chevron-left"
                  onPress={handlePreviousProduct}
                  disabled={currentIndex === 0}
                  style={styles.navButton}
                  iconColor={currentIndex === 0 ? 'rgba(0,0,0,0.26)' : theme.colors.primary}
                  size={28}
                />
                <View style={styles.imageContainer}>
                  <Button
                    mode="text"
                    onPress={() => setImageViewerVisible(true)}
                    style={{ padding: 0 }}
                    contentStyle={{ padding: 0 }}
                  >
                    <Image
                      source={{ uri: currentProduct.imageUrl }}
                      style={styles.image}
                      resizeMode="contain"
                    />
                  </Button>
                  <IconButton
                    icon="magnify"
                    size={18}
                    style={styles.zoomIcon}
                    iconColor={theme.colors.primary}
                    onPress={() => setImageViewerVisible(true)}
                  />
                </View>
                <IconButton
                  icon="chevron-right"
                  onPress={handleNextProduct}
                  disabled={currentIndex === products.length - 1}
                  style={styles.navButton}
                  iconColor={currentIndex === products.length - 1 ? 'rgba(0,0,0,0.26)' : theme.colors.primary}
                  size={28}
                />
              </View>
              {/* Price Information */}
              <Card style={styles.priceContainer}>
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Price</Text>
                  <Text style={styles.priceValue}>{formatCurrency(currentProduct.price)}</Text>
                </View>
                {currentProduct.discountPercentage > 0 && (
                  <>
                    <View style={styles.priceRow}>
                      <Text style={styles.discountLabel}>
                        Discount ({currentProduct.discountPercentage}%)
                      </Text>
                      <Text style={styles.discountValue}>
                        -{formatCurrency(currentProduct.discountAmount)}
                      </Text>
                    </View>
                    <View style={styles.priceRow}>
                      <Text style={styles.afterDiscountLabel}>After Discount</Text>
                      <Text style={styles.afterDiscountValue}>
                        {formatCurrency(currentProduct.price - currentProduct.discountAmount)}
                      </Text>
                    </View>
                  </>
                )}
              </Card>
              {/* Stock Information */}
              <Card style={styles.stockContainer}>
                <View style={styles.stockRow}>
                  <Text style={styles.stockLabel}>Stock</Text>
                  <Text style={styles.stockValue}>{currentProduct.qty}</Text>
                </View>
                <View style={styles.stockRow}>
                  <Text style={styles.stockLabel}>UOM</Text>
                  <Text style={styles.stockValue}>{currentProduct.uom}</Text>
                </View>
              </Card>
              {/* Category Information */}
              <Card style={styles.categoryContainer}>
                <Text style={styles.categoryLabel}>Category</Text>
                <Text style={styles.categoryValue}>{currentProduct.category}</Text>
                {currentProduct.subCategory && (
                  <>
                    <Text style={styles.categoryLabel}>Sub Category</Text>
                    <Text style={styles.categoryValue}>{currentProduct.subCategory}</Text>
                  </>
                )}
              </Card>
              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                <Button
                  mode="contained"
                  style={styles.feedbackButton}
                  labelStyle={styles.feedbackButtonText}
                  onPress={() => {}}
                >
                  Feedbacks
                </Button>
                <Button
                  mode="outlined"
                  style={styles.moreInfoButton}
                  labelStyle={styles.moreInfoButtonText}
                  onPress={() => {}}
                >
                  More Info
                </Button>
              </View>
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>
      <Modal visible={imageViewerVisible} transparent={true}>
        <ImageViewer
          imageUrls={[{ url: currentProduct?.imageUrl || '' }]}
          enableSwipeDown
          onSwipeDown={() => setImageViewerVisible(false)}
          onClick={() => setImageViewerVisible(false)}
        />
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  contentWrapper: {
    flex: 1,
    marginTop: 'auto',
    height: '85%',
    backgroundColor: '#F5F7FA',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    top: 16,
    zIndex: 1,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerGradient: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    marginTop: 8,
  },
  itemCode: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  itemName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  navigationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  navButtonText: {
    fontSize: 24,
    color: 'white',
    fontWeight: 'bold',
  },
  imageContainer: {
    flex: 1,
    aspectRatio: 1,
    marginHorizontal: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 8,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '60%',
  },
  zoomIcon: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
    padding: 4,
  },
  zoomIconText: {
    fontSize: 16,
    color: 'white',
  },
  priceContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 16,
    color: '#666',
  },
  priceValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  discountLabel: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '600',
  },
  discountValue: {
    fontSize: 16,
    color: '#EF4444',
    fontWeight: '600',
  },
  afterDiscountLabel: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '600',
  },
  afterDiscountValue: {
    fontSize: 18,
    color: '#059669',
    fontWeight: 'bold',
  },
  stockContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  stockRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  stockLabel: {
    fontSize: 14,
    color: '#666',
  },
  stockValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  categoryContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  categoryLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  categoryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  feedbackButton: {
    flex: 1,
    backgroundColor: '#4A90E2',
    borderRadius: 8,
    padding: 12,
    marginRight: 8,
    alignItems: 'center',
  },
  feedbackButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  moreInfoButton: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    borderRadius: 8,
    padding: 12,
    marginLeft: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4A90E2',
  },
  moreInfoButtonText: {
    color: '#4A90E2',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProductDetailSheet; 