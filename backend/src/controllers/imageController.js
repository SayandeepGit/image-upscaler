const upscaleService = require('../services/upscaleService');
const aiUpscaleService = require('../services/aiUpscaleService');
const fileManager = require('../utils/fileManager');
const archiver = require('archiver');
const path = require('path');
const fs = require('fs');

class ImageController {
  /**
   * Handle single image upload
   */
  async uploadImage(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const fileInfo = {
        filename: req.file.filename,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path
      };

      res.json({
        success: true,
        message: 'File uploaded successfully',
        file: fileInfo
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Handle multiple image uploads
   */
  async uploadMultiple(req, res, next) {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
      }

      const filesInfo = req.files.map(file => ({
        filename: file.filename,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        path: file.path
      }));

      res.json({
        success: true,
        message: 'Files uploaded successfully',
        files: filesInfo
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Upscale a single image using Cloud AI
   */
  async upscaleImageWithAI(req, res, next) {
    try {
      const { filename, scale, userApiKey } = req.body;

      if (!filename) {
        return res.status(400).json({ error: 'Filename is required' });
      }

      const inputPath = fileManager.getFilePath(filename, false);

      // Check if file exists
      if (!fs.existsSync(inputPath)) {
        return res.status(404).json({ error: 'File not found' });
      }

      // Check if AI upscaling is available
      if (!aiUpscaleService.isAvailable(userApiKey)) {
        return res.status(400).json({ 
          error: 'Cloud AI upscaling requires an API key. Please provide your Replicate API key or configure it on the server.',
          helpUrl: 'https://replicate.com/account/api-tokens'
        });
      }

      // Use AI upscaling
      const result = await aiUpscaleService.upscaleWithAI(inputPath, {
        scale: scale || 2,
        userApiKey
      });

      res.json({
        success: true,
        message: 'Image upscaled with Cloud AI successfully',
        result
      });
    } catch (error) {
      // Send user-friendly error messages
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to upscale image with Cloud AI'
      });
    }
  }

  /**
   * Upscale a single image
   */
  async upscaleImage(req, res, next) {
    try {
      const { filename, preset, method, customWidth, customHeight, useAI } = req.body;

      if (!filename) {
        return res.status(400).json({ error: 'Filename is required' });
      }

      // Validate custom dimensions if preset is 'custom'
      if (preset === 'custom') {
        const width = parseInt(customWidth, 10);
        const height = parseInt(customHeight, 10);
        
        if (!customWidth || !customHeight || isNaN(width) || isNaN(height) || width <= 0 || height <= 0) {
          return res.status(400).json({ 
            error: 'Valid custom width and height are required for custom preset' 
          });
        }
      }

      const inputPath = fileManager.getFilePath(filename, false);

      // Check if file exists
      if (!fs.existsSync(inputPath)) {
        return res.status(404).json({ error: 'File not found' });
      }

      let result;

      if (useAI && aiUpscaleService.isAvailable()) {
        // Use AI upscaling
        result = await aiUpscaleService.upscaleWithAI(inputPath, {
          model: method,
          scale: preset === '2x' ? 2 : 4
        });
      } else {
        // Use traditional upscaling
        result = await upscaleService.upscaleImage(inputPath, {
          preset,
          method,
          customWidth: customWidth ? parseInt(customWidth, 10) : undefined,
          customHeight: customHeight ? parseInt(customHeight, 10) : undefined
        });
      }

      res.json({
        success: true,
        message: 'Image upscaled successfully',
        result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Batch upscale multiple images
   */
  async batchUpscale(req, res, next) {
    try {
      const { filenames, preset, method, customWidth, customHeight } = req.body;

      if (!filenames || !Array.isArray(filenames) || filenames.length === 0) {
        return res.status(400).json({ error: 'Filenames array is required' });
      }

      // Validate custom dimensions if preset is 'custom'
      if (preset === 'custom') {
        const width = parseInt(customWidth, 10);
        const height = parseInt(customHeight, 10);
        
        if (!customWidth || !customHeight || isNaN(width) || isNaN(height) || width <= 0 || height <= 0) {
          return res.status(400).json({ 
            error: 'Valid custom width and height are required for custom preset' 
          });
        }
      }

      // Prepare file objects
      const files = filenames.map(filename => {
        const filePath = fileManager.getFilePath(filename, false);
        return {
          path: filePath,
          originalname: filename
        };
      });

      // Filter out non-existent files
      const existingFiles = files.filter(file => fs.existsSync(file.path));

      if (existingFiles.length === 0) {
        return res.status(404).json({ error: 'No valid files found' });
      }

      const result = await upscaleService.batchUpscale(existingFiles, {
        preset,
        method,
        customWidth: customWidth ? parseInt(customWidth, 10) : undefined,
        customHeight: customHeight ? parseInt(customHeight, 10) : undefined
      });

      res.json({
        success: true,
        message: 'Batch upscaling completed',
        result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Download a processed image
   */
  async downloadImage(req, res, next) {
    try {
      const { filename } = req.params;

      if (!filename) {
        return res.status(400).json({ error: 'Filename is required' });
      }

      const filePath = fileManager.getFilePath(filename, true);

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'File not found' });
      }

      res.download(filePath);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Download batch of processed images as ZIP
   */
  async downloadBatch(req, res, next) {
    try {
      const { batchId } = req.params;
      const { filenames } = req.body;

      if (!filenames || !Array.isArray(filenames) || filenames.length === 0) {
        return res.status(400).json({ error: 'Filenames array is required' });
      }

      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename=batch-${batchId}.zip`);

      const archive = archiver('zip', {
        zlib: { level: 9 } // Maximum compression
      });

      archive.on('error', (err) => {
        throw err;
      });

      archive.pipe(res);

      // Add files to archive
      for (const filename of filenames) {
        const filePath = fileManager.getFilePath(filename, true);
        if (fs.existsSync(filePath)) {
          archive.file(filePath, { name: filename });
        }
      }

      await archive.finalize();
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get information about uploaded file
   */
  async getFileInfo(req, res, next) {
    try {
      const { filename } = req.params;

      if (!filename) {
        return res.status(400).json({ error: 'Filename is required' });
      }

      const filePath = fileManager.getFilePath(filename, false);

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'File not found' });
      }

      const stats = fs.statSync(filePath);

      res.json({
        success: true,
        file: {
          filename,
          size: stats.size,
          created: stats.birthtime
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ImageController();
