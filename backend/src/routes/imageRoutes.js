const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const imageController = require('../controllers/imageController');

// Upload routes
router.post('/upload', upload.single('image'), imageController.uploadImage);
router.post('/upload-multiple', upload.array('images', 10), imageController.uploadMultiple);

// Upscaling routes
router.post('/upscale', imageController.upscaleImage);
router.post('/batch-upscale', imageController.batchUpscale);

// Download routes
router.get('/download/:filename', imageController.downloadImage);
router.post('/download-batch/:batchId', imageController.downloadBatch);

// Info routes
router.get('/file-info/:filename', imageController.getFileInfo);

module.exports = router;
