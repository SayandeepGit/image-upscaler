const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');

class UpscaleService {
  constructor() {
    this.processedDir = path.join(__dirname, '../../processed');
  }

  async ensureProcessedDir() {
    try {
      await fs.mkdir(this.processedDir, { recursive: true });
    } catch (error) {
      console.error('Error creating processed directory:', error);
    }
  }

  /**
   * Get target dimensions based on preset
   */
  getTargetDimensions(originalWidth, originalHeight, preset, customWidth, customHeight) {
    switch (preset) {
      case '2x':
        return { width: originalWidth * 2, height: originalHeight * 2 };
      case '4x':
        return { width: originalWidth * 4, height: originalHeight * 4 };
      case 'HD':
        return { width: 1920, height: 1080 };
      case '4K':
        return { width: 3840, height: 2160 };
      case 'custom':
        return { width: customWidth, height: customHeight };
      default:
        return { width: originalWidth * 2, height: originalHeight * 2 };
    }
  }

  /**
   * Get Sharp kernel based on method
   */
  getKernel(method) {
    const kernelMap = {
      'nearest': sharp.kernel.nearest,
      'bilinear': sharp.kernel.linear,
      'bicubic': sharp.kernel.cubic,
      'lanczos': sharp.kernel.lanczos3
    };
    return kernelMap[method] || sharp.kernel.lanczos3;
  }

  /**
   * Upscale a single image
   */
  async upscaleImage(inputPath, options = {}) {
    await this.ensureProcessedDir();

    const {
      preset = '2x',
      method = 'lanczos',
      customWidth,
      customHeight,
      originalname = 'image'
    } = options;

    try {
      // Get image metadata
      const metadata = await sharp(inputPath).metadata();
      const { width: originalWidth, height: originalHeight, format } = metadata;
      
      // Get original file size
      const originalStats = await fs.stat(inputPath);

      // Calculate target dimensions
      const { width, height } = this.getTargetDimensions(
        originalWidth,
        originalHeight,
        preset,
        customWidth,
        customHeight
      );

      // Generate unique output filename
      const outputFilename = `upscaled-${uuidv4()}.${format}`;
      const outputPath = path.join(this.processedDir, outputFilename);

      // Get resize kernel
      const kernel = this.getKernel(method);

      // Process image
      await sharp(inputPath)
        .resize(width, height, {
          kernel: kernel,
          fit: 'fill'
        })
        .toFile(outputPath);

      // Get output metadata
      const outputMetadata = await sharp(outputPath).metadata();
      const outputStats = await fs.stat(outputPath);

      return {
        success: true,
        filename: outputFilename,
        path: outputPath,
        originalDimensions: {
          width: originalWidth,
          height: originalHeight
        },
        upscaledDimensions: {
          width: outputMetadata.width,
          height: outputMetadata.height
        },
        originalSize: originalStats.size,
        upscaledSize: outputStats.size,
        format: format
      };
    } catch (error) {
      console.error('Error upscaling image:', error);
      throw new Error(`Failed to upscale image: ${error.message}`);
    }
  }

  /**
   * Batch upscale multiple images
   */
  async batchUpscale(files, options = {}) {
    const results = [];
    const batchId = uuidv4();

    for (const file of files) {
      try {
        const result = await this.upscaleImage(file.path, {
          ...options,
          originalname: file.originalname
        });
        results.push({
          ...result,
          originalname: file.originalname,
          batchId
        });
      } catch (error) {
        results.push({
          success: false,
          originalname: file.originalname,
          error: error.message,
          batchId
        });
      }
    }

    return {
      batchId,
      results,
      totalProcessed: results.filter(r => r.success).length,
      totalFailed: results.filter(r => !r.success).length
    };
  }
}

module.exports = new UpscaleService();
