import React, { useState } from 'react';
import { useImageContext } from '../../contexts/ImageContext';
import imageService from '../../services/api';
import './BatchManager.css';

const BatchManager = () => {
  const {
    uploadedImages,
    removeUploadedImage,
    clearUploadedImages,
    upscalingSettings,
    updateProcessingStatus,
    addProcessedImage,
    setBatchId,
    processingStatus,
  } = useImageContext();

  const [isProcessing, setIsProcessing] = useState(false);

  const handleRemoveImage = (filename) => {
    removeUploadedImage(filename);
  };

  const handleProcessSingle = async (image) => {
    try {
      updateProcessingStatus(image.filename, 'processing');
      
      const result = await imageService.upscaleImage(image.filename, upscalingSettings);
      
      updateProcessingStatus(image.filename, 'completed');
      addProcessedImage({
        ...result.result,
        originalname: image.originalname,
        originalFilename: image.filename,
      });
    } catch (error) {
      console.error('Error processing image:', error);
      updateProcessingStatus(image.filename, 'error');
      alert('Error processing image: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleProcessAll = async () => {
    if (uploadedImages.length === 0) {
      alert('No images to process');
      return;
    }

    setIsProcessing(true);

    try {
      const filenames = uploadedImages.map(img => img.filename);
      
      // Update all to processing
      filenames.forEach(filename => {
        updateProcessingStatus(filename, 'processing');
      });

      const result = await imageService.batchUpscale(filenames, upscalingSettings);
      
      if (result.success) {
        setBatchId(result.result.batchId);
        
        result.result.results.forEach((res) => {
          if (res.success) {
            updateProcessingStatus(res.originalname, 'completed');
            addProcessedImage(res);
          } else {
            updateProcessingStatus(res.originalname, 'error');
          }
        });

        alert(`Processed ${result.result.totalProcessed} images successfully!`);
      }
    } catch (error) {
      console.error('Error batch processing:', error);
      alert('Error processing images: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsProcessing(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="batch-manager">
      <div className="batch-header">
        <h3>Uploaded Images ({uploadedImages.length})</h3>
        <div className="batch-actions">
          <button
            className="btn btn-primary"
            onClick={handleProcessAll}
            disabled={uploadedImages.length === 0 || isProcessing}
          >
            {isProcessing ? 'Processing...' : 'Process All'}
          </button>
          <button
            className="btn btn-secondary"
            onClick={clearUploadedImages}
            disabled={uploadedImages.length === 0 || isProcessing}
          >
            Clear All
          </button>
        </div>
      </div>

      {uploadedImages.length === 0 ? (
        <div className="empty-state">
          <p>No images uploaded yet. Upload images above to get started.</p>
        </div>
      ) : (
        <div className="image-grid">
          {uploadedImages.map((image) => (
            <div key={image.filename} className="image-card">
              <div className="image-preview">
                <img
                  src={image.preview || imageService.getImageUrl(image.filename)}
                  alt={image.originalname}
                />
              </div>
              <div className="image-info">
                <p className="image-name" title={image.originalname}>
                  {image.originalname}
                </p>
                <p className="image-size">{formatFileSize(image.size)}</p>
                {image.filename && (
                  <div className="processing-status">
                    <span className="status-indicator">Status:</span>
                    <span className={`status-badge status-${processingStatus[image.filename] || 'pending'}`}>
                      {processingStatus[image.filename] || 'Pending'}
                    </span>
                  </div>
                )}
              </div>
              <div className="image-actions">
                <button
                  className="btn-icon"
                  onClick={() => handleProcessSingle(image)}
                  disabled={isProcessing}
                  title="Process this image"
                >
                  ▶️
                </button>
                <button
                  className="btn-icon"
                  onClick={() => handleRemoveImage(image.filename)}
                  disabled={isProcessing}
                  title="Remove this image"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BatchManager;
