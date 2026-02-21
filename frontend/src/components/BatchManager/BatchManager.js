import React, { useState } from 'react';
import { useImageContext } from '../../contexts/ImageContext';
import { useToast } from '../../contexts/ToastContext';
import imageService from '../../services/api';
import './BatchManager.css';

let tfUpscaleServicePromise;

const loadTFUpscaleService = async () => {
  if (!tfUpscaleServicePromise) {
    tfUpscaleServicePromise = import('../../services/tfUpscaleService').then((module) => module.default);
  }

  return tfUpscaleServicePromise;
};

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
    batchConcurrency,
    updateBatchConcurrency,
  } = useImageContext();

  const { success, error: showError } = useToast();

  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMessage, setProgressMessage] = useState('');
  const [startTime, setStartTime] = useState(null);
  const [multiSlotProcessor, setMultiSlotProcessor] = useState({
    queued: [],
    activeSlots: [],
    finished: [],
    errored: [],
    isPaused: false,
    maxSlots: batchConcurrency
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

  const calculateEstimatedTime = () => {
    if (!startTime || uploadedImages.length === 0) return null;
    
    const completed = multiSlotProcessor.finished.length + multiSlotProcessor.errored.length;
    if (completed === 0) return null;
    
    const elapsedMs = Date.now() - startTime;
    const avgTimePerImage = elapsedMs / completed;
    const remaining = uploadedImages.length - completed;
    const estimatedRemainingMs = avgTimePerImage * remaining;
    
    const seconds = Math.floor(estimatedRemainingMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
      return `~${minutes}m ${remainingSeconds}s remaining`;
    }
    return `~${seconds}s remaining`;
  };

  const handleConcurrencyChange = (newConcurrency) => {
    const concurrency = Math.max(1, Math.min(5, parseInt(newConcurrency) || 2));
    updateBatchConcurrency(concurrency);
    updateMultiSlotProcessor({ maxSlots: concurrency });
  };

  const resetMultiSlotProcessor = () => {
    setMultiSlotProcessor({
      queued: [],
      activeSlots: [],
      finished: [],
      errored: [],
      isPaused: false,
      maxSlots: batchConcurrency
    });
    setStartTime(Date.now());
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
      
      // Load TensorFlow service only when Browser AI processing is used
      const tfUpscaleService = await loadTFUpscaleService();

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
    } catch (err) {
      console.error('Error processing image:', err);
      updateProcessingStatus(image.filename, 'error');
      
      let errorMessage = 'Error processing image';
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      showError(errorMessage);
      setProgressMessage('');
    }
  };

  const handleProcessAll = async () => {
    if (uploadedImages.length === 0) {
      showError('No images to process');
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
              updateMultiSlotProcessor(prev => ({
                ...prev,
                finished: [...prev.finished, res.originalname]
              }));
            } else {
              updateProcessingStatus(res.originalname, 'error');
              updateMultiSlotProcessor(prev => ({
                ...prev,
                errored: [...prev.errored, res.originalname]
              }));
            }
          });

          success(`Processed ${result.result.totalProcessed} images successfully!`);
        }
      }
    } catch (err) {
      console.error('Error batch processing:', err);
      let errorMessage = 'Error processing images';
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.message) {
        errorMessage = err.message;
      }
      showError(errorMessage);
    } finally {
      setIsProcessing(false);
      setProgressMessage('');
      setStartTime(null);
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
    
    const completedCount = multiSlotProcessor.finished.length;
    const failedCount = multiSlotProcessor.errored.length;
    
    if (failedCount > 0) {
      showError(`Completed ${completedCount} of ${images.length} images. ${failedCount} failed.`);
    } else {
      success(`Successfully processed ${completedCount} of ${images.length} images!`);
    }
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
    setStartTime(null);
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
              ⏸ Pause
            </button>
          )}
          {isProcessing && multiSlotProcessor.isPaused && (
            <button className="btn btn-success" onClick={resumeProcessing}>
              ▶ Resume
            </button>
          )}
          {isProcessing && (
            <button className="btn btn-danger" onClick={stopProcessing}>
              ■ Cancel
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

      {!isProcessing && (
        <div className="concurrency-control">
          <label htmlFor="concurrency">
            Concurrent Processing:
          </label>
          <input
            id="concurrency"
            type="number"
            min="1"
            max="5"
            value={batchConcurrency}
            onChange={(e) => handleConcurrencyChange(e.target.value)}
            disabled={isProcessing}
            className="concurrency-input"
          />
          <span className="concurrency-label">
            {batchConcurrency} image{batchConcurrency > 1 ? 's' : ''} at once
          </span>
        </div>
      )}

      {progressMessage && (
        <div className="progress-message">
          <div className="progress-text">{progressMessage}</div>
          {isProcessing && (
            <div className="progress-details">
              <div className="completion-indicator">
                {calculateCompletionRate()}% complete
                {' '}({multiSlotProcessor.finished.length + multiSlotProcessor.errored.length}/{uploadedImages.length})
              </div>
              {calculateEstimatedTime() && (
                <div className="time-estimate">{calculateEstimatedTime()}</div>
              )}
            </div>
          )}
        </div>
      )}

      {isProcessing && (
        <div className="batch-status-panel">
          <div className="status-item">
            <span className="status-icon queued">⏳</span>
            <span className="status-text">Queued: {multiSlotProcessor.queued.length}</span>
          </div>
          <div className="status-item">
            <span className="status-icon processing">⚙️</span>
            <span className="status-text">Processing: {multiSlotProcessor.activeSlots.length}</span>
          </div>
          <div className="status-item">
            <span className="status-icon completed">✓</span>
            <span className="status-text">Completed: {multiSlotProcessor.finished.length}</span>
          </div>
          <div className="status-item">
            <span className="status-icon failed">✕</span>
            <span className="status-text">Failed: {multiSlotProcessor.errored.length}</span>
          </div>
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