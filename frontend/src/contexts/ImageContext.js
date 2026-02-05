import React, { createContext, useContext, useState, useEffect } from 'react';

const ImageContext = createContext();

export const useImageContext = () => {
  const context = useContext(ImageContext);
  if (!context) {
    throw new Error('useImageContext must be used within ImageProvider');
  }
  return context;
};

export const ImageProvider = ({ children }) => {
  const [uploadedImages, setUploadedImages] = useState([]);
  const [processingStatus, setProcessingStatus] = useState({});
  const [upscalingSettings, setUpscalingSettings] = useState({
    preset: '2x',
    method: 'lanczos',
    customWidth: '',
    customHeight: '',
    useAI: false,
    engine: 'traditional', // 'traditional', 'browser-ai', 'cloud-ai'
    cloudApiKey: '', // Optional user API key for cloud AI
  });
  const [processedImages, setProcessedImages] = useState([]);
  const [batchId, setBatchId] = useState(null);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      processedImages.forEach(image => {
        if (image.localUrl) {
          URL.revokeObjectURL(image.localUrl);
        }
      });
    };
  }, [processedImages]);

  const addUploadedImage = (image) => {
    setUploadedImages((prev) => [...prev, image]);
  };

  const addUploadedImages = (images) => {
    setUploadedImages((prev) => [...prev, ...images]);
  };

  const removeUploadedImage = (filename) => {
    setUploadedImages((prev) => prev.filter((img) => img.filename !== filename));
  };

  const clearUploadedImages = () => {
    setUploadedImages([]);
  };

  const updateProcessingStatus = (filename, status) => {
    setProcessingStatus((prev) => ({
      ...prev,
      [filename]: status,
    }));
  };

  const addProcessedImage = (image) => {
    setProcessedImages((prev) => [...prev, image]);
  };

  const clearProcessedImages = () => {
    // Cleanup any object URLs to prevent memory leaks
    processedImages.forEach(image => {
      if (image.localUrl) {
        URL.revokeObjectURL(image.localUrl);
      }
    });
    setProcessedImages([]);
  };

  const updateUpscalingSettings = (settings) => {
    setUpscalingSettings((prev) => ({
      ...prev,
      ...settings,
    }));
  };

  const value = {
    uploadedImages,
    addUploadedImage,
    addUploadedImages,
    removeUploadedImage,
    clearUploadedImages,
    processingStatus,
    updateProcessingStatus,
    upscalingSettings,
    updateUpscalingSettings,
    processedImages,
    addProcessedImage,
    clearProcessedImages,
    batchId,
    setBatchId,
  };

  return <ImageContext.Provider value={value}>{children}</ImageContext.Provider>;
};
