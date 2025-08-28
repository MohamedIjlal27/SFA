import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  StatusBar,
  Image,
  Alert,
  ActivityIndicator,
  FlatList,
  Platform,
  ScrollView,
  Modal,
  Dimensions,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { Product, productService } from '../../services/productService';
import { orderItemsStore } from '../../services/orderItemsStore';
import { Picker } from '@react-native-picker/picker';
import ImageViewer from 'react-native-image-zoom-viewer';
import GestureRecognizer from 'react-native-swipe-gestures';
import ProductDetailSheet from '../../components/ProductDetailSheet';

type Props = NativeStackScreenProps<RootStackParamList, 'AddItems'>;

type QtyFilterCriterion = '>=' | '<=' | '=';

type QtyFilter = {
  criterion: QtyFilterCriterion;
  value: number;
} | null;

const AddItemsScreen: React.FC<Props> = ({ route, navigation }) => {
  const { orderId, customerName } = route.params;
  const [searchQuery, setSearchQuery] = useState('');
  const [showOptions, setShowOptions] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [showSelectedOnly, setShowSelectedOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedSubCategories, setSelectedSubCategories] = useState<string[]>([]);
  const [subCategories, setSubCategories] = useState<string[]>([]);
  const [allSubCategories, setAllSubCategories] = useState<string[]>([]);
  const [showSubCategoryDropdown, setShowSubCategoryDropdown] = useState(false);
  const [subCategorySearchQuery, setSubCategorySearchQuery] = useState('');
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [selectedProductIndex, setSelectedProductIndex] = useState(-1);
  const [isImageZoomed, setIsImageZoomed] = useState(false);
  const windowWidth = Dimensions.get('window').width;
  const [isGridView, setIsGridView] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    soldItems: false,
    newShipment: false,
    promotional: false,
    lighting: false,
    hardware: false,
    savedItems: false,
  });

  // Option states
  const [options, setOptions] = useState({
    hideImages: false,
    selectAll: false,
    showZeroQuantity: false,
    showSelectedOnly: false,
  });

  const [quantities, setQuantities] = useState<Record<string, number>>({});
  
  // Filter tags state
  const [activeTags, setActiveTags] = useState<string[]>([]);
  
  const [showQtyFilterModal, setShowQtyFilterModal] = useState(false);
  const [qtyFilter, setQtyFilter] = useState<QtyFilter>(null);
  const [tempQtyFilter, setTempQtyFilter] = useState<QtyFilter>(null);
  
  useEffect(() => {
    loadProducts();
    loadCategories();
    loadSubCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const productData = await productService.getProducts();
      // Get unique categories from products
      const uniqueCategories = ['All', ...new Set(productData.map(product => product.category))].filter(Boolean);
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadSubCategories = async () => {
    try {
      const productData = await productService.getProducts();
      const uniqueSubCategories = [...new Set(productData.map(product => product.subCategory))].filter(Boolean).sort();
      setAllSubCategories(uniqueSubCategories);
      setSubCategories(uniqueSubCategories);
    } catch (error) {
      console.error('Error loading subcategories:', error);
    }
  };

  const loadProducts = async (forceSync: boolean = false) => {
    try {
      setIsLoading(true);
      if (forceSync) {
        setIsSyncing(true);
        await productService.syncProducts();
      }
      
      const products = await productService.getProducts();
      setProducts(products);
      
      const lastSync = await productService.getLastSyncTime();
      setLastSyncTime(lastSync);
    } catch (error) {
      console.error('Error loading products:', error);
      Alert.alert('Error', 'Failed to load products. Please try again.');
    } finally {
      setIsLoading(false);
      setIsSyncing(false);
    }
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
  };

  const handleDiscard = () => {
    navigation.goBack();
  };

  const handleCommit = () => {
    const selectedProducts = products
      .filter(product => quantities[product.itemCode] && quantities[product.itemCode] > 0)
      .map(product => ({
        id: product.itemCode,
        itemCode: product.itemCode,
        description: product.description,
        uom: product.uom,
        unitPrice: product.price,
        quantity: quantities[product.itemCode] || 0,
        discount: product.discountAmount || 0,
        discountPercentage: product.discountPercentage || 0,
        total: (product.price * (quantities[product.itemCode] || 0)) - 
               ((product.discountAmount || 0) * (quantities[product.itemCode] || 0))
      }));

    if (selectedProducts.length === 0) {
      Alert.alert('No Items Selected', 'Please select at least one item with quantity.');
      return;
    }

    // Store the selected items in our store
    orderItemsStore.setSelectedItems(selectedProducts);
    
    // Go back to the previous screen
    navigation.goBack();
  };

  const toggleFilter = (key: keyof typeof filters) => {
    setFilters(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const toggleOption = (key: keyof typeof options) => {
    setOptions(prev => {
      const newOptions = {
        ...prev,
        [key]: !prev[key]
      };
      
      // Handle select all option
      if (key === 'selectAll') {
        if (!prev.selectAll) {
          // Select all visible products
          const newQuantities: Record<string, number> = {};
          filteredProducts.forEach(product => {
            newQuantities[product.itemCode] = 1;
          });
          setQuantities(newQuantities);
        } else {
          // Deselect all products
          setQuantities({});
        }
      }
      
      return newOptions;
    });
  };

  const handleQuantityChange = (productId: string, value: string) => {
    const quantity = parseInt(value) || 0;
    setQuantities(prev => ({
      ...prev,
      [productId]: quantity
    }));
  };

  const handleIncrement = (productId: string) => {
    setQuantities(prev => ({
      ...prev,
      [productId]: (prev[productId] || 0) + 1
    }));
  };

  const handleDecrement = (productId: string) => {
    setQuantities(prev => ({
      ...prev,
      [productId]: Math.max(0, (prev[productId] || 0) - 1)
    }));
  };

  const handleTagPress = (tag: string) => {
    // First update the active tags
    setActiveTags(prev => {
      const newTags = prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag];
      
      // Check if this is a category tag (not 'Sold Items' or 'New Shipment')
      if (tag !== 'Sold Items' && tag !== 'New Shipment') {
        // If we're adding a category tag, update the subcategories
        if (!prev.includes(tag)) {
          const productsByCategory = products.filter(p => p.category === tag);
          const subcategoriesForCategory = [...new Set(productsByCategory.map(p => p.subCategory))].filter(Boolean);
          setSubCategories(subcategoriesForCategory);
          
          // Filter selected subcategories to only include those that belong to the selected category
          setSelectedSubCategories(prev => 
            prev.filter(subcat => subcategoriesForCategory.includes(subcat))
          );
        } else {
          // If we're removing the last category tag, reset to all subcategories
          const remainingCategoryTags = newTags.filter(t => t !== 'Sold Items' && t !== 'New Shipment');
          if (remainingCategoryTags.length === 0) {
            setSubCategories(allSubCategories);
          }
        }
      }
      
      return newTags;
    });
  };

  const handleOptionToggle = (option: keyof typeof options) => {
    setOptions(prev => {
      const newOptions = {
        ...prev,
        [option]: !prev[option]
      };
      
      // Handle select all option
      if (option === 'selectAll') {
        if (!prev.selectAll) {
          // Select all visible products
          const newQuantities: Record<string, number> = {};
          filteredProducts.forEach(product => {
            newQuantities[product.itemCode] = 1;
          });
          setQuantities(newQuantities);
        } else {
          // Deselect all products
          setQuantities({});
        }
      }
      
      return newOptions;
    });
  };

  const handleApplyQtyFilter = () => {
    setQtyFilter(tempQtyFilter);
    setShowQtyFilterModal(false);
  };

  const handleClearQtyFilter = () => {
    setQtyFilter(null);
    setTempQtyFilter(null);
  };

  const handleSubCategoryChange = (subcategory: string) => {
    setSelectedSubCategories(prev => {
      if (subcategory === '') {
        return []; // Clear all selections
      }
      if (prev.includes(subcategory)) {
        return prev.filter(cat => cat !== subcategory);
      }
      return [...prev, subcategory];
    });
  };

  const clearSubCategoryFilter = () => {
    setSelectedSubCategories([]);
  };

  const handleSubCategorySearch = (text: string) => {
    setSubCategorySearchQuery(text);
  };

  const getFilteredSubCategories = () => {
    // First filter by selected category tags
    let filteredByCategory = allSubCategories;
    const categoryTags = activeTags.filter(tag => tag !== 'Sold Items' && tag !== 'New Shipment');
    
    if (categoryTags.length > 0) {
      // Get products that match the selected category tags
      const productsByCategories = products.filter(p => categoryTags.includes(p.category));
      filteredByCategory = [...new Set(productsByCategories.map(p => p.subCategory))].filter(Boolean);
    }
    
    // Then filter by search query
    if (!subCategorySearchQuery) return filteredByCategory;
    
    return filteredByCategory.filter(category => 
      category.toLowerCase().includes(subCategorySearchQuery.toLowerCase())
    );
  };

  const filteredProducts = products.filter(product => {
    // Filter by search query
    const matchesSearch = 
      searchQuery === '' || 
      product.itemCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Filter by subcategory
    const matchesSubCategory = 
      selectedSubCategories.length === 0 || 
      selectedSubCategories.includes(product.subCategory);
    
    // Filter by tags (including categories)
    const categoryTags = activeTags.filter(tag => tag !== 'Sold Items' && tag !== 'New Shipment');
    const specialTags = activeTags.filter(tag => tag === 'Sold Items' || tag === 'New Shipment');
    
    // If no category tags are selected, show all categories
    const matchesCategory = categoryTags.length === 0 || categoryTags.includes(product.category);
    
    // Check special tags (Sold Items, New Shipment)
    const matchesSpecialTags = specialTags.length === 0 || specialTags.every(tag => {
      switch (tag) {
        case 'Sold Items':
          return product.isSold;
        case 'New Shipment':
          return product.isNewShipment;
        default:
          return true;
      }
    });
    
    // Filter by options
    const matchesOptions = 
      (!options.showZeroQuantity ? product.qty > 0 : true) &&
      (!options.showSelectedOnly || quantities[product.itemCode] > 0);
    
    const matchesQtyFilter = !qtyFilter || (
      qtyFilter.criterion === '>=' ? product.qty >= qtyFilter.value :
      qtyFilter.criterion === '<=' ? product.qty <= qtyFilter.value :
      product.qty === qtyFilter.value
    );
    
    return matchesSearch && matchesCategory && matchesSubCategory && matchesSpecialTags && matchesOptions && matchesQtyFilter;
  });

  const formatCurrency = (amount: number): string => {
    return amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handleProductPress = (index: number) => {
    setSelectedProductIndex(index);
    setIsDetailModalVisible(true);
  };

  const handleCloseDetail = () => {
    setIsDetailModalVisible(false);
    setSelectedProductIndex(-1);
    setIsImageZoomed(false);
  };

  const handleSwipeLeft = () => {
    if (selectedProductIndex < filteredProducts.length - 1) {
      setSelectedProductIndex(prev => prev + 1);
    }
  };

  const handleSwipeRight = () => {
    if (selectedProductIndex > 0) {
      setSelectedProductIndex(prev => prev - 1);
    }
  };

  const toggleViewMode = () => {
    setIsGridView(prev => !prev);
  };

  const renderDetailModal = () => {
    if (selectedProductIndex === -1) return null;

    return (
      <ProductDetailSheet
        products={filteredProducts}
        currentIndex={selectedProductIndex}
        isVisible={isDetailModalVisible}
        onClose={handleCloseDetail}
        onIndexChange={setSelectedProductIndex}
      />
    );
  };

  const renderProductCard = ({ item: product, index }: { item: Product; index: number }) => (
    <TouchableOpacity
      style={[
        styles.productRow,
        isGridView && styles.productGridItem
      ]}
      onPress={() => handleProductPress(index)}
    >
      {isGridView ? (
        // Grid View Layout
        <View style={styles.productGridContainer}>
          {!options.hideImages && (
            <View style={styles.productGridImageContainer}>
              <Image
                source={product.imageUrl ? { uri: product.imageUrl } : require('../../assets/product-placeholder.png')}
                style={styles.productGridImage}
                defaultSource={require('../../assets/product-placeholder.png')}
              />
            </View>
          )}
          
          <View style={styles.productGridContent}>
            <View style={styles.productGridHeader}>
              <Text style={styles.productGridCode}>{product.itemCode}</Text>
              <TouchableOpacity
                style={styles.starButton}
                onPress={(e) => {
                  e.stopPropagation();
                  productService.toggleSavedProduct(product.itemCode);
                }}
              >
                <Text style={styles.starButtonText}>{product.isSaved ? '★' : '☆'}</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.productGridDescription} numberOfLines={2}>
              {product.description}
            </Text>

            <View style={styles.productGridDetails}>
              <View style={styles.productGridDetailRow}>
                <Text style={styles.productGridLabel}>Available:</Text>
                <Text style={[
                  styles.productGridValue,
                  product.qty === 0 && styles.zeroQuantity
                ]}>
                  {product.qty} {product.uom}
                </Text>
              </View>

              <View style={styles.productGridDetailRow}>
                <Text style={styles.productGridLabel}>Price:</Text>
                <Text style={styles.productGridValue}>{formatCurrency(product.price)}</Text>
              </View>

              {product.discountPercentage > 0 && (
                <View style={styles.productGridDetailRow}>
                  <Text style={styles.productGridLabel}>Discount:</Text>
                  <View style={styles.gridDiscountContainer}>
                    <Text style={styles.gridDiscountText}>{product.discountPercentage}%</Text>
                    <Text style={styles.gridDiscountAmount}>-{formatCurrency(product.discountAmount)}</Text>
                  </View>
                </View>
              )}
            </View>

            <View style={styles.productGridQuantity}>
              <View style={styles.gridQuantityContainer}>
                <TouchableOpacity 
                  style={[styles.quantityButton, quantities[product.itemCode] === 0 && styles.quantityButtonDisabled]}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleDecrement(product.itemCode);
                  }}
                >
                  <Text style={[
                    styles.quantityButtonText,
                    quantities[product.itemCode] === 0 && styles.quantityButtonTextDisabled
                  ]}>−</Text>
                </TouchableOpacity>
                <TextInput
                  style={[
                    styles.quantityInput,
                    quantities[product.itemCode] >= product.qty && styles.quantityInputMax
                  ]}
                  value={String(quantities[product.itemCode] || 0)}
                  onChangeText={(value) => handleQuantityChange(product.itemCode, value)}
                  keyboardType="numeric"
                  onPressIn={(e) => e.stopPropagation()}
                />
                <TouchableOpacity 
                  style={[
                    styles.quantityButton,
                    quantities[product.itemCode] >= product.qty && styles.quantityButtonDisabled
                  ]}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleIncrement(product.itemCode);
                  }}
                >
                  <Text style={[
                    styles.quantityButtonText,
                    quantities[product.itemCode] >= product.qty && styles.quantityButtonTextDisabled
                  ]}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      ) : (
        // List View Layout (existing code)
        <>
          {!options.hideImages && (
            <View style={styles.productImageColumn}>
              <Image
                source={product.imageUrl ? { uri: product.imageUrl } : require('../../assets/product-placeholder.png')}
                style={styles.productImage}
                defaultSource={require('../../assets/product-placeholder.png')}
              />
            </View>
          )}
          
          <View style={[styles.productInfoColumn, options.hideImages && { marginLeft: 0 }]}>
            <View style={styles.productHeaderRow}>
              <Text style={styles.productCode}>{product.itemCode}</Text>
              <TouchableOpacity
                style={styles.starButton}
                onPress={(e) => {
                  e.stopPropagation();
                  productService.toggleSavedProduct(product.itemCode);
                }}
              >
                <Text style={styles.starButtonText}>{product.isSaved ? '★' : '☆'}</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.productName} numberOfLines={2}>{product.description}</Text>
          </View>
          
          <View style={styles.priceColumn}>
            <Text style={styles.priceValue}>{formatCurrency(product.price)}</Text>
            {product.discountPercentage > 0 && (
              <View style={styles.discountContainer}>
                <Text style={styles.discountTextStyle}>{product.discountPercentage}%</Text>
                <Text style={styles.discountAmountStyle}>-{formatCurrency(product.discountAmount)}</Text>
              </View>
            )}
          </View>
          
          <View style={styles.availabilityColumn}>
            <Text style={[
              styles.availabilityValue,
              product.qty === 0 && styles.zeroQuantity
            ]}>{product.qty}</Text>
            <Text style={styles.uomLabel}>{product.uom}</Text>
          </View>
          
          <View style={styles.quantityColumn}>
            <View style={styles.quantityContainer}>
              <TouchableOpacity 
                style={[styles.quantityButton, quantities[product.itemCode] === 0 && styles.quantityButtonDisabled]}
                onPress={(e) => {
                  e.stopPropagation();
                  handleDecrement(product.itemCode);
                }}
              >
                <Text style={[
                  styles.quantityButtonText,
                  quantities[product.itemCode] === 0 && styles.quantityButtonTextDisabled
                ]}>−</Text>
              </TouchableOpacity>
              <TextInput
                style={[
                  styles.quantityInput,
                  quantities[product.itemCode] >= product.qty && styles.quantityInputMax
                ]}
                value={String(quantities[product.itemCode] || 0)}
                onChangeText={(value) => handleQuantityChange(product.itemCode, value)}
                keyboardType="numeric"
                onPressIn={(e) => e.stopPropagation()}
              />
              <TouchableOpacity 
                style={[
                  styles.quantityButton,
                  quantities[product.itemCode] >= product.qty && styles.quantityButtonDisabled
                ]}
                onPress={(e) => {
                  e.stopPropagation();
                  handleIncrement(product.itemCode);
                }}
              >
                <Text style={[
                  styles.quantityButtonText,
                  quantities[product.itemCode] >= product.qty && styles.quantityButtonTextDisabled
                ]}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}
    </TouchableOpacity>
  );

  const renderQtyFilterModal = () => {
    return (
      <Modal
        visible={showQtyFilterModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowQtyFilterModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowQtyFilterModal(false)}
        >
          <View style={styles.qtyFilterModal} onStartShouldSetResponder={() => true}>
            <Text style={styles.qtyFilterTitle}>Filter by Quantity</Text>
            
            <View style={styles.qtyFilterContent}>
              <View style={styles.qtyFilterRow}>
                <TouchableOpacity
                  style={[
                    styles.criterionButton,
                    tempQtyFilter?.criterion === '>=' && styles.criterionButtonActive
                  ]}
                  onPress={() => setTempQtyFilter({ criterion: '>=', value: tempQtyFilter?.value || 0 })}
                >
                  <Text style={[
                    styles.criterionButtonText,
                    tempQtyFilter?.criterion === '>=' && styles.criterionButtonTextActive
                  ]}>≥</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.criterionButton,
                    tempQtyFilter?.criterion === '<=' && styles.criterionButtonActive
                  ]}
                  onPress={() => setTempQtyFilter({ criterion: '<=', value: tempQtyFilter?.value || 0 })}
                >
                  <Text style={[
                    styles.criterionButtonText,
                    tempQtyFilter?.criterion === '<=' && styles.criterionButtonTextActive
                  ]}>≤</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.criterionButton,
                    tempQtyFilter?.criterion === '=' && styles.criterionButtonActive
                  ]}
                  onPress={() => setTempQtyFilter({ criterion: '=', value: tempQtyFilter?.value || 0 })}
                >
                  <Text style={[
                    styles.criterionButtonText,
                    tempQtyFilter?.criterion === '=' && styles.criterionButtonTextActive
                  ]}>=</Text>
                </TouchableOpacity>
              </View>

              <TextInput
                style={styles.qtyFilterInput}
                value={String(tempQtyFilter?.value || '')}
                onChangeText={(text) => {
                  const value = parseInt(text) || 0;
                  setTempQtyFilter(prev => prev ? { ...prev, value } : { criterion: '>=', value });
                }}
                keyboardType="numeric"
                placeholder="Enter quantity"
              />
            </View>

            <View style={styles.qtyFilterActions}>
              <TouchableOpacity
                style={styles.qtyFilterButton}
                onPress={() => setShowQtyFilterModal(false)}
              >
                <Text style={styles.qtyFilterButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.qtyFilterButton, styles.qtyFilterApplyButton]}
                onPress={handleApplyQtyFilter}
              >
                <Text style={[styles.qtyFilterButtonText, styles.qtyFilterApplyButtonText]}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  const modal = renderDetailModal();
  
  // Initialize styles
  const styles = createStyles({});
  
  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
        
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Add Items</Text>
            <Text style={styles.headerSubtitle}>/ {customerName}</Text>
          </View>
          
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={[styles.headerButton, styles.discardButton]}
              onPress={handleDiscard}
            >
              <Text style={styles.discardButtonIcon}>✕</Text>
              <Text style={styles.discardButtonText}>Discard</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.headerButton, styles.commitButton]}
              onPress={handleCommit}
            >
              <Text style={styles.commitButtonIcon}>✓</Text>
              <Text style={styles.commitButtonText}>Commit</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar and SubCategory Dropdown */}
        <View style={styles.searchContainer}>
          {/* SubCategory Dropdown Button */}
          <TouchableOpacity 
            style={styles.subCategoryDropdownButton}
            onPress={() => setShowSubCategoryDropdown(true)}
          >
            <Text style={styles.subCategoryButtonText}>
              {selectedSubCategories.length > 0 
                ? `${selectedSubCategories.length} Selected`
                : 'Category'}
            </Text>
            <Text style={styles.dropdownIcon}>▼</Text>
          </TouchableOpacity>
          
          {/* Search Input */}
          <View style={styles.searchInputContainer}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search by code or name"
              value={searchQuery}
              onChangeText={handleSearch}
            />
          </View>
        </View>

        {/* Display selected subcategories */}
        {selectedSubCategories.length > 0 && (
          <View style={styles.activeFiltersContainer}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.activeFiltersScroll}
            >
              {selectedSubCategories.map(category => (
                <View key={category} style={styles.activeFilterPill}>
                  <Text style={styles.activeFilterText}>{category}</Text>
                  <TouchableOpacity 
                    onPress={() => handleSubCategoryChange(category)}
                    style={styles.clearFilterButton}
                  >
                    <Text style={styles.clearFilterIcon}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity 
                onPress={clearSubCategoryFilter}
                style={styles.clearAllButton}
              >
                <Text style={styles.clearAllText}>Clear All</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}

        {/* Filter Tags */}
        <View style={styles.filterTagsContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterTagsContent}
          >
            {/* Special filters */}
            <TouchableOpacity
              style={[
                styles.filterTag,
                activeTags.includes('Sold Items') && styles.filterTagActive
              ]}
              onPress={() => handleTagPress('Sold Items')}
            >
              <Text style={[
                styles.filterTagText,
                activeTags.includes('Sold Items') && styles.filterTagTextActive
              ]}>
                Sold Items
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterTag,
                activeTags.includes('New Shipment') && styles.filterTagActive
              ]}
              onPress={() => handleTagPress('New Shipment')}
            >
              <Text style={[
                styles.filterTagText,
                activeTags.includes('New Shipment') && styles.filterTagTextActive
              ]}>
                New Shipment
              </Text>
            </TouchableOpacity>

            {/* Category filters */}
            {categories.map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.filterTag,
                  activeTags.includes(category) && styles.filterTagActive
                ]}
                onPress={() => handleTagPress(category)}
              >
                <Text style={[
                  styles.filterTagText,
                  activeTags.includes(category) && styles.filterTagTextActive
                ]}>
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Options */}
        <View style={styles.optionsContainer}>
          <TouchableOpacity
            style={[styles.optionButton]}
            onPress={toggleViewMode}
          >
            <View style={styles.optionButtonContent}>
              <Text style={styles.optionText}>
                {isGridView ? '☰' : '⊞'}
              </Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.optionButton, options.hideImages && styles.optionButtonActive]}
            onPress={() => handleOptionToggle('hideImages')}
          >
            <Text style={[styles.optionText, options.hideImages && styles.optionTextActive]}>
              Hide Images
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.optionButton, options.selectAll && styles.optionButtonActive]}
            onPress={() => handleOptionToggle('selectAll')}
          >
            <Text style={[styles.optionText, options.selectAll && styles.optionTextActive]}>
              Select All
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.optionButton, options.showZeroQuantity && styles.optionButtonActive]}
            onPress={() => handleOptionToggle('showZeroQuantity')}
          >
            <Text style={[styles.optionText, options.showZeroQuantity && styles.optionTextActive]}>
              Show Zero Quantity
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.optionButton, options.showSelectedOnly && styles.optionButtonActive]}
            onPress={() => handleOptionToggle('showSelectedOnly')}
          >
            <Text style={[styles.optionText, options.showSelectedOnly && styles.optionTextActive]}>
              Selected Items Only
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.optionButton, qtyFilter && styles.optionButtonActive]}
            onPress={() => {
              setTempQtyFilter(qtyFilter);
              setShowQtyFilterModal(true);
            }}
          >
            <View style={styles.optionButtonContent}>
              <Text style={[styles.optionText, qtyFilter && styles.optionTextActive]}>
                {qtyFilter 
                  ? `Qty ${qtyFilter.criterion} ${qtyFilter.value}`
                  : 'Filter by Qty'}
              </Text>
              {qtyFilter && (
                <TouchableOpacity
                  style={styles.clearFilterButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleClearQtyFilter();
                  }}
                >
                  <Text style={styles.clearFilterIcon}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* Product List */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4A90E2" />
            <Text style={styles.loadingText}>Loading products...</Text>
          </View>
        ) : (
          <FlatList
            key={isGridView ? 'grid' : 'list'}
            data={filteredProducts}
            renderItem={renderProductCard}
            keyExtractor={(item) => item.itemCode}
            numColumns={isGridView ? 2 : 1}
            contentContainerStyle={[
              styles.productList,
              isGridView && styles.productGridList
            ]}
            columnWrapperStyle={isGridView ? styles.productGridRow : undefined}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No products found</Text>
              </View>
            }
          />
        )}
      </SafeAreaView>
      {modal}
      {renderQtyFilterModal()}

      {/* SubCategory Dropdown Modal */}
      <Modal
        visible={showSubCategoryDropdown}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSubCategoryDropdown(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => {
            setShowSubCategoryDropdown(false);
            setSubCategorySearchQuery('');
          }}
        >
          <View style={styles.dropdownContainer}>
            <View style={styles.dropdownSearchContainer}>
              <TextInput
                style={styles.dropdownSearchInput}
                placeholder="Search subcategories..."
                value={subCategorySearchQuery}
                onChangeText={handleSubCategorySearch}
                autoFocus={true}
              />
              {subCategorySearchQuery ? (
                <TouchableOpacity 
                  style={styles.clearSearchButton}
                  onPress={() => setSubCategorySearchQuery('')}
                >
                  <Text style={styles.clearSearchIcon}>✕</Text>
                </TouchableOpacity>
              ) : null}
            </View>
            
            <ScrollView style={styles.dropdownScrollView}>
              <TouchableOpacity
                style={[
                  styles.dropdownItem,
                  selectedSubCategories.length === 0 && styles.selectedDropdownItem
                ]}
                onPress={() => handleSubCategoryChange('')}
              >
                <Text style={styles.dropdownItemText}>All Subcategories</Text>
              </TouchableOpacity>
              
              {getFilteredSubCategories().map((subcat) => (
                <TouchableOpacity
                  key={subcat}
                  style={[
                    styles.dropdownItem,
                    selectedSubCategories.includes(subcat) && styles.selectedDropdownItem
                  ]}
                  onPress={() => handleSubCategoryChange(subcat)}
                >
                  <Text style={styles.dropdownItemText}>{subcat}</Text>
                  {selectedSubCategories.includes(subcat) && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
              
              {getFilteredSubCategories().length === 0 && (
                <View style={styles.noResultsContainer}>
                  <Text style={styles.noResultsText}>No subcategories found</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  
  // Header styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight! + 20,
    paddingBottom: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
  },
  
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginLeft: 8,
  },
  
  discardButton: {
    backgroundColor: '#F87171',
  },
  
  discardButtonIcon: {
    fontSize: 16,
    color: 'white',
    marginRight: 4,
  },
  
  discardButtonText: {
    fontSize: 14,
    color: 'white',
    fontWeight: '500',
  },
  
  commitButton: {
    backgroundColor: '#4ADE80',
  },
  
  commitButtonIcon: {
    fontSize: 16,
    color: 'white',
    marginRight: 4,
  },
  
  commitButtonText: {
    fontSize: 14,
    color: 'white',
    fontWeight: '500',
  },
  
  // Search and category styles
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    alignItems: 'center',
  },
  
  categoryDropdownContainer: {
    flex: 1,
    maxWidth: 150,
    height: 40,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: 'white',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  
  categoryDropdown: {
    height: 40,
  },
  
  searchInputContainer: {
    flex: 2,
    flexDirection: 'row',
    height: 40,
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  
  searchIcon: {
    fontSize: 16,
    color: '#6B7280',
    marginRight: 8,
  },
  
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 14,
    color: '#1F2937',
  },
  
  // Filter styles
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F3F4F6',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  
  filterHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  
  filterHeaderIcon: {
    fontSize: 12,
    color: '#6B7280',
  },
  
  // Product list styles
  productList: {
    paddingVertical: 8,
  },
  
  productRow: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    padding: 16,
    alignItems: 'center',
    minHeight: 100,
  },
  
  // Product columns
  productImageColumn: {
    width: 70,
    marginRight: 8,
  },
  
  productInfoColumn: {
    flex: 2,
    marginRight: 8,
  },
  
  priceColumn: {
    flex: 1,
    marginRight: 8,
  },
  
  availabilityColumn: {
    flex: 1,
    marginRight: 8,
  },
  
  quantityColumn: {
    flex: 1,
    alignItems: 'center',
  },
  
  // Product details
  productImage: {
    width: 70,
    height: 70,
    borderRadius: 4,
    backgroundColor: '#F3F4F6',
  },
  
  productHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  
  productCode: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  
  starButton: {
    padding: 4,
  },
  
  starButtonText: {
    fontSize: 18,
    color: '#F59E0B',
  },
  
  productName: {
    fontSize: 13,
    color: '#4B5563',
    marginTop: 4,
  },
  
  // Price styles
  priceValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  
  discountContainer: {
    flexDirection: 'column',
    marginTop: 2,
  },
  
  discountTextStyle: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
  },
  
  discountAmountStyle: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '700',
  },
  
  // Availability styles
  availabilityValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  
  uomLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  
  // Quantity controls
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    overflow: 'hidden',
    height: 40,
  },
  
  quantityButton: {
    width: 36,
    height: 40,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  quantityButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4B5563',
  },
  
  quantityInput: {
    width: 48,
    height: 40,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    backgroundColor: 'white',
    padding: 0,
  },
  
  // Empty state
  emptyContainer: {
    padding: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  
  // Loading state
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#4B5563',
  },
  
  filterTagsContainer: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    height: 60,
    paddingVertical: 8,
  },
  
  filterTagsContent: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  filterTag: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
    height: 36,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  
  filterTagActive: {
    backgroundColor: '#4A90E2',
    borderColor: '#4A90E2',
  },
  
  filterTagText: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '500',
  },
  
  filterTagTextActive: {
    color: 'white',
  },
  
  optionsContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 8,
  },
  
  optionButton: {
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  
  optionButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  
  optionButtonActive: {
    backgroundColor: '#4A90E2',
  },
  
  optionText: {
    fontSize: 14,
    color: '#4B5563',
  },
  
  optionTextActive: {
    color: 'white',
  },
  
  zeroQuantity: {
    color: '#EF4444',
  },
  
  detailModalContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  
  detailContent: {
    flex: 1,
    backgroundColor: 'white',
  },
  
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  
  detailNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  navButton: {
    padding: 8,
  },
  
  navButtonDisabled: {
    opacity: 0.5,
  },
  
  navButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4B5563',
  },
  
  closeButton: {
    padding: 8,
  },
  
  closeButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4B5563',
  },
  
  detailScroll: {
    flex: 1,
  },
  
  detailImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  detailInfo: {
    padding: 16,
  },
  
  detailProductCode: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  
  detailDescription: {
    fontSize: 13,
    color: '#4B5563',
    marginTop: 8,
  },
  
  detailPriceSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  
  detailPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  
  detailDiscountContainer: {
    flexDirection: 'column',
    marginLeft: 8,
  },
  
  detailDiscountText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
  },
  
  detailDiscountAmount: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '700',
  },
  
  detailQuantitySection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  
  detailAvailability: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  detailLabel: {
    fontSize: 12,
    color: '#4B5563',
    marginRight: 8,
  },
  
  detailQuantityValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  
  detailUom: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 8,
  },
  
  detailQuantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  quantityButtonDisabled: {
    opacity: 0.5,
  },
  
  quantityButtonTextDisabled: {
    color: '#9CA3AF',
  },
  
  quantityInputMax: {
    borderColor: '#EF4444',
  },
  
  detailCounter: {
    fontSize: 14,
    color: '#6B7280',
    marginHorizontal: 8,
  },
  
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'stretch',
  },
  
  qtyFilterModal: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxWidth: 400,
  },
  
  qtyFilterTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  
  qtyFilterContent: {
    marginBottom: 20,
  },
  
  qtyFilterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  
  criterionButton: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  
  criterionButtonActive: {
    backgroundColor: '#4A90E2',
    borderColor: '#4A90E2',
  },
  
  criterionButtonText: {
    fontSize: 18,
    color: '#4B5563',
  },
  
  criterionButtonTextActive: {
    color: 'white',
  },
  
  qtyFilterInput: {
    height: 40,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#1F2937',
  },
  
  qtyFilterActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  
  qtyFilterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  
  qtyFilterApplyButton: {
    backgroundColor: '#4A90E2',
  },
  
  qtyFilterButtonText: {
    fontSize: 14,
    color: '#4B5563',
  },
  
  qtyFilterApplyButtonText: {
    color: 'white',
  },
  
  clearFilterButton: {
    padding: 2,
  },
  
  clearFilterIcon: {
    fontSize: 14,
    color: '#2B6CB0',
  },
  
  maxQuantityText: {
    fontSize: 12,
    color: '#EF4444',
    marginLeft: 8,
  },
  
  productGridList: {
    paddingHorizontal: 8,
  },
  
  productGridRow: {
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  
  productGridItem: {
    flex: 1,
    margin: 8,
    maxWidth: '47%',
  },

  productGridContainer: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },

  productGridImageContainer: {
    width: '100%',
    height: 180,
    backgroundColor: '#F3F4F6',
  },

  productGridImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },

  productGridContent: {
    padding: 12,
  },

  productGridHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },

  productGridCode: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },

  productGridDescription: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 12,
    lineHeight: 20,
  },

  productGridDetails: {
    marginBottom: 12,
    gap: 6,
  },

  productGridDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  productGridLabel: {
    fontSize: 13,
    color: '#6B7280',
  },

  productGridValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },

  gridDiscountContainer: {
    alignItems: 'flex-end',
  },

  gridDiscountText: {
    fontSize: 13,
    color: '#10B981',
    fontWeight: '600',
  },

  gridDiscountAmount: {
    fontSize: 13,
    color: '#10B981',
    fontWeight: '700',
  },

  productGridQuantity: {
    marginTop: 4,
  },

  gridQuantityContainer: {
    flexDirection: 'row',
    height: 40,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    overflow: 'hidden',
  },

  subCategoryDropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  subCategoryButtonText: {
    fontSize: 14,
    color: '#333',
    marginRight: 4,
  },
  dropdownIcon: {
    fontSize: 12,
    color: '#666',
  },
  dropdownContainer: {
    marginTop: 100,
    marginHorizontal: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 8,
    maxHeight: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  dropdownSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingBottom: 8,
    marginBottom: 8,
  },
  dropdownSearchInput: {
    flex: 1,
    height: 40,
    backgroundColor: '#F5F7FA',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#333',
  },
  clearSearchButton: {
    padding: 8,
    marginLeft: 8,
  },
  clearSearchIcon: {
    fontSize: 16,
    color: '#666',
  },
  dropdownScrollView: {
    maxHeight: 300,
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  selectedDropdownItem: {
    backgroundColor: '#EBF8FF',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#333',
  },
  checkmark: {
    fontSize: 16,
    color: '#4A90E2',
    fontWeight: '600',
  },
  noResultsContainer: {
    padding: 16,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 16,
    color: '#666',
  },
  activeFiltersContainer: {
    marginTop: 8,
    marginBottom: 8,
  },
  activeFiltersScroll: {
    paddingHorizontal: 16,
  },
  activeFilterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF8FF',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  activeFilterText: {
    fontSize: 14,
    color: '#2B6CB0',
    marginRight: 4,
  },
  clearAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7FAFC',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  clearAllText: {
    fontSize: 14,
    color: '#4A5568',
  },
});

export default AddItemsScreen; 
