import React from 'react';
import { useImageContext } from '../../contexts/ImageContext';
import imageService from '../../services/api';
import './DownloadManager.css';

const DownloadManager = () => {
  const { processedImages, batchId } = useImageContext();

  const handleDownloadSingle = async (filename) => {
    try {
      await imageService.downloadImage(filename);
    } catch (error) {
      console.error('Error downloading image:', error);
      alert('Error downloading image: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDownloadAll = async () => {
    if (processedImages.length === 0) {
      alert('No processed images to download');
      return;
    }

    try {
      const filenames = processedImages.map(img => img.filename);
      await imageService.downloadBatch(batchId || 'batch', filenames);
    } catch (error) {
      console.error('Error downloading batch:', error);
      alert('Error downloading batch: ' + (error.response?.data?.message || error.message));
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (processedImages.length === 0) {
    return null;
  }

  return (
    <div className="download-manager">
      <div className="download-header">
        <h3>Processed Images ({processedImages.length})</h3>
        <button
          className="btn btn-download-all"
          onClick={handleDownloadAll}
        >
          📦 Download All as ZIP
        </button>
      </div>

      <div className="download-list">
        {processedImages.map((image, index) => (
          <div key={image.filename} className="download-item">
            <div className="download-item-info">
              <span className="download-number">{index + 1}.</span>
              <div className="download-details">
                <p className="download-name" title={image.originalname}>
                  {image.originalname}
                </p>
                <p className="download-stats">
                  {image.upscaledDimensions?.width} x{' '}
                  {image.upscaledDimensions?.height} •{' '}
                  {formatFileSize(image.upscaledSize)}
                </p>
              </div>
            </div>
            <button
              className="btn-download"
              onClick={() => handleDownloadSingle(image.filename)}
              title="Download this image"
            >
              ⬇️ Download
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DownloadManager;
