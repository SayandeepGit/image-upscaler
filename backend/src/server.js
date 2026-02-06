require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const imageRoutes = require('./routes/imageRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// CORS Configuration
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://image-upscaler-eta.vercel.app'
  ],
  credentials: true
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Serve static files for processed images
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/processed', express.static(path.join(__dirname, '../processed')));

// Routes - Must come before error handlers
app.use('/api', imageRoutes);

// Health check - Under /api prefix
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Legacy health check for backward compatibility
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Image Upscaler API is running' });
});

// 404 handler - MUST BE AFTER all routes
app.use((req, res) => {
  console.log('404 - Route not found:', req.method, req.path);
  res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware - MUST BE LAST
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log('Registered routes:');
  
  // Dynamically log all registered routes
  const routes = [];
  
  app._router.stack.forEach((middleware) => {
    if (middleware.route) {
      // Routes registered directly on the app
      const methods = Object.keys(middleware.route.methods).map(m => m.toUpperCase()).join(', ');
      routes.push({ methods, path: middleware.route.path });
    } else if (middleware.name === 'router') {
      // Routes registered through routers
      middleware.handle.stack.forEach((handler) => {
        if (handler.route) {
          const methods = Object.keys(handler.route.methods).map(m => m.toUpperCase()).join(', ');
          // Extract base path from router regex - handle common patterns
          let basePath = '/api'; // Default fallback
          try {
            const regexSource = middleware.regexp.source;
            // Match patterns like ^\/api\\/?(?=\/|$)
            const pathMatch = regexSource.match(/\^\\?\/?([^\\?]+)/);
            if (pathMatch && pathMatch[1]) {
              basePath = '/' + pathMatch[1].replace(/\\\//g, '/').replace(/\\/g, '');
            }
          } catch (e) {
            // Fallback to /api if parsing fails
          }
          const fullPath = basePath + handler.route.path;
          routes.push({ methods, path: fullPath });
        }
      });
    }
  });
  
  // Calculate max method length for proper alignment
  const maxMethodLength = Math.max(...routes.map(r => r.methods.length), 6);
  const padding = Math.max(maxMethodLength + 2, 10);
  
  routes.forEach(route => {
    console.log(`  ${route.methods.padEnd(padding)} ${route.path}`);
  });
});
