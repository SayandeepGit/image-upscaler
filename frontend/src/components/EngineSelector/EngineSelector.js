import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useImageContext } from '../../contexts/ImageContext';
import './EngineSelector.css';

const PerformancePanel = lazy(() => import('../PerformancePanel'));

const EngineSelector = () => {
  const { upscalingSettings, updateUpscalingSettings } = useImageContext();
  const [webglSupported, setWebglSupported] = useState(true);

  useEffect(() => {
    // Check WebGL support without loading TensorFlow.js on initial app load
    try {
      const canvas = document.createElement('canvas');
      const isSupported = !!(
        window.WebGLRenderingContext &&
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
      );
      setWebglSupported(isSupported);
    } catch (error) {
      setWebglSupported(false);
    }
  }, []);

  const engines = [
    {
      value: 'traditional',
      label: 'Traditional',
      badge: 'FASTEST',
      badgeColor: 'blue',
      description: 'Fast, reliable server-side processing',
      note: null,
    },
    {
      value: 'browser-ai',
      label: 'Browser AI',
      badge: 'FREE',
      badgeColor: 'green',
      description: 'AI-powered upscaling in your browser - Free, private, no data sent to server',
      note: webglSupported 
        ? 'May be slower on older devices. Processes entirely in your browser.'
        : 'WebGL not supported - This option is disabled',
      disabled: !webglSupported,
    },
    {
      value: 'cloud-ai',
      label: 'Cloud AI',
      badge: 'BEST QUALITY',
      badgeColor: 'purple',
      description: 'Professional-grade Real-ESRGAN upscaling via cloud API',
      note: 'Requires API key for best results',
    },
  ];

  const handleEngineChange = (engineValue) => {
    if (engineValue === 'browser-ai' && !webglSupported) {
      return; // Don't allow selection if WebGL not supported
    }
    updateUpscalingSettings({ 
      engine: engineValue,
      // Reset useAI flag for backward compatibility
      useAI: engineValue !== 'traditional'
    });
  };

  const handleApiKeyChange = (e) => {
    updateUpscalingSettings({ cloudApiKey: e.target.value });
  };

  return (
    <div className="engine-selector">
      <h3>Upscaling Engine</h3>
      
      <div className="engine-options">
        {engines.map((engine) => (
          <label
            key={engine.value}
            className={`engine-option ${
              upscalingSettings.engine === engine.value ? 'selected' : ''
            } ${engine.disabled ? 'disabled' : ''}`}
          >
            <input
              type="radio"
              name="engine"
              value={engine.value}
              checked={upscalingSettings.engine === engine.value}
              onChange={() => handleEngineChange(engine.value)}
              disabled={engine.disabled}
            />
            <div className="engine-content">
              <div className="engine-header">
                <span className="engine-label">{engine.label}</span>
                <span className={`engine-badge ${engine.badgeColor}`}>
                  {engine.badge}
                </span>
              </div>
              <p className="engine-description">{engine.description}</p>
              {engine.note && (
                <p className={`engine-note ${engine.disabled ? 'error' : ''}`}>
                  ℹ️ {engine.note}
                </p>
              )}
            </div>
          </label>
        ))}
      </div>

      {upscalingSettings.engine === 'cloud-ai' && (
        <div className="api-key-section">
          <label htmlFor="cloudApiKey">
            Replicate API Key (Optional)
          </label>
          <input
            id="cloudApiKey"
            type="text"
            placeholder="Enter your Replicate API key (optional)"
            value={upscalingSettings.cloudApiKey || ''}
            onChange={handleApiKeyChange}
            className="api-key-input"
          />
          <p className="api-key-help">
            Get free API key at{' '}
            <a
              href="https://replicate.com/account/api-tokens"
              target="_blank"
              rel="noopener noreferrer"
            >
              replicate.com
            </a>{' '}
            (50 free uses/month). If not provided, server's key will be used (if configured).
          </p>
        </div>
      )}

      {upscalingSettings.engine === 'browser-ai' && (
        <Suspense fallback={<p className="engine-note">Loading AI performance tools...</p>}>
          <PerformancePanel />
        </Suspense>
      )}
    </div>
  );
};

export default EngineSelector;