import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Image,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
  Alert,
  Modal,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { Product, productService } from '../../services/productService';
import { Button, Card, useTheme, IconButton, Chip, Divider } from 'react-native-paper';
import ImageViewer from 'react-native-image-zoom-viewer';
import { FeedbackModal } from '../../components';
import { feedbackService } from '../../services/feedbackService';
import LinearGradient from 'react-native-linear-gradient';
import { useQuantityContext } from '../../context/QuantityContext';
import GestureRecognizer from 'react-native-swipe-gestures';

type Props = NativeStackScreenProps<RootStackParamList, 'ProductDetails'>;

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const ProductDetailsScreen: React.FC<Props> = ({ route, navigation }) => {
  const { productId, product: passedProduct } = route.params;
  const [product, setProduct] = useState<Product | null>(passedProduct || null);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
  const [showSpecifications, setShowSpecifications] = useState(false);
  const [localQuantity, setLocalQuantity] = useState(1);
  const theme = useTheme();
  const { getQuantity, setQuantity } = useQuantityContext();
  const savedQuantity = getQuantity(productId);

  useEffect(() => {
    loadAllProducts();
    // Initialize local quantity based on saved quantity or default to 1
    const initialQuantity = savedQuantity > 0 ? savedQuantity : 1;
    setLocalQuantity(initialQuantity);
  }, [productId, savedQuantity]);

  const loadAllProducts = async () => {
    try {
      const products = await productService.getProducts();
      setAllProducts(products);
      
      // Find current product index
      const index = products.findIndex(p => p.itemCode === productId);
      if (index !== -1) {
        setCurrentIndex(index);
        if (!passedProduct) {
          setProduct(products[index]);
        }
      }
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const loadProduct = async () => {
    try {
      const products = await productService.getProducts();
      const foundProduct = products.find(p => p.itemCode === productId);
      
      if (foundProduct) {
        setProduct(foundProduct);
      } else {
        Alert.alert('Error', 'Product not found');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error loading product:', error);
      Alert.alert('Error', 'Failed to load product details');
      navigation.goBack();
    }
  };

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1 && newQuantity <= (product?.qty || 0)) {
      setLocalQuantity(newQuantity);
    }
  };

  const handleIncrement = () => {
    if (product && localQuantity < product.qty) {
      setLocalQuantity(localQuantity + 1);
    }
  };

  const handleDecrement = () => {
    if (localQuantity > 1) {
      setLocalQuantity(localQuantity - 1);
    }
  };

  const getTotalPrice = () => {
    if (!product) return 0;
    const unitPrice = product.price - product.discountAmount;
    return unitPrice * localQuantity;
  };

  const formatCurrency = (amount: number): string => {
    return amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handleFeedbackSubmit = async (feedbackData: {
    rating: number;
    category: string;
    comment: string;
  }) => {
    try {
      if (!product) return;
      
      await feedbackService.submitFeedback(
        product.itemCode,
        product.description,
        feedbackData
      );
      
      setFeedbackModalVisible(false);
      Alert.alert('Success', 'Thank you for your feedback!');
    } catch (error) {
      console.error('Error submitting feedback:', error);
      Alert.alert('Error', 'Failed to submit feedback. Please try again.');
    }
  };

  const handleAddToOrder = () => {
    // Update the shared quantity context only when user clicks "Add to Order"
    setQuantity(productId, localQuantity);
    Alert.alert('Success', `Added ${localQuantity} ${product?.uom} of ${product?.description} to order`);
  };

  const handleSwipeLeft = () => {
    if (currentIndex < allProducts.length - 1) {
      const nextIndex = currentIndex + 1;
      const nextProduct = allProducts[nextIndex];
      setCurrentIndex(nextIndex);
      setProduct(nextProduct);
      
      // Update route params to reflect new product
      navigation.setParams({
        productId: nextProduct.itemCode,
        product: nextProduct,
      });
      
      // Reset local quantity for new product
      const nextProductQuantity = getQuantity(nextProduct.itemCode);
      setLocalQuantity(nextProductQuantity > 0 ? nextProductQuantity : 1);
    }
  };

  const handleSwipeRight = () => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      const prevProduct = allProducts[prevIndex];
      setCurrentIndex(prevIndex);
      setProduct(prevProduct);
      
      // Update route params to reflect new product
      navigation.setParams({
        productId: prevProduct.itemCode,
        product: prevProduct,
      });
      
      // Reset local quantity for new product
      const prevProductQuantity = getQuantity(prevProduct.itemCode);
      setLocalQuantity(prevProductQuantity > 0 ? prevProductQuantity : 1);
    }
  };

  const handleShare = () => {
    Alert.alert('Share', 'Share functionality would be implemented here');
  };

  if (!product) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={['#4A90E2', '#357ABD']}
          style={styles.loadingGradient}
        >
          <Text style={styles.loadingText}>Loading product details...</Text>
        </LinearGradient>
      </View>
    );
  }

  const imageUrls = (product.imageUrl || '')
    .split(',')
    .map(u => u.trim())
    .filter(u => u.length > 0);
  const hasValidImage = imageUrls.length > 0;

  // Reset selected image when product changes
  useEffect(() => {
    setSelectedImageIndex(0);
  }, [product.itemCode]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4A90E2" translucent />
      
      {/* Enhanced Header */}
      <LinearGradient
        colors={['#4A90E2', '#357ABD']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <IconButton
              icon="arrow-left"
              size={24}
              iconColor="white"
            />
          </TouchableOpacity>
          
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Product Details</Text>
            <Text style={styles.headerSubtitle}>{product.itemCode}</Text>
            <View style={styles.navigationIndicator}>
              <Text style={styles.navigationText}>
                {currentIndex + 1} of {allProducts.length}
              </Text>
            </View>
          </View>
          
          <View style={styles.headerActions}>
            
            
            <TouchableOpacity
              style={styles.headerActionButton}
              onPress={() => productService.toggleSavedProduct(product.itemCode)}
            >
              <IconButton
                icon={product.isSaved ? "heart" : "heart-outline"}
                size={20}
                iconColor={product.isSaved ? "#FF6B6B" : "white"}
              />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      <GestureRecognizer
        onSwipeLeft={handleSwipeLeft}
        onSwipeRight={handleSwipeRight}
        config={{
          velocityThreshold: 0.3,
          directionalOffsetThreshold: 80,
        }}
        style={styles.gestureContainer}
      >
        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={false}
        >
        {/* Enhanced Product Image Section */}
        <View style={styles.imageSection}>
          <View style={styles.imageContainer}>
            <TouchableOpacity
              onPress={() => hasValidImage && setImageViewerVisible(true)}
              disabled={!hasValidImage}
              activeOpacity={0.8}
              style={{ flex: 1 }}
            >
              <Image
                source={{ 
                  uri: hasValidImage ? imageUrls[Math.min(Math.max(0, selectedImageIndex), Math.max(0, imageUrls.length - 1))] : 'https://via.placeholder.com/400x400?text=No+Image'
                }}
                style={styles.productImage}
                resizeMode="contain"
              />
            </TouchableOpacity>
            {hasValidImage && (
              <View style={styles.zoomOverlay}>
                <IconButton
                  icon="magnify"
                  size={24}
                  iconColor="white"
                  style={styles.zoomIcon}
                />
              </View>
            )}
            {/* Image navigation arrows (within current product images) */}
            {hasValidImage && imageUrls.length > 1 && (
              <>
                <TouchableOpacity
                  style={styles.navArrowLeft}
                  onPress={() => setSelectedImageIndex((i) => Math.max(0, i - 1))}
                  disabled={selectedImageIndex === 0}
                >
                  <IconButton
                    icon="chevron-left"
                    size={28}
                    iconColor="white"
                    style={styles.navArrowIcon}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.navArrowRight}
                  onPress={() => setSelectedImageIndex((i) => Math.min(imageUrls.length - 1, i + 1))}
                  disabled={selectedImageIndex >= imageUrls.length - 1}
                >
                  <IconButton
                    icon="chevron-right"
                    size={28}
                    iconColor="white"
                    style={styles.navArrowIcon}
                  />
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* Thumbnails */}
          {hasValidImage && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginTop: 10 }}
              contentContainerStyle={{ paddingHorizontal: 20 }}
            >
              {imageUrls.map((url, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => setSelectedImageIndex(idx)}
                  style={{ marginRight: 8, borderWidth: 2, borderColor: idx === selectedImageIndex ? '#4A90E2' : '#E5E7EB', borderRadius: 8 }}
                >
                  <Image source={{ uri: url }} style={{ width: 64, height: 64, borderRadius: 6 }} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
          
          {/* Product Badges */}
          <View style={styles.badgeContainer}>
            {product.isNewShipment && (
              <Chip
                icon="star"
                mode="outlined"
                textStyle={styles.badgeText}
                style={styles.newBadge}
              >
                New Arrival
              </Chip>
            )}
            {product.isSold && (
              <Chip
                icon="fire"
                mode="outlined"
                textStyle={styles.badgeText}
                style={styles.soldBadge}
              >
                Popular
              </Chip>
            )}
            {product.discountPercentage > 0 && (
              <Chip
                icon="tag"
                mode="outlined"
                textStyle={styles.badgeText}
                style={styles.discountBadge}
              >
                {product.discountPercentage}% OFF
              </Chip>
            )}
          </View>
        </View>

        {/* Enhanced Product Info */}
        <View style={styles.contentContainer}>
          {/* Product Basic Info */}
          <Card style={styles.infoCard}>
            <Card.Content>
              <View style={styles.productHeader}>
                <Text style={styles.productCode}>{product.itemCode}</Text>
                <View style={styles.stockIndicator}>
                  <View style={[
                    styles.stockDot,
                    { backgroundColor: product.qty > 0 ? '#10B981' : '#EF4444' }
                  ]} />
                  <Text style={[
                    styles.stockText,
                    { color: product.qty > 0 ? '#10B981' : '#EF4444' }
                  ]}>
                    {product.qty > 0 ? 'In Stock' : 'Out of Stock'}
                  </Text>
                </View>
              </View>
              <Text style={styles.productName}>{product.description}</Text>
              
              <Divider style={styles.divider} />
              
              <View style={styles.categoryInfo}>
                <Text style={styles.categoryLabel}>Category</Text>
                <Text style={styles.categoryValue}>{product.category}</Text>
                {product.subCategory && (
                  <>
                    <Text style={styles.categoryLabel}>Subcategory</Text>
                    <Text style={styles.categoryValue}>{product.subCategory}</Text>
                  </>
                )}
              </View>
            </Card.Content>
          </Card>

          {/* Enhanced Pricing Section */}
          <Card style={styles.priceCard}>
            <Card.Content>
              <View style={styles.priceHeader}>
                <Text style={styles.priceLabel}>Price</Text>
                <Text style={styles.priceValue}>{formatCurrency(product.price)}</Text>
              </View>
              
              {product.discountPercentage > 0 && (
                <>
                  <View style={styles.discountRow}>
                    <Text style={styles.discountLabel}>Discount</Text>
                    <View style={styles.discountInfo}>
                      <Text style={styles.discountPercentage}>{product.discountPercentage}%</Text>
                      <Text style={styles.discountAmount}>-{formatCurrency(product.discountAmount)}</Text>
                    </View>
                  </View>
                  <Divider style={styles.divider} />
                  <View style={styles.finalPriceRow}>
                    <Text style={styles.finalPriceLabel}>Final Price</Text>
                    <Text style={styles.finalPriceValue}>
                      {formatCurrency(product.price - product.discountAmount)}
                    </Text>
                  </View>
                </>
              )}
            </Card.Content>
          </Card>

          {/* Enhanced Availability & Quantity */}
          <Card style={styles.availabilityCard}>
            <Card.Content>
              <View style={styles.availabilityHeader}>
                <Text style={styles.availabilityLabel}>Available Quantity</Text>
                <Text style={[
                  styles.availabilityValue,
                  product.qty === 0 && styles.zeroQuantity
                ]}>
                  {product.qty} {product.uom}
                </Text>
              </View>
              
              {product.qty > 0 && (
                <>
                  <Divider style={styles.divider} />
                  <View style={styles.quantitySection}>
                    <Text style={styles.quantityLabel}>Select Quantity</Text>
                    <View style={styles.quantityControls}>
                      <IconButton
                        icon="minus"
                        size={24}
                        onPress={handleDecrement}
                        disabled={localQuantity <= 1}
                        iconColor={localQuantity <= 1 ? '#ccc' : theme.colors.primary}
                        style={styles.quantityButton}
                      />
                      <Text style={styles.quantityValue}>{localQuantity}</Text>
                      <IconButton
                        icon="plus"
                        size={24}
                        onPress={handleIncrement}
                        disabled={localQuantity >= product.qty}
                        iconColor={localQuantity >= product.qty ? '#ccc' : theme.colors.primary}
                        style={styles.quantityButton}
                      />
                    </View>
                    <Text style={styles.quantityHint}>
                      {localQuantity} × {formatCurrency(product.price - product.discountAmount)} per {product.uom}
                    </Text>
                    
                    <View style={styles.totalPriceRow}>
                      <Text style={styles.totalPriceLabel}>Total Price</Text>
                      <Text style={styles.totalPriceValue}>
                        {formatCurrency(getTotalPrice())}
                      </Text>
                    </View>
                  </View>
                </>
              )}
            </Card.Content>
          </Card>

          {/* Specifications Section */}
          <Card style={styles.specificationsCard}>
            <Card.Content>
              <TouchableOpacity
                style={styles.specificationsHeader}
                onPress={() => setShowSpecifications(!showSpecifications)}
              >
                <Text style={styles.specificationsTitle}>Specifications</Text>
                <IconButton
                  icon={showSpecifications ? "chevron-up" : "chevron-down"}
                  size={20}
                  iconColor={theme.colors.primary}
                />
              </TouchableOpacity>
              
              {showSpecifications && (
                <View style={styles.specificationsContent}>
                  <View style={styles.specificationRow}>
                    <Text style={styles.specificationLabel}>Product Code</Text>
                    <Text style={styles.specificationValue}>{product.itemCode}</Text>
                  </View>
                  <View style={styles.specificationRow}>
                    <Text style={styles.specificationLabel}>Unit of Measure</Text>
                    <Text style={styles.specificationValue}>{product.uom}</Text>
                  </View>
                  <View style={styles.specificationRow}>
                    <Text style={styles.specificationLabel}>Base Price</Text>
                    <Text style={styles.specificationValue}>{formatCurrency(product.price)}</Text>
                  </View>
                  {product.discountAmount > 0 && (
                    <View style={styles.specificationRow}>
                      <Text style={styles.specificationLabel}>Discount Amount</Text>
                      <Text style={styles.specificationValue}>{formatCurrency(product.discountAmount)}</Text>
                    </View>
                  )}
                </View>
              )}
            </Card.Content>
          </Card>

        </View>
        </ScrollView>
      </GestureRecognizer>

      {/* Fixed Action Buttons */}
      <View style={styles.fixedActionButtons}>
        <Button
          mode="contained"
          style={styles.feedbackButton}
          labelStyle={styles.feedbackButtonText}
          onPress={() => setFeedbackModalVisible(true)}
          icon="message-text"
        >
          Feedback
        </Button>
        
        <Button
          mode="outlined"
          style={styles.addToOrderButton}
          labelStyle={styles.addToOrderButtonText}
          onPress={handleAddToOrder}
          icon="cart-plus"
          disabled={product.qty === 0}
        >
          Add to Order
        </Button>
      </View>



      {/* Image Viewer Modal */}
      {imageViewerVisible && hasValidImage && (
        <ImageViewer
          imageUrls={imageUrls.map(u => ({ url: u }))}
          enableSwipeDown
          onSwipeDown={() => setImageViewerVisible(false)}
          onClick={() => setImageViewerVisible(false)}
          index={selectedImageIndex}
          saveToLocalByLongPress={false}
        />
      )}

      {/* Feedback Modal */}
      <FeedbackModal
        visible={feedbackModalVisible}
        onClose={() => setFeedbackModalVisible(false)}
        onSubmit={handleFeedbackSubmit}
        productName={product.description}
        productCode={product.itemCode}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  
  loadingContainer: {
    flex: 1,
  },
  
  loadingGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  loadingText: {
    fontSize: 18,
    color: 'white',
    fontWeight: '600',
  },
  

  
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight! + 20,
    paddingBottom: 16,
  },
  
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  
  backButton: {
    marginRight: 8,
  },
  
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  
  navigationIndicator: {
    marginTop: 4,
  },
  
  navigationText: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  headerActionButton: {
    marginLeft: 4,
  },
  
  gestureContainer: {
    flex: 1,
  },
  
  scrollView: {
    flex: 1,
  },
  
  scrollViewContent: {
    paddingBottom: Platform.OS === 'ios' ? 120 : 100,
  },
  
  imageSection: {
    backgroundColor: 'white',
    paddingVertical: 24,
    alignItems: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  
  imageContainer: {
    position: 'relative',
    width: screenWidth * 0.85,
    height: screenWidth * 0.85,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#F8FAFC',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  
  productImage: {
    width: '100%',
    height: '100%',
  },
  
  zoomOverlay: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
  },
  
  zoomIcon: {
    margin: 0,
  },
  
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 16,
    gap: 8,
  },
  
  newBadge: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  
  soldBadge: {
    backgroundColor: '#F59E0B',
    borderColor: '#F59E0B',
  },
  
  discountBadge: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  
  contentContainer: {
    padding: 20,
  },
  
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  
  productCode: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  
  stockIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  stockDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  
  stockText: {
    fontSize: 12,
    fontWeight: '600',
  },
  
  productName: {
    fontSize: 20,
    color: '#374151',
    lineHeight: 28,
    fontWeight: '500',
  },
  
  divider: {
    marginVertical: 12,
    backgroundColor: '#E5E7EB',
  },
  
  categoryInfo: {
    marginTop: 8,
  },
  
  categoryLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  
  categoryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  
  priceCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  
  priceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  
  priceLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  
  priceValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
  },
  
  discountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  
  discountLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  
  discountInfo: {
    alignItems: 'flex-end',
  },
  
  discountPercentage: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
  },
  
  discountAmount: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '700',
  },
  
  finalPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  finalPriceLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  
  finalPriceValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#059669',
  },
  
  availabilityCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  
  availabilityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  
  availabilityLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  
  availabilityValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  
  zeroQuantity: {
    color: '#EF4444',
  },
  
  quantitySection: {
    marginTop: 8,
  },
  
  quantityLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  
  quantityButton: {
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
  },
  
  quantityValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginHorizontal: 24,
    minWidth: 40,
    textAlign: 'center',
  },
  
  quantityHint: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 12,
  },
  
  totalPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  
  totalPriceLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  
  totalPriceValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#059669',
  },
  
  specificationsCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  
  specificationsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  specificationsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  
  specificationsContent: {
    marginTop: 12,
  },
  
  specificationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  
  specificationLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  
  specificationValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  
  fixedActionButtons: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  
  feedbackButton: {
    flex: 1,
    backgroundColor: '#4A90E2',
    borderRadius: 12,
    paddingVertical: 8,
  },
  
  feedbackButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  
  addToOrderButton: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    borderRadius: 12,
    paddingVertical: 8,
    borderWidth: 2,
    borderColor: '#4A90E2',
  },
  
  addToOrderButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A90E2',
  },
  
  navArrowLeft: {
    position: 'absolute',
    left: 16,
    top: '50%',
    transform: [{ translateY: -20 }],
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  navArrowRight: {
    position: 'absolute',
    right: 16,
    top: '50%',
    transform: [{ translateY: -20 }],
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  navArrowIcon: {
    margin: 0,
  },
});

export default ProductDetailsScreen;
