/**
 * AI Upscaling Service
 * 
 * Cloud-based AI upscaling using Replicate API with Real-ESRGAN model
 * Supports user-provided API keys and fallback to server-configured key
 */

const Replicate = require('replicate');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');

class AIUpscaleService {
  constructor() {
    this.processedDir = path.join(__dirname, '../../processed');
    this.serverApiToken = process.env.REPLICATE_API_TOKEN;
  }

  /**
   * Check if AI upscaling is available
   * @param {string} userApiKey - Optional user-provided API key
   */
  isAvailable(userApiKey = null) {
    return !!(userApiKey || this.serverApiToken);
  }

  /**
   * Ensure processed directory exists
   */
  async ensureProcessedDir() {
    try {
      await fs.mkdir(this.processedDir, { recursive: true });
    } catch (error) {
      console.error('Error creating processed directory:', error);
    }
  }

  /**
   * Upscale image using Replicate's Real-ESRGAN model
   * @param {string} inputPath - Path to input image
   * @param {object} options - Upscaling options
   * @returns {Promise<object>} - Upscaled image information
   */
  async upscaleWithAI(inputPath, options = {}) {
    await this.ensureProcessedDir();

    const { 
      scale = 2,
      userApiKey = null 
    } = options;

    // Determine which API key to use
    const apiKey = userApiKey || this.serverApiToken;

    if (!apiKey) {
      throw new Error('Replicate API key is required. Please provide an API key or configure REPLICATE_API_TOKEN on the server.');
    }

    try {
      // Get original image metadata
      const metadata = await sharp(inputPath).metadata();
      const { width: originalWidth, height: originalHeight, format } = metadata;
      const originalStats = await fs.stat(inputPath);

      // Initialize Replicate client
      const replicate = new Replicate({
        auth: apiKey,
      });

      // Read image file and convert to base64
      const imageBuffer = await fs.readFile(inputPath);
      const base64Image = `data:image/${format};base64,${imageBuffer.toString('base64')}`;

      console.log('Starting Real-ESRGAN upscaling via Replicate...');

      // Run Real-ESRGAN model
      const output = await replicate.run(
        "nightmareai/real-esrgan:42fed1c4974146d4d2414e2be2c5277c7fcf05fcc3a73abf41610695738c1d7b",
        {
          input: {
            image: base64Image,
            scale: scale,
            face_enhance: false
          }
        }
      );

      // Download the upscaled image
      const upscaledImageUrl = output;
      const response = await axios.get(upscaledImageUrl, {
        responseType: 'arraybuffer',
        timeout: 60000 // 60 second timeout
      });

      // Generate unique output filename
      const outputFilename = `upscaled-ai-${uuidv4()}.png`;
      const outputPath = path.join(this.processedDir, outputFilename);

      // Save the upscaled image
      await fs.writeFile(outputPath, response.data);

      // Get output metadata
      const outputMetadata = await sharp(outputPath).metadata();
      const outputStats = await fs.stat(outputPath);

      console.log('Real-ESRGAN upscaling completed successfully');

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
        format: 'png',
        method: 'Real-ESRGAN (Cloud AI)'
      };
    } catch (error) {
      console.error('Error in AI upscaling:', error);
      
      // Provide helpful error messages
      if (error.message?.includes('authentication') || error.message?.includes('Unauthorized')) {
        throw new Error('Invalid Replicate API key. Please check your API key at https://replicate.com/account/api-tokens');
      } else if (error.message?.includes('quota') || error.message?.includes('rate limit')) {
        throw new Error('API quota exceeded. Consider using Browser AI or traditional methods, or upgrade your Replicate plan.');
      } else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        throw new Error('AI upscaling timed out. The image may be too large. Try using traditional methods or Browser AI.');
      }
      
      throw new Error(`AI upscaling failed: ${error.message}`);
    }
  }
}

module.exports = new AIUpscaleService();
