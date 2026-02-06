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
  const [multiSlotProcessor, setMultiSlotProcessor] = useState({
    queued: [],
    activeSlots: [],
    finished: [],
    errored: [],
    isPaused: false,
    maxSlots: 2
  });

  const handleRemoveImage = (filename) => {
    removeUploadedImage(filename);
  };

  const updateMultiSlotProcessor = (updates) => {
    setMultiSlotProcessor(prev => ({ ...prev, ...updates }));
  };

  const calculateCompletionRate = () => {
    if (uploadedImages.length === 0) return 0;
    const completed = multiSlotProcessor.finished.length + multiSlotProcessor.errored.length;
    return Math.floor((completed / uploadedImages.length) * 100);
  };

  const resetMultiSlotProcessor = () => {
    setMultiSlotProcessor({
      queued: [],
      activeSlots: [],
      finished: [],
      errored: [],
      isPaused: false,
      maxSlots: 2
    });
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
    resetMultiSlotProcessor();

    const imagesToProcess = [...uploadedImages];
    updateMultiSlotProcessor({ queued: imagesToProcess.map(img => img.filename) });

    try {
      const filenames = imagesToProcess.map(img => img.filename);
      
      filenames.forEach(filename => {
        updateProcessingStatus(filename, 'processing');
      });

      if (upscalingSettings.engine === 'browser-ai' || upscalingSettings.engine === 'cloud-ai') {
        await executeMultiSlotProcessing(imagesToProcess);
      } else {
        const result = await imageService.batchUpscale(filenames, upscalingSettings);
        
        if (result.success) {
          setBatchId(result.result.batchId);
          
          result.result.results.forEach((res) => {
            if (res.success) {
              updateProcessingStatus(res.originalname, 'completed');
              addProcessedImage(res);
              updateMultiSlotProcessor({
                finished: [...multiSlotProcessor.finished, res.originalname]
              });
            } else {
              updateProcessingStatus(res.originalname, 'error');
              updateMultiSlotProcessor({
                errored: [...multiSlotProcessor.errored, res.originalname]
              });
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

  const executeMultiSlotProcessing = async (images) => {
    const slots = [];
    let nextIdx = 0;

    const processSlot = async (slotId) => {
      while (nextIdx < images.length) {
        if (multiSlotProcessor.isPaused) {
          break;
        }
        
        const idx = nextIdx++;
        const img = images[idx];
        
        if (!img) break;

        updateMultiSlotProcessor(prev => ({
          ...prev,
          activeSlots: [...prev.activeSlots, img.filename]
        }));

        setProgressMessage(`[Slot ${slotId}] ${idx + 1}/${images.length}: ${img.originalname}`);
        
        try {
          let output;
          
          if (upscalingSettings.engine === 'browser-ai') {
            output = await processBrowserAI(img);
          } else if (upscalingSettings.engine === 'cloud-ai') {
            output = await processCloudAI(img);
          }
          
          updateProcessingStatus(img.filename, 'completed');
          addProcessedImage(output);
          
          updateMultiSlotProcessor(prev => ({
            ...prev,
            activeSlots: prev.activeSlots.filter(f => f !== img.filename),
            finished: [...prev.finished, img.filename],
            queued: prev.queued.filter(f => f !== img.filename)
          }));
        } catch (err) {
          console.error(`Slot ${slotId} failed on ${img.originalname}:`, err);
          updateProcessingStatus(img.filename, 'error');
          
          updateMultiSlotProcessor(prev => ({
            ...prev,
            activeSlots: prev.activeSlots.filter(f => f !== img.filename),
            errored: [...prev.errored, img.filename],
            queued: prev.queued.filter(f => f !== img.filename)
          }));
        }
      }
    };

    for (let slot = 0; slot < multiSlotProcessor.maxSlots; slot++) {
      slots.push(processSlot(slot + 1));
    }

    await Promise.all(slots);
    
    alert(`Completed ${multiSlotProcessor.finished.length} of ${images.length} images!`);
  };

  const pauseProcessing = () => {
    updateMultiSlotProcessor(prev => ({ ...prev, isPaused: true }));
    setProgressMessage('Pausing after active tasks complete...');
  };

  const resumeProcessing = async () => {
    updateMultiSlotProcessor(prev => ({ ...prev, isPaused: false }));
    setProgressMessage('Resuming processing...');
    if (multiSlotProcessor.queued.length > 0) {
      const remaining = uploadedImages.filter(img => 
        multiSlotProcessor.queued.includes(img.filename)
      );
      await executeMultiSlotProcessing(remaining);
    }
  };

  const stopProcessing = () => {
    updateMultiSlotProcessor(prev => ({ 
      ...prev, 
      isPaused: true, 
      queued: [], 
      activeSlots: [] 
    }));
    setIsProcessing(false);
    setProgressMessage('Processing stopped');
    setTimeout(() => setProgressMessage(''), 2000);
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
          {isProcessing && !multiSlotProcessor.isPaused && (
            <button className="btn btn-warning" onClick={pauseProcessing}>
              Pause
            </button>
          )}
          {isProcessing && multiSlotProcessor.isPaused && (
            <button className="btn btn-success" onClick={resumeProcessing}>
              Resume
            </button>
          )}
          {isProcessing && (
            <button className="btn btn-danger" onClick={stopProcessing}>
              Cancel
            </button>
          )}
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
          {isProcessing && (
            <div className="completion-indicator">
              {calculateCompletionRate()}% complete
              {' '}({multiSlotProcessor.finished.length + multiSlotProcessor.errored.length}/{uploadedImages.length})
            </div>
          )}
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
