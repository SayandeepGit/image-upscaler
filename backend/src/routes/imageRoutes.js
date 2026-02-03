const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const imageController = require('../controllers/imageController');
const { uploadLimiter, processLimiter, downloadLimiter } = require('../middleware/rateLimiter');

// Upload routes
router.post('/upload', uploadLimiter, upload.single('image'), imageController.uploadImage);
router.post('/upload-multiple', uploadLimiter, upload.array('images', 10), imageController.uploadMultiple);

// Upscaling routes
router.post('/upscale', processLimiter, imageController.upscaleImage);
router.post('/batch-upscale', processLimiter, imageController.batchUpscale);

// Download routes
router.get('/download/:filename', downloadLimiter, imageController.downloadImage);
router.post('/download-batch/:batchId', downloadLimiter, imageController.downloadBatch);

// Info routes
router.get('/file-info/:filename', imageController.getFileInfo);

module.exports = router;
