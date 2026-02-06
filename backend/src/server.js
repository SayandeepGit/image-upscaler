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
  console.log('  POST /api/upload');
  console.log('  POST /api/upload-multiple');
  console.log('  POST /api/upscale');
  console.log('  POST /api/upscale/ai');
  console.log('  POST /api/batch-upscale');
  console.log('  GET  /api/download/:filename');
  console.log('  POST /api/download-batch/:batchId');
  console.log('  GET  /api/file-info/:filename');
  console.log('  GET  /api/health');
  console.log('  GET  /health (legacy)');
});
