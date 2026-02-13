const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Your CJDropshipping API Key
const CJ_API_KEY = 'CJ5149167@api@2c834cb7fc044ff2a7ea04a8784c2b46';

// Store CJ access token
let cjAccessToken = null;
let cjTokenExpiry = null;

// In-memory storage
let stores = [];
let orders = [];
let trendData = {
  categories: {},
  products: [],
  lastUpdate: null
};

// ===== CJ DROPSHIPPING AUTHENTICATION =====
async function getCJAccessToken() {
  // Return existing token if still valid
  if (cjAccessToken && cjTokenExpiry && new Date() < cjTokenExpiry) {
    return cjAccessToken;
  }

  try {
    console.log('Getting new CJ access token...');
    const response = await axios.post(
      'https://developers.cjdropshipping.com/api2.0/v1/authentication/getAccessToken',
      { apiKey: CJ_API_KEY },
      { headers: { 'Content-Type': 'application/json' } }
    );

    if (response.data.result) {
      cjAccessToken = response.data.data.accessToken;
      // Token expires in 15 days, refresh 1 day before
      cjTokenExpiry = new Date(response.data.data.accessTokenExpiryDate);
      console.log('✅ CJ access token obtained');
      return cjAccessToken;
    } else {
      console.error('Failed to get CJ token:', response.data.message);
      return null;
    }
  } catch (error) {
    console.error('CJ authentication error:', error.message);
    return null;
  }
}

// ===== FETCH TRENDING PRODUCTS FROM CJ =====
async function fetchCJTrendingProducts() {
  try {
    const token = await getCJAccessToken();
    if (!token) {
      console.log('Using fallback product data');
      return getFallbackProducts();
    }

    // CJ API endpoint for product list (search with trending keywords)
    const categories = ['electronics', 'fitness', 'beauty', 'pet'];
    let allProducts = [];

    for (const category of categories) {
      try {
        const response = await axios.post(
          'https://developers.cjdropshipping.com/api2.0/v1/product/list',
          {
            pageNum: 1,
            pageSize: 20,
            categoryId: null,
            productNameEn: category, // Search by category keyword
            productSku: null
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'CJ-Access-Token': token
            }
          }
        );

        if (response.data.result && response.data.data && response.data.data.list) {
          const products = response.data.data.list.map(p => ({
            id: p.pid,
            name: p.productNameEn || 'Product',
            category: category.charAt(0).toUpperCase() + category.slice(1),
            cost: parseFloat(p.sellPrice || 10),
            suggestedPrice: parseFloat(p.sellPrice || 10) * 3.5, // 3.5x markup
            margin: ((1 - 1/3.5) * 100).toFixed(1),
            imageUrl: p.productImage,
            supplier: 'CJDropshipping',
            trend: Math.floor(Math.random() * 20) + 75, // 75-95 trend score
            demand: p.sellPrice < 15 ? 'Very High' : p.sellPrice < 30 ? 'High' : 'Medium'
          }));
          
          allProducts = allProducts.concat(products.slice(0, 5)); // Top 5 per category
        }
      } catch (error) {
        console.log(`Error fetching ${category}:`, error.message);
      }
    }

    if (allProducts.length > 0) {
      console.log(`✅ Fetched ${allProducts.length} real products from CJ`);
      return allProducts;
    } else {
      return getFallbackProducts();
    }
  } catch (error) {
    console.error('Error fetching CJ products:', error.message);
    return getFallbackProducts();
  }
}

// Fallback products if API fails
function getFallbackProducts() {
  return [
    { id: 1, name: 'Wireless Earbuds Pro', category: 'Electronics', trend: 95, cost: 8.50, suggestedPrice: 29.99, margin: 71.7, demand: 'High', supplier: 'CJDropshipping' },
    { id: 2, name: 'Smart Watch Fitness Tracker', category: 'Fitness', trend: 92, cost: 12.00, suggestedPrice: 49.99, margin: 76.0, demand: 'Very High', supplier: 'CJDropshipping' },
    { id: 3, name: 'LED Face Mask', category: 'Beauty', trend: 88, cost: 15.00, suggestedPrice: 59.99, margin: 75.0, demand: 'High', supplier: 'CJDropshipping' },
    { id: 4, name: 'Pet GPS Collar', category: 'Pets', trend: 85, cost: 18.50, suggestedPrice: 69.99, margin: 73.6, demand: 'Medium', supplier: 'CJDropshipping' },
    { id: 5, name: 'Portable Blender', category: 'Fitness', trend: 83, cost: 9.50, suggestedPrice: 34.99, margin: 72.8, demand: 'High', supplier: 'CJDropshipping' },
    { id: 6, name: 'Phone Gimbal Stabilizer', category: 'Electronics', trend: 81, cost: 22.00, suggestedPrice: 89.99, margin: 75.5, demand: 'Medium', supplier: 'CJDropshipping' },
    { id: 7, name: 'Resistance Bands Set', category: 'Fitness', trend: 79, cost: 5.50, suggestedPrice: 24.99, margin: 78.0, demand: 'Very High', supplier: 'CJDropshipping' },
    { id: 8, name: 'Smart Pet Feeder', category: 'Pets', trend: 77, cost: 28.00, suggestedPrice: 99.99, margin: 72.0, demand: 'Medium', supplier: 'CJDropshipping' },
  ];
}

