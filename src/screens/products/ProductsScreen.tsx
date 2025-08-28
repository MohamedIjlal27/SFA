import React, { useState, useEffect, useCallback } from 'react';
import { SafeAreaView, StatusBar } from 'react-native';
import ProductsHeader from '../../components/ProductsHeader';
import ProductsSearchBar from '../../components/ProductsSearchBar';
import CategoryDropdown from '../../components/CategoryDropdown';
import FilterDropdown from '../../components/FilterDropdown';
import ProductList from '../../components/ProductList';
import Pagination from '../../components/Pagination';
import QuantityFilterModal from '../../components/QuantityFilterModal';
import ProductsScreenStyles from '../../utils/styles/ProductsScreen.styles';
import { Product, productService, PaginatedProductsResponse } from '../../services/productService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ProductDetailSheet from '../../components/ProductDetailSheet';
import { openDatabase, createTables } from '../../db';
import { useDispatch, useSelector } from 'react-redux';
import { setLastSyncTime, selectLastSyncTime } from '../../redux/syncSlice';

const PAGE_SIZE = 10;
const FILTER_OPTIONS: { label: string; value: FilterType; section: string }[] = [
  { label: 'Lighting', value: 'lighting', section: 'Categories' },
  { label: 'Hardware', value: 'hardware', section: 'Categories' },
  { label: 'New Shipment Items', value: 'newShipment', section: 'Special' },
  { label: 'Promotional Items', value: 'promotional', section: 'Special' },
  { label: 'Saved Items', value: 'saved', section: 'Special' },
];

type ViewMode = 'list' | 'grid';
type FilterType = 'newShipment' | 'promotional' | 'lighting' | 'hardware' | 'saved';
type QtyFilter = { criterion: 'gte' | 'lte' | 'eq'; value: number } | null;

