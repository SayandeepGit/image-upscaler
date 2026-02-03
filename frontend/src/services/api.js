import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

class ImageService {
  /**
   * Upload a single image
   */
  async uploadImage(file) {
    const formData = new FormData();
    formData.append('image', file);

    const response = await api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  }

  /**
   * Upload multiple images
   */
  async uploadMultipleImages(files) {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('images', file);
    });

    const response = await api.post('/upload-multiple', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  }

  /**
   * Upscale a single image
   */
  async upscaleImage(filename, options) {
    const response = await api.post('/upscale', {
      filename,
      ...options,
    });

    return response.data;
  }

  /**
   * Batch upscale multiple images
   */
  async batchUpscale(filenames, options) {
    const response = await api.post('/batch-upscale', {
      filenames,
      ...options,
    });

    return response.data;
  }

  /**
   * Download a processed image
   */
  async downloadImage(filename) {
    const response = await api.get(`/download/${filename}`, {
      responseType: 'blob',
    });

    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }

  /**
   * Download batch of images as ZIP
   */
  async downloadBatch(batchId, filenames) {
    const response = await api.post(`/download-batch/${batchId}`, 
      { filenames },
      { responseType: 'blob' }
    );

    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `batch-${batchId}.zip`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }

  /**
   * Get file info
   */
  async getFileInfo(filename) {
    const response = await api.get(`/file-info/${filename}`);
    return response.data;
  }

  /**
   * Get image URL for preview
   */
  getImageUrl(filename, isProcessed = false) {
    const baseUrl = API_URL.replace('/api', '');
    const dir = isProcessed ? 'processed' : 'uploads';
    return `${baseUrl}/${dir}/${filename}`;
  }
}

export default new ImageService();
