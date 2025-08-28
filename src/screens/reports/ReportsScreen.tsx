import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { reportsService } from '../../services/reportsService';
import { CustomerSales, ProductSales, CategorySales, RangeCoverageInsight } from '../../services/reportsService';

const ReportsScreen = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [topCustomers, setTopCustomers] = useState<CustomerSales[]>([]);
  const [topProducts, setTopProducts] = useState<ProductSales[]>([]);
  const [categorySales, setCategorySales] = useState<CategorySales[]>([]);
  const [rangeCoverage, setRangeCoverage] = useState<RangeCoverageInsight[]>([]);

  useEffect(() => {
    loadReportData();
  }, []);

  const loadReportData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Loading report data...');
      
      const [customers, products, categories, coverage] = await Promise.all([
        reportsService.getTopCustomers(5),
        reportsService.getTopProducts(5),
        reportsService.getCategorySales(),
        reportsService.getRangeCoverageInsights(),
      ]);

      // Debug: Check for duplicate IDs
      const customerIds = customers.map(c => c.customerId);
      const productIds = products.map(p => p.productId);
      const categoryNames = categories.map(c => c.category);
      const insightCategories = coverage.map(i => i.category);

      const duplicateCustomerIds = customerIds.filter((id, index) => customerIds.indexOf(id) !== index);
      const duplicateProductIds = productIds.filter((id, index) => productIds.indexOf(id) !== index);
      const duplicateCategories = categoryNames.filter((cat, index) => categoryNames.indexOf(cat) !== index);
      const duplicateInsights = insightCategories.filter((cat, index) => insightCategories.indexOf(cat) !== index);

      if (duplicateCustomerIds.length > 0) {
        console.warn('Duplicate customer IDs found:', duplicateCustomerIds);
      }
      if (duplicateProductIds.length > 0) {
        console.warn('Duplicate product IDs found:', duplicateProductIds);
        // Log the duplicate products for debugging
        duplicateProductIds.forEach(dupId => {
          const dupProducts = products.filter(p => p.productId === dupId);
          console.warn(`Duplicate products for ID ${dupId}:`, dupProducts.map(p => ({
            productId: p.productId,
            productName: p.productName,
            category: p.category,
            subCategory: p.subCategory,
            totalSales: p.totalSales
          })));
        });
      }
      if (duplicateCategories.length > 0) {
        console.warn('Duplicate categories found:', duplicateCategories);
      }
      if (duplicateInsights.length > 0) {
        console.warn('Duplicate insight categories found:', duplicateInsights);
      }

      console.log('Report data loaded successfully:', {
        customers: customers.length,
        products: products.length,
        categories: categories.length,
        coverage: coverage.length,
      });

      // Deduplicate data to prevent React key warnings
      const uniqueCustomers = customers.filter((customer, index, self) => 
        index === self.findIndex(c => c.customerId === customer.customerId)
      );
      
      // For products, keep the one with highest sales if there are duplicates
      const uniqueProducts = products.reduce((acc, product) => {
        const existingProduct = acc.find(p => p.productId === product.productId);
        if (!existingProduct) {
          acc.push(product);
        } else if (product.totalSales > existingProduct.totalSales) {
          // Replace with the product that has higher sales
          const index = acc.findIndex(p => p.productId === product.productId);
          acc[index] = product;
        }
        return acc;
      }, [] as typeof products);
      
      const uniqueCategories = categories.filter((category, index, self) => 
        index === self.findIndex(c => c.category === category.category)
      );
      
      const uniqueCoverage = coverage.filter((insight, index, self) => 
        index === self.findIndex(i => i.category === insight.category)
      );

      console.log('After deduplication:', {
        customers: uniqueCustomers.length,
        products: uniqueProducts.length,
        categories: uniqueCategories.length,
        coverage: uniqueCoverage.length,
      });

      setTopCustomers(uniqueCustomers);
      setTopProducts(uniqueProducts);
      setCategorySales(uniqueCategories);
      setRangeCoverage(uniqueCoverage);
    } catch (error: any) {
      console.error('Error loading report data:', error);
      
      // Handle specific error types
      if (error.message?.includes('Authentication token not found')) {
        setError('Session expired. Please log in again.');
        Alert.alert(
          'Authentication Error', 
          'Your session has expired. Please log out and log back in.',
          [{ text: 'OK' }]
        );
      } else if (error.message?.includes('Session expired')) {
        setError('Session expired. Please log in again.');
        Alert.alert(
          'Session Expired', 
          'Your session has expired. Please log out and log back in.',
          [{ text: 'OK' }]
        );
      } else {
        setError('Failed to load report data. Please try again.');
        Alert.alert('Error', 'Failed to load report data. Please check your connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return `LKR ${value.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
  };

  // Helper function to generate unique keys
  const generateUniqueKey = (prefix: string, id: string, index: number) => {
    return `${prefix}-${id}-${index}`;
  };

  const renderKPICard = (title: string, value: string, subValue?: string, trend?: number) => (
    <View style={styles.kpiCard}>
      <Text style={styles.kpiTitle}>{title}</Text>
      <Text style={styles.kpiValue}>{value}</Text>
      {subValue && <Text style={styles.kpiSubValue}>{subValue}</Text>}
      {trend !== undefined && (
        <View style={[styles.trendContainer, { backgroundColor: trend >= 0 ? '#e6f4ea' : '#fce8e6' }]}>
          <Text style={[styles.trendText, { color: trend >= 0 ? '#137333' : '#c5221f' }]}>
            {trend >= 0 ? '+' : ''}{trend.toFixed(1)}%
          </Text>
        </View>
      )}
    </View>
  );

  const renderOverviewTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Top Performing Customers</Text>
        {topCustomers.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {topCustomers.map((customer, index) => (
              <View key={generateUniqueKey('customer', customer.customerId, index)} style={styles.customerCard}>
                <Text style={styles.customerName}>{customer.customerName}</Text>
                <Text style={styles.customerLocation}>{customer.city}, {customer.province}</Text>
                <Text style={styles.salesValue}>{formatCurrency(customer.totalSales)}</Text>
                <View style={styles.trendContainer}>
                  <Text style={[styles.trendText, { color: customer.growth >= 0 ? '#137333' : '#c5221f' }]}>
                    {customer.growth >= 0 ? '+' : ''}{customer.growth.toFixed(1)}%
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>
        ) : (
          <Text style={styles.noDataText}>No customer data available</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Top Products</Text>
        {topProducts.length > 0 ? (
          topProducts.map((product, index) => (
            <View key={generateUniqueKey('product', product.productId, index)} style={styles.productRow}>
              <View style={styles.productInfo}>
                <Text style={styles.productName}>{product.productName}</Text>
                <Text style={styles.productCategory}>{product.category} - {product.subCategory}</Text>
              </View>
              <View style={styles.productStats}>
                <Text style={styles.salesValue}>{formatCurrency(product.totalSales)}</Text>
                <Text style={styles.quantitySold}>Qty: {product.quantity}</Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.noDataText}>No product data available</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Category Performance</Text>
        {categorySales.length > 0 ? (
          categorySales.slice(0, 5).map((category, index) => (
            <View key={generateUniqueKey('category', category.category, index)} style={styles.categoryRow}>
              <Text style={styles.categoryName}>{category.category}</Text>
              <View style={styles.categoryStats}>
                <Text style={styles.salesValue}>{formatCurrency(category.totalSales)}</Text>
                <View style={styles.trendContainer}>
                  <Text style={[styles.trendText, { color: category.growth >= 0 ? '#137333' : '#c5221f' }]}>
                    {category.growth >= 0 ? '+' : ''}{category.growth.toFixed(1)}%
                  </Text>
                </View>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.noDataText}>No category data available</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Range Coverage Insights</Text>
        {rangeCoverage.length > 0 ? (
          rangeCoverage.slice(0, 3).map((insight, index) => (
            <View key={generateUniqueKey('insight', insight.category, index)} style={styles.insightCard}>
              <View style={styles.insightHeader}>
                <Text style={styles.insightCategory}>{insight.category}</Text>
                <Text style={styles.coverageValue}>{insight.coverage.toFixed(1)}% Coverage</Text>
              </View>
              <Text style={styles.insightRecommendation}>{insight.recommendation}</Text>
              <Text style={styles.insightDetails}>
                {insight.soldProducts} of {insight.totalProducts} products sold
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.noDataText}>No coverage insights available</Text>
        )}
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Reports</Text>
        <TouchableOpacity onPress={loadReportData} style={styles.refreshButton}>
          <Text style={styles.refreshButtonText}>↻</Text>
        </TouchableOpacity>
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066cc" />
          <Text style={styles.loadingText}>Loading reports...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={loadReportData} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        renderOverviewTab()
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E1E8ED',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  customerCard: {
    backgroundColor: 'white',
    padding: 16,
    marginRight: 16,
    borderRadius: 8,
    width: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  customerLocation: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  salesValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0066cc',
  },
  trendContainer: {
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  trendText: {
    fontSize: 14,
    fontWeight: '500',
  },
  productRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E1E8ED',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  productCategory: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  productStats: {
    alignItems: 'flex-end',
  },
  quantitySold: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E1E8ED',
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  categoryStats: {
    alignItems: 'flex-end',
  },
  insightCard: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  insightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  insightCategory: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  coverageValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0066cc',
  },
  insightRecommendation: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  insightDetails: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  kpiCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  kpiTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  kpiValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  kpiSubValue: {
    fontSize: 14,
    color: '#666',
  },
  refreshButton: {
    padding: 8,
    borderRadius: 4,
    backgroundColor: '#0066cc',
  },
  refreshButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  loadingText: {
    fontSize: 16,
    color: '#0066cc',
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#c5221f',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#0066cc',
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  noDataText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 16,
  },
});

export default ReportsScreen; 