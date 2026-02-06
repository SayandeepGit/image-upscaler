import React, { useState, useEffect } from 'react';
import tfUpscaleService from '../../services/tfUpscaleService';
import { useToast } from '../../contexts/ToastContext';
import './PerformancePanel.css';

const PerformancePanel = () => {
  const { success, error } = useToast();
  const [cacheStatus, setCacheStatus] = useState({
    isLoaded: false,
    cacheSize: 0,
    lastCached: null,
    isLoading: false
  });

  useEffect(() => {
    checkCacheStatus();
  }, []);

  const checkCacheStatus = async () => {
    try {
      const status = await tfUpscaleService.getCacheStatus();
      setCacheStatus(prev => ({ ...prev, ...status }));
    } catch (error) {
      console.error('Failed to check cache status:', error);
    }
  };

  const handlePreloadModels = async () => {
    setCacheStatus(prev => ({ ...prev, isLoading: true }));
    try {
      await tfUpscaleService.preloadModels();
      await checkCacheStatus();
      success('AI models preloaded successfully!');
    } catch (err) {
      console.error('Failed to preload models:', err);
      error('Failed to preload models: ' + err.message);
    } finally {
      setCacheStatus(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleClearCache = async () => {
    if (!window.confirm('Are you sure you want to clear the AI model cache?')) {
      return;
    }
    
    try {
      await tfUpscaleService.clearCache();
      await checkCacheStatus();
      success('Cache cleared successfully!');
    } catch (err) {
      console.error('Failed to clear cache:', err);
      error('Failed to clear cache: ' + err.message);
    }
  };

  const formatCacheSize = (bytes) => {
    if (bytes === 0) return '0 MB';
    const mb = bytes / (1024 * 1024);
    return mb.toFixed(2) + ' MB';
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <div className="performance-panel">
      <h4>AI Model Performance</h4>
      
      <div className="cache-info">
        <div className="info-row">
          <span className="info-label">Cache Status:</span>
          <span className={`status-badge ${cacheStatus.isLoaded ? 'loaded' : 'not-loaded'}`}>
            {cacheStatus.isLoaded ? '✓ Loaded' : '○ Not Cached'}
          </span>
        </div>
        
        {cacheStatus.isLoaded && (
          <>
            <div className="info-row">
              <span className="info-label">Cache Size:</span>
              <span className="info-value">{formatCacheSize(cacheStatus.cacheSize)}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Last Cached:</span>
              <span className="info-value">{formatTimestamp(cacheStatus.lastCached)}</span>
            </div>
          </>
        )}
      </div>

      <div className="cache-actions">
        <button
          className="btn-cache btn-preload"
          onClick={handlePreloadModels}
          disabled={cacheStatus.isLoading}
        >
          {cacheStatus.isLoading ? 'Loading...' : 'Preload Models'}
        </button>
        <button
          className="btn-cache btn-clear"
          onClick={handleClearCache}
          disabled={!cacheStatus.isLoaded || cacheStatus.isLoading}
        >
          Clear Cache
        </button>
      </div>

      <div className="cache-note">
        <small>💡 Preloading models improves processing speed for Browser AI</small>
      </div>
    </div>
  );
};

export default PerformancePanel;