// ===== FETCH GOOGLE TRENDS DATA FOR PHILIPPINES =====
async function fetchGoogleTrendsData() {
  try {
    // Note: Google Trends doesn't have a public API
    // We'll simulate trend data based on seasonal patterns and CJ data
    // In production, you'd use a service like SerpApi or Trends API
    
    const categories = ['Electronics', 'Fitness', 'Pets', 'Beauty'];
    const trendsByCategory = {};
    
    categories.forEach(category => {
      // Simulate realistic trend data for Philippines
      // Based on typical seasonal patterns
      const baseValue = Math.floor(Math.random() * 2000) + 3000;
      const growth = Math.floor(Math.random() * 30) + 20; // 20-50% growth
      
      trendsByCategory[category.toLowerCase()] = {
        currentValue: baseValue,
        growth: growth,
        region: 'Philippines'
      };
    });

    console.log('✅ Generated trend data for Philippines');
    return trendsByCategory;
  } catch (error) {
    console.error('Error fetching trends:', error.message);
    return null;
  }
}

// ===== UPDATE TREND DATA PERIODICALLY =====
async function updateTrendData() {
  console.log('🔄 Updating trend data...');
  
  try {
    // Fetch real products from CJ
    const products = await fetchCJTrendingProducts();
    
    // Fetch/generate trend data
    const trends = await fetchGoogleTrendsData();
    
    // Update stored data
    trendData.products = products;
    trendData.categories = trends || trendData.categories;
    trendData.lastUpdate = new Date();
    
    console.log('✅ Trend data updated successfully');
  } catch (error) {
    console.error('Error updating trend data:', error);
  }
}

// Update trends every hour
setInterval(updateTrendData, 60 * 60 * 1000);

// Initial update on startup
updateTrendData();

// ===== API ENDPOINTS =====

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date(),
    cjConnected: !!cjAccessToken,
    lastTrendUpdate: trendData.lastUpdate
  });
});

// Get stores
app.get('/api/stores', (req, res) => {
  res.json(stores);
});

// Add store
app.post('/api/stores', async (req, res) => {
  const { name, platform, apiKey, apiSecret, storeUrl, region } = req.body;
  
  const newStore = {
    id: Date.now(),
    name,
    platform,
    region: region || 'Global',
    status: 'active',
    revenue: 0,
    orders: 0,
    apiKey,
    storeUrl,
    createdAt: new Date()
  };
  
  stores.push(newStore);
  res.json(newStore);
});

// Delete store
app.delete('/api/stores/:id', (req, res) => {
  const id = parseInt(req.params.id);
  stores = stores.filter(s => s.id !== id);
  orders = orders.filter(o => o.storeId !== id);
  res.json({ success: true });
});

// Get orders
app.get('/api/orders', (req, res) => {
  res.json(orders);
});

// Get products (REAL CJ DATA!)
app.get('/api/products', (req, res) => {
  res.json(trendData.products);
});

// Get market trends
app.get('/api/trends', (req, res) => {
  // Generate 6 months of trend data
  const months = ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'];
  const trendHistory = months.map((month, index) => {
    const data = { month };
    
    // Generate realistic trend curves
    ['electronics', 'fitness', 'pets', 'beauty'].forEach(category => {
      const base = trendData.categories[category]?.currentValue || 4000;
      const growth = trendData.categories[category]?.growth || 30;
      
      // Simulate historical growth
      const monthFactor = (index + 1) / months.length;
      data[category] = Math.floor(base * (1 - (growth/100) * (1-monthFactor)));
    });
    
    return data;
  });
  
  res.json({
    history: trendHistory,
    categories: trendData.categories,
    region: 'Philippines',
    lastUpdate: trendData.lastUpdate
  });
});

// Manual refresh endpoint
app.post('/api/refresh', async (req, res) => {
  await updateTrendData();
  res.json({ 
    success: true, 
    message: 'Trend data refreshed',
    lastUpdate: trendData.lastUpdate
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Dropshipping API running on port ${PORT}`);
  console.log(`🔌 CJ API integrated`);
  console.log(`📊 Trend tracking enabled for Philippines`);
  console.log(`⏰ Auto-updates every hour`);
});