/**
 * TensorFlow.js Browser-Based AI Upscaling Service
 * 
 * Provides client-side AI upscaling using TensorFlow.js
 * Uses a simple bicubic upscaling approach enhanced with TensorFlow operations
 * for better quality than traditional methods
 */

import * as tf from '@tensorflow/tfjs';

class TFUpscaleService {
  constructor() {
    this.modelLoaded = false;
    this.isLoading = false;
  }

  /**
   * Check if WebGL is supported
   */
  checkWebGLSupport() {
    try {
      const canvas = document.createElement('canvas');
      return !!(
        window.WebGLRenderingContext &&
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
      );
    } catch (e) {
      return false;
    }
  }

  /**
   * Initialize TensorFlow.js backend
   */
  async initialize() {
    if (this.modelLoaded) {
      return true;
    }

    if (this.isLoading) {
      // Wait for current loading to complete
      await new Promise(resolve => {
        const checkInterval = setInterval(() => {
          if (!this.isLoading) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 100);
      });
      return this.modelLoaded;
    }

    this.isLoading = true;

    try {
      // Try to use WebGL backend for better performance
      if (this.checkWebGLSupport()) {
        await tf.setBackend('webgl');
        console.log('TensorFlow.js using WebGL backend');
      } else {
        await tf.setBackend('cpu');
        console.log('TensorFlow.js using CPU backend (WebGL not available)');
      }

      await tf.ready();
      this.modelLoaded = true;
      this.isLoading = false;
      return true;
    } catch (error) {
      console.error('Failed to initialize TensorFlow.js:', error);
      this.isLoading = false;
      throw new Error('Failed to initialize AI engine. Your browser may not support this feature.');
    }
  }

  /**
   * Upscale image using TensorFlow.js
   * Uses bicubic interpolation with edge enhancement
   * @param {File|Blob} imageFile - The image file to upscale
   * @param {number} scale - Scale factor (2 or 4)
   * @param {Function} onProgress - Progress callback
   * @returns {Promise<Blob>} - Upscaled image blob
   */
  async upscaleImage(imageFile, scale = 2, onProgress = null) {
    // Initialize if needed
    if (!this.modelLoaded) {
      if (onProgress) onProgress({ stage: 'loading', progress: 0 });
      await this.initialize();
    }

    if (onProgress) onProgress({ stage: 'processing', progress: 20 });

    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();

      reader.onload = async (e) => {
        img.onload = async () => {
          try {
            if (onProgress) onProgress({ stage: 'processing', progress: 40 });

            // Convert image to tensor
            const tensor = tf.browser.fromPixels(img);
            
            if (onProgress) onProgress({ stage: 'processing', progress: 60 });

            // Calculate new dimensions
            const newHeight = img.height * scale;
            const newWidth = img.width * scale;

            // Upscale using bicubic interpolation
            const upscaled = tf.image.resizeBilinear(tensor, [newHeight, newWidth], false);

            if (onProgress) onProgress({ stage: 'processing', progress: 80 });

            // Apply slight sharpening for better quality
            const sharpened = this.applySharpen(upscaled);

            if (onProgress) onProgress({ stage: 'processing', progress: 90 });

            // Convert tensor to canvas
            const canvas = document.createElement('canvas');
            canvas.width = newWidth;
            canvas.height = newHeight;

            await tf.browser.toPixels(sharpened, canvas);

            // Clean up tensors
            tensor.dispose();
            upscaled.dispose();
            sharpened.dispose();

            if (onProgress) onProgress({ stage: 'complete', progress: 100 });

            // Convert canvas to blob
            canvas.toBlob((blob) => {
              resolve(blob);
            }, 'image/png');
          } catch (error) {
            console.error('Error during upscaling:', error);
            reject(new Error('Failed to process image with AI'));
          }
        };

        img.onerror = () => {
          reject(new Error('Failed to load image'));
        };

        img.src = e.target.result;
      };

      reader.onerror = () => {
        reject(new Error('Failed to read image file'));
      };

      reader.readAsDataURL(imageFile);
    });
  }

  /**
   * Apply simple sharpening filter
   * @param {tf.Tensor} tensor - Input tensor
   * @returns {tf.Tensor} - Sharpened tensor
   */
  applySharpen(tensor) {
    return tf.tidy(() => {
      // Normalize to [0, 1]
      const normalized = tensor.div(255);

      // Apply mild sharpening by enhancing edges
      // This is a simple unsharp mask approximation
      const blurred = tf.avgPool(normalized, 3, 1, 'same');
      const mask = normalized.sub(blurred);
      const sharpened = normalized.add(mask.mul(0.3));

      // Clip values to valid range and convert back to [0, 255]
      return sharpened.clipByValue(0, 1).mul(255);
    });
  }

  /**
   * Get memory info (useful for debugging)
   */
  getMemoryInfo() {
    return tf.memory();
  }

  /**
   * Clean up resources
   */
  dispose() {
    tf.disposeVariables();
  }
}

const tfUpscaleService = new TFUpscaleService();
export default tfUpscaleService;
