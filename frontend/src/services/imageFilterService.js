/**
 * Canvas-based Image Filter Pipeline
 * Applies various filters to images before or after upscaling
 */

class ImageFilterPipeline {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
  }

  async loadImageToCanvas(input) {
    const img = new Image();
    
    return new Promise((resolve, reject) => {
      img.onload = () => {
        this.canvas.width = img.width;
        this.canvas.height = img.height;
        this.ctx.drawImage(img, 0, 0);
        resolve({ width: img.width, height: img.height });
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      
      if (input instanceof Blob || input instanceof File) {
        const reader = new FileReader();
        reader.onload = (e) => { img.src = e.target.result; };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(input);
      } else if (typeof input === 'string') {
        img.src = input;
      } else {
        reject(new Error('Unsupported input type'));
      }
    });
  }

  adjustBrightness(amount) {
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const pixels = imageData.data;
    
    for (let i = 0; i < pixels.length; i += 4) {
      pixels[i] = Math.min(255, Math.max(0, pixels[i] + amount));
      pixels[i + 1] = Math.min(255, Math.max(0, pixels[i + 1] + amount));
      pixels[i + 2] = Math.min(255, Math.max(0, pixels[i + 2] + amount));
    }
    
    this.ctx.putImageData(imageData, 0, 0);
    return this;
  }

  adjustContrast(factor) {
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const pixels = imageData.data;
    const intercept = 128 * (1 - factor);
    
    for (let i = 0; i < pixels.length; i += 4) {
      pixels[i] = Math.min(255, Math.max(0, pixels[i] * factor + intercept));
      pixels[i + 1] = Math.min(255, Math.max(0, pixels[i + 1] * factor + intercept));
      pixels[i + 2] = Math.min(255, Math.max(0, pixels[i + 2] * factor + intercept));
    }
    
    this.ctx.putImageData(imageData, 0, 0);
    return this;
  }

  adjustSaturation(multiplier) {
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const pixels = imageData.data;
    
    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      
      pixels[i] = Math.min(255, Math.max(0, gray + (r - gray) * multiplier));
      pixels[i + 1] = Math.min(255, Math.max(0, gray + (g - gray) * multiplier));
      pixels[i + 2] = Math.min(255, Math.max(0, gray + (b - gray) * multiplier));
    }
    
    this.ctx.putImageData(imageData, 0, 0);
    return this;
  }

  applyGrayscale() {
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const pixels = imageData.data;
    
    for (let i = 0; i < pixels.length; i += 4) {
      const luminance = (pixels[i] * 0.299) + (pixels[i + 1] * 0.587) + (pixels[i + 2] * 0.114);
      pixels[i] = pixels[i + 1] = pixels[i + 2] = luminance;
    }
    
    this.ctx.putImageData(imageData, 0, 0);
    return this;
  }

  applySepia() {
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const pixels = imageData.data;
    
    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      
      pixels[i] = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189));
      pixels[i + 1] = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168));
      pixels[i + 2] = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131));
    }
    
    this.ctx.putImageData(imageData, 0, 0);
    return this;
  }

  applyBlur(radius = 3) {
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const pixels = imageData.data;
    const width = this.canvas.width;
    const height = this.canvas.height;
    const output = new Uint8ClampedArray(pixels);
    
    const kernelSize = radius * 2 + 1;
    const divisor = kernelSize * kernelSize;
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let r = 0, g = 0, b = 0, a = 0;
        
        for (let ky = -radius; ky <= radius; ky++) {
          for (let kx = -radius; kx <= radius; kx++) {
            const px = Math.min(width - 1, Math.max(0, x + kx));
            const py = Math.min(height - 1, Math.max(0, y + ky));
            const offset = (py * width + px) * 4;
            
            r += pixels[offset];
            g += pixels[offset + 1];
            b += pixels[offset + 2];
            a += pixels[offset + 3];
          }
        }
        
        const idx = (y * width + x) * 4;
        output[idx] = r / divisor;
        output[idx + 1] = g / divisor;
        output[idx + 2] = b / divisor;
        output[idx + 3] = a / divisor;
      }
    }
    
    for (let i = 0; i < pixels.length; i++) {
      pixels[i] = output[i];
    }
    
    this.ctx.putImageData(imageData, 0, 0);
    return this;
  }

  async exportAsBlob(mimeType = 'image/png', quality = 0.95) {
    return new Promise((resolve) => {
      this.canvas.toBlob(resolve, mimeType, quality);
    });
  }

  async exportAsFile(filename, mimeType = 'image/png', quality = 0.95) {
    const blob = await this.exportAsBlob(mimeType, quality);
    return new File([blob], filename, { type: mimeType });
  }

  getDataURL(mimeType = 'image/png', quality = 0.95) {
    return this.canvas.toDataURL(mimeType, quality);
  }
}

async function applyFilters(input, filterChain) {
  const pipeline = new ImageFilterPipeline();
  await pipeline.loadImageToCanvas(input);
  
  for (const filter of filterChain) {
    switch (filter.type) {
      case 'brightness':
        pipeline.adjustBrightness(filter.value);
        break;
      case 'contrast':
        pipeline.adjustContrast(filter.value);
        break;
      case 'saturation':
        pipeline.adjustSaturation(filter.value);
        break;
      case 'grayscale':
        pipeline.applyGrayscale();
        break;
      case 'sepia':
        pipeline.applySepia();
        break;
      case 'blur':
        pipeline.applyBlur(filter.radius || 3);
        break;
      default:
        console.warn(`Unknown filter type: ${filter.type}`);
    }
  }
  
  return pipeline;
}

const imageFilterService = {
  createPipeline: () => new ImageFilterPipeline(),
  applyFilters,
  
  quickFilters: {
    brighten: (input, amount = 30) => applyFilters(input, [{ type: 'brightness', value: amount }]),
    darken: (input, amount = 30) => applyFilters(input, [{ type: 'brightness', value: -amount }]),
    highContrast: (input) => applyFilters(input, [{ type: 'contrast', value: 1.5 }]),
    lowContrast: (input) => applyFilters(input, [{ type: 'contrast', value: 0.7 }]),
    vibrant: (input) => applyFilters(input, [{ type: 'saturation', value: 1.5 }]),
    muted: (input) => applyFilters(input, [{ type: 'saturation', value: 0.5 }]),
    grayscale: (input) => applyFilters(input, [{ type: 'grayscale' }]),
    sepia: (input) => applyFilters(input, [{ type: 'sepia' }]),
    softBlur: (input) => applyFilters(input, [{ type: 'blur', radius: 2 }]),
    strongBlur: (input) => applyFilters(input, [{ type: 'blur', radius: 5 }])
  }
};

export default imageFilterService;
