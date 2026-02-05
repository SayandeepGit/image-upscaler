import React, { useState } from 'react';
import { useImageContext } from '../../contexts/ImageContext';
import imageService from '../../services/api';
import './PreviewComparison.css';

const PreviewComparison = () => {
  const { processedImages } = useImageContext();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [viewMode, setViewMode] = useState('side-by-side'); // 'side-by-side' or 'toggle'
  const [showOriginal, setShowOriginal] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);

  if (processedImages.length === 0) {
    return (
      <div className="preview-comparison">
        <div className="empty-state">
          <p>No processed images yet. Process images to see comparison.</p>
        </div>
      </div>
    );
  }

  const currentImage = processedImages[selectedIndex];

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleZoomReset = () => {
    setZoomLevel(1);
  };

  return (
    <div className="preview-comparison">
      <div className="comparison-header">
        <h3>Preview Comparison</h3>
        <div className="comparison-controls">
          <div className="view-mode-selector">
            <button
              className={viewMode === 'side-by-side' ? 'active' : ''}
              onClick={() => setViewMode('side-by-side')}
            >
              Side by Side
            </button>
            <button
              className={viewMode === 'toggle' ? 'active' : ''}
              onClick={() => setViewMode('toggle')}
            >
              Toggle
            </button>
          </div>
          <div className="zoom-controls">
            <button onClick={handleZoomOut} disabled={zoomLevel <= 0.5}>
              -
            </button>
            <span>{Math.round(zoomLevel * 100)}%</span>
            <button onClick={handleZoomIn} disabled={zoomLevel >= 3}>
              +
            </button>
            <button onClick={handleZoomReset}>Reset</button>
          </div>
        </div>
      </div>

      {processedImages.length > 1 && (
        <div className="image-selector">
          <button
            onClick={() => setSelectedIndex(prev => Math.max(0, prev - 1))}
            disabled={selectedIndex === 0}
          >
            ← Previous
          </button>
          <span>
            {selectedIndex + 1} / {processedImages.length}
          </span>
          <button
            onClick={() => setSelectedIndex(prev => Math.min(processedImages.length - 1, prev + 1))}
            disabled={selectedIndex === processedImages.length - 1}
          >
            Next →
          </button>
        </div>
      )}

      {viewMode === 'side-by-side' ? (
        <div className="side-by-side-view">
          <div className="image-container">
            <h4>Original</h4>
            <div className="image-wrapper" style={{ transform: `scale(${zoomLevel})` }}>
              <img
                src={imageService.getImageUrl(currentImage.originalFilename || currentImage.originalname, false)}
                alt="Original"
              />
            </div>
            <div className="image-stats">
              <p>
                <strong>Resolution:</strong>{' '}
                {currentImage.originalDimensions?.width} x{' '}
                {currentImage.originalDimensions?.height}
              </p>
              <p>
                <strong>Size:</strong>{' '}
                {currentImage.originalSize ? formatFileSize(currentImage.originalSize) : 'Unknown'}
              </p>
            </div>
          </div>

          <div className="image-container">
            <h4>Upscaled</h4>
            <div className="image-wrapper" style={{ transform: `scale(${zoomLevel})` }}>
              <img
                src={currentImage.localUrl || imageService.getImageUrl(currentImage.filename, true)}
                alt="Upscaled"
              />
            </div>
            <div className="image-stats">
              <p>
                <strong>Resolution:</strong>{' '}
                {currentImage.upscaledDimensions?.width} x{' '}
                {currentImage.upscaledDimensions?.height}
              </p>
              <p>
                <strong>Size:</strong>{' '}
                {formatFileSize(currentImage.upscaledSize)}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="toggle-view">
          <div className="toggle-button-container">
            <button
              className={`toggle-btn ${showOriginal ? 'active' : ''}`}
              onClick={() => setShowOriginal(true)}
            >
              Show Original
            </button>
            <button
              className={`toggle-btn ${!showOriginal ? 'active' : ''}`}
              onClick={() => setShowOriginal(false)}
            >
              Show Upscaled
            </button>
          </div>
          
          <div className="image-container">
            <h4>{showOriginal ? 'Original' : 'Upscaled'}</h4>
            <div className="image-wrapper" style={{ transform: `scale(${zoomLevel})` }}>
              <img
                src={
                  showOriginal
                    ? imageService.getImageUrl(currentImage.originalFilename || currentImage.originalname, false)
                    : (currentImage.localUrl || imageService.getImageUrl(currentImage.filename, true))
                }
                alt={showOriginal ? 'Original' : 'Upscaled'}
              />
            </div>
            <div className="image-stats">
              <p>
                <strong>Resolution:</strong>{' '}
                {showOriginal
                  ? `${currentImage.originalDimensions?.width} x ${currentImage.originalDimensions?.height}`
                  : `${currentImage.upscaledDimensions?.width} x ${currentImage.upscaledDimensions?.height}`}
              </p>
              <p>
                <strong>Size:</strong>{' '}
                {showOriginal
                  ? (currentImage.originalSize ? formatFileSize(currentImage.originalSize) : 'Unknown')
                  : formatFileSize(currentImage.upscaledSize)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PreviewComparison;