const ProductsScreen = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  // Use Redux global sync time
  const [activeFilters, setActiveFilters] = useState<Set<FilterType>>(new Set());
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [qtyFilter, setQtyFilter] = useState<QtyFilter>(null);
  const [tempQtyFilter, setTempQtyFilter] = useState<QtyFilter>(null);
  const [showQtyFilterModal, setShowQtyFilterModal] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [paginationInfo, setPaginationInfo] = useState<{ total: number; totalPages: number; hasNext: boolean; hasPrev: boolean } | null>(null);
  const [selectedProductIndex, setSelectedProductIndex] = useState<number>(-1);
  const [isDetailSheetVisible, setIsDetailSheetVisible] = useState(false);
  const dispatch = useDispatch();
  const lastSyncTime = useSelector(selectLastSyncTime);

  const loadCategories = async () => {
    try {
      const cats = await productService.getCategories();
      setCategories(cats);
    } catch {
      setCategories([]);
        }
  };

  const loadProducts = async (page = 1, forceSync = false, resetList = false) => {
    try {
      setSyncError(null);
      if (page === 1 || forceSync) {
        if (resetList) {
          setIsLoading(true);
          setProducts([]);
        }
        if (forceSync) {
          setIsSyncing(true);
          try {
            await productService.syncProducts();
            const syncTime = await productService.getLastSyncTime();
            dispatch(setLastSyncTime(syncTime));
            await loadCategories();
          } catch (error: any) {
            setSyncError(error.message || 'Failed to sync products');
          } finally {
            setIsSyncing(false);
          }
        }
        setCurrentPage(1);
        setHasMore(true);
      } else {
        setIsLoading(true);
      }
      const response: PaginatedProductsResponse = await productService.getProductsPaginated(
        page,
        PAGE_SIZE,
        searchQuery,
        activeFilters,
        [],
        selectedCategory
      );
      const filteredProducts = qtyFilter ? response.products.filter(product => {
        switch (qtyFilter.criterion) {
          case 'gte': return product.qty >= qtyFilter.value;
          case 'lte': return product.qty <= qtyFilter.value;
          case 'eq': return product.qty === qtyFilter.value;
        }
      }) : response.products;
      setPaginationInfo({
        total: response.total,
        totalPages: response.totalPages,
        hasNext: response.hasNext,
        hasPrev: response.hasPrev,
      });
      if (filteredProducts.length === 0) setHasMore(false);
      else {
        setProducts(prev => page === 1 ? filteredProducts : [...prev, ...filteredProducts]);
        setCurrentPage(page);
        setHasMore(response.hasNext);
      }
    } catch {
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadCategories(); loadProducts(1, false, true); }, []);

  const handleSearch = (text: string) => { setSearchQuery(text); setProducts([]); setCurrentPage(1); setHasMore(true); loadProducts(1, false, true); };
  const handleCategoryChange = (category: string) => { setSelectedCategory(category); setShowCategoryDropdown(false); setCategorySearchQuery(''); setProducts([]); setCurrentPage(1); setHasMore(true); loadProducts(1, false, true); };
  const handleApplyQtyFilter = () => { if (tempQtyFilter && tempQtyFilter.value >= 0) { setQtyFilter(tempQtyFilter); setProducts([]); setCurrentPage(1); setHasMore(true); loadProducts(1, false, true); } setShowQtyFilterModal(false); };
  const handleClearQtyFilter = () => { setQtyFilter(null); setTempQtyFilter(null); setProducts([]); setCurrentPage(1); setHasMore(true); loadProducts(1, false, true); };
  const handleRefresh = () => { setProducts([]); loadProducts(1, true, true); };
  const handleProductPress = (index: number) => { setSelectedProductIndex(index); setIsDetailSheetVisible(true); };
  const handleToggleSaved = (itemCode: string) => { productService.toggleSavedProduct(itemCode); };
  const formatCurrency = (amount: number) => amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const getFilteredCategories = () => categorySearchQuery ? categories.filter(cat => cat.toLowerCase().includes(categorySearchQuery.toLowerCase())) : categories;
  const filterCount = activeFilters.size + (qtyFilter ? 1 : 0);

  // Upsert products from API to local DB on sync
  const handleSyncProducts = async () => {
    setIsSyncing(true);
    setSyncError(null);
    try {
      const db = await openDatabase();
      await createTables(db); // Ensure tables exist before syncing
      await productService.syncProducts(); // fetches and caches products from API
      const allProducts = (await productService.getProducts()) || [];
      for (const p of allProducts) {
        if (!p) continue;
        await db.executeSql(
          `INSERT OR REPLACE INTO products (id, itemCode, description, price, qty, uom, imageUrl, discountPercentage, discountAmount, category, subCategory) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [p.itemCode, p.itemCode, p.description, p.price, p.qty, p.uom, p.imageUrl || '', p.discountPercentage, p.discountAmount, p.category, p.subCategory]
        );
      }
      const syncTime = await productService.getLastSyncTime();
      dispatch(setLastSyncTime(syncTime));
      await loadCategories();
      await loadProducts(1, false, true);
    } catch (error: any) {
      setSyncError(error.message || 'Failed to sync products');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <SafeAreaView style={ProductsScreenStyles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <ProductsHeader
        syncError={syncError}
        lastSyncTime={lastSyncTime}
        isSyncing={isSyncing}
        onSync={handleSyncProducts}
      />
      <ProductsSearchBar
        searchQuery={searchQuery}
        onSearch={handleSearch}
        viewMode={viewMode}
        setViewMode={setViewMode}
        onFilterPress={() => setShowFilterDropdown(true)}
        filterCount={filterCount}
        onCategoryPress={() => setShowCategoryDropdown(true)}
        selectedCategory={selectedCategory}
      />
      <CategoryDropdown
          visible={showCategoryDropdown}
        onClose={() => setShowCategoryDropdown(false)}
        categories={getFilteredCategories()}
        selectedCategory={selectedCategory}
        onSelect={handleCategoryChange}
        searchQuery={categorySearchQuery}
        onSearch={setCategorySearchQuery}
      />
      <FilterDropdown
        visible={showFilterDropdown}
        onClose={() => setShowFilterDropdown(false)}
        activeFilters={activeFilters}
        toggleFilter={filter => setActiveFilters(prev => { const newFilters = new Set(prev); newFilters.has(filter) ? newFilters.delete(filter) : newFilters.add(filter); return newFilters; })}
        qtyFilter={qtyFilter}
        onQtyFilterPress={() => { setTempQtyFilter(qtyFilter || { criterion: 'gte', value: 0 }); setShowQtyFilterModal(true); setShowFilterDropdown(false); }}
        onClearAll={() => { setActiveFilters(new Set()); setQtyFilter(null); setTempQtyFilter(null); setShowFilterDropdown(false); setProducts([]); setCurrentPage(1); setHasMore(true); loadProducts(1, false, true); }}
        filterOptions={FILTER_OPTIONS}
      />
      <QuantityFilterModal
        visible={showQtyFilterModal}
        onClose={() => setShowQtyFilterModal(false)}
        tempQtyFilter={tempQtyFilter}
        setTempQtyFilter={setTempQtyFilter}
        onApply={handleApplyQtyFilter}
        onClear={handleClearQtyFilter}
      />
      <ProductList
        products={products}
        isLoading={isLoading}
        isSyncing={isSyncing}
        viewMode={viewMode}
          onRefresh={handleRefresh}
        onProductPress={handleProductPress}
        onToggleSaved={handleToggleSaved}
        formatCurrency={formatCurrency}
        listContainerStyle={[ProductsScreenStyles.listContainer, products.length === 0 && ProductsScreenStyles.emptyListContainer]}
      />
      {paginationInfo && (
        <Pagination
          currentPage={currentPage}
          totalPages={paginationInfo.totalPages}
          total={paginationInfo.total}
          hasPrev={paginationInfo.hasPrev}
          hasNext={paginationInfo.hasNext}
          onPrev={() => { if (paginationInfo.hasPrev) { setProducts([]); setCurrentPage(currentPage - 1); setHasMore(true); loadProducts(currentPage - 1, false, true); } }}
          onNext={() => { if (paginationInfo.hasNext) { setProducts([]); setCurrentPage(currentPage + 1); setHasMore(true); loadProducts(currentPage + 1, false, true); } }}
        />
      )}
      <ProductDetailSheet
        products={products}
        currentIndex={selectedProductIndex}
        isVisible={isDetailSheetVisible}
        onClose={() => setIsDetailSheetVisible(false)}
        onIndexChange={setSelectedProductIndex}
      />
    </SafeAreaView>
  );
};

export default ProductsScreen; 