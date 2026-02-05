import React, { useState } from 'react';
import { useImageContext } from '../../contexts/ImageContext';
import imageService from '../../services/api';
import tfUpscaleService from '../../services/tfUpscaleService';
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
  const [progressMessage, setProgressMessage] = useState('');

  const handleRemoveImage = (filename) => {
    removeUploadedImage(filename);
  };

  /**
   * Process single image with Browser AI
   */
  const processBrowserAI = async (image) => {
    try {
      setProgressMessage('Loading AI model...');
      
      // Fetch the original image file
      const imageUrl = image.preview || imageService.getImageUrl(image.filename);
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      // Determine scale factor from preset
      let scale = 2;
      if (upscalingSettings.preset === '4x') {
        scale = 4;
      }
      
      setProgressMessage(`Processing ${image.originalname}...`);
      
      // Upscale with TensorFlow.js
      const upscaledBlob = await tfUpscaleService.upscaleImage(blob, scale, (progress) => {
        if (progress.stage === 'loading') {
          setProgressMessage('Loading AI model...');
        } else if (progress.stage === 'processing') {
          setProgressMessage(`Processing ${image.originalname}... ${progress.progress}%`);
        }
      });
      
      // Create a local URL for the upscaled image
      const upscaledUrl = URL.createObjectURL(upscaledBlob);
      
      // Get dimensions
      const img = await createImageBitmap(upscaledBlob);
      
      return {
        success: true,
        filename: `browser-ai-${image.filename}`,
        originalname: image.originalname,
        originalFilename: image.filename,
        upscaledDimensions: {
          width: img.width,
          height: img.height
        },
        upscaledSize: upscaledBlob.size,
        format: 'png',
        localUrl: upscaledUrl, // Used for preview
        blob: upscaledBlob, // Used for download
        method: 'Browser AI'
      };
    } catch (error) {
      console.error('Browser AI processing error:', error);
      throw error;
    }
  };

  /**
   * Process single image with Cloud AI
   */
  const processCloudAI = async (image) => {
    try {
      setProgressMessage(`Uploading ${image.originalname} to AI service...`);
      
      // Determine scale factor from preset
      let scale = 2;
      if (upscalingSettings.preset === '4x') {
        scale = 4;
      }
      
      setProgressMessage(`AI processing ${image.originalname}...`);
      
      const result = await imageService.upscaleImageWithAI(
        image.filename,
        scale,
        upscalingSettings.cloudApiKey
      );
      
      return {
        ...result.result,
        originalname: image.originalname,
        originalFilename: image.filename,
      };
    } catch (error) {
      console.error('Cloud AI processing error:', error);
      throw error;
    }
  };

  /**
   * Process single image with Traditional method
   */
  const processTraditional = async (image) => {
    const result = await imageService.upscaleImage(image.filename, upscalingSettings);
    return {
      ...result.result,
      originalname: image.originalname,
      originalFilename: image.filename,
    };
  };

  const handleProcessSingle = async (image) => {
    try {
      updateProcessingStatus(image.filename, 'processing');
      
      let result;
      
      if (upscalingSettings.engine === 'browser-ai') {
        result = await processBrowserAI(image);
      } else if (upscalingSettings.engine === 'cloud-ai') {
        result = await processCloudAI(image);
      } else {
        result = await processTraditional(image);
      }
      
      updateProcessingStatus(image.filename, 'completed');
      addProcessedImage(result);
      setProgressMessage('');
    } catch (error) {
      console.error('Error processing image:', error);
      updateProcessingStatus(image.filename, 'error');
      
      let errorMessage = 'Error processing image';
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(errorMessage);
      setProgressMessage('');
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

      // Process based on engine type
      if (upscalingSettings.engine === 'browser-ai') {
        // Process each image individually with Browser AI
        let successCount = 0;
        for (let i = 0; i < uploadedImages.length; i++) {
          const image = uploadedImages[i];
          setProgressMessage(`Processing ${i + 1} of ${uploadedImages.length}...`);
          
          try {
            const result = await processBrowserAI(image);
            updateProcessingStatus(image.filename, 'completed');
            addProcessedImage(result);
            successCount++;
          } catch (error) {
            console.error(`Error processing ${image.originalname}:`, error);
            updateProcessingStatus(image.filename, 'error');
          }
        }
        
        alert(`Processed ${successCount} of ${uploadedImages.length} images successfully!`);
      } else if (upscalingSettings.engine === 'cloud-ai') {
        // Process each image individually with Cloud AI
        let successCount = 0;
        for (let i = 0; i < uploadedImages.length; i++) {
          const image = uploadedImages[i];
          setProgressMessage(`Processing ${i + 1} of ${uploadedImages.length} with Cloud AI...`);
          
          try {
            const result = await processCloudAI(image);
            updateProcessingStatus(image.filename, 'completed');
            addProcessedImage(result);
            successCount++;
          } catch (error) {
            console.error(`Error processing ${image.originalname}:`, error);
            updateProcessingStatus(image.filename, 'error');
            
            // Show specific error for first failure
            if (successCount === 0) {
              let errorMessage = 'Error processing with Cloud AI';
              if (error.response?.data?.error) {
                errorMessage = error.response.data.error;
              } else if (error.message) {
                errorMessage = error.message;
              }
              alert(errorMessage);
            }
          }
        }
        
        alert(`Processed ${successCount} of ${uploadedImages.length} images successfully!`);
      } else {
        // Use traditional batch processing
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
      }
    } catch (error) {
      console.error('Error batch processing:', error);
      let errorMessage = 'Error processing images';
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      alert(errorMessage);
    } finally {
      setIsProcessing(false);
      setProgressMessage('');
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

      {progressMessage && (
        <div className="progress-message">
          {progressMessage}
        </div>
      )}

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
