import React from 'react';
import { useImageContext } from '../../contexts/ImageContext';
import './MethodSelector.css';

const MethodSelector = () => {
  const { upscalingSettings, updateUpscalingSettings } = useImageContext();

  const methods = [
    {
      value: 'nearest',
      label: 'Nearest Neighbor',
      description: 'Fastest, pixelated look',
    },
    {
      value: 'bilinear',
      label: 'Bilinear',
      description: 'Fast, smooth',
    },
    {
      value: 'bicubic',
      label: 'Bicubic',
      description: 'High quality, sharper',
    },
    {
      value: 'lanczos',
      label: 'Lanczos',
      description: 'Highest quality, slower',
    },
  ];

  const handleMethodChange = (method) => {
    updateUpscalingSettings({ method, useAI: false });
  };

  const handleAIToggle = () => {
    updateUpscalingSettings({ useAI: !upscalingSettings.useAI });
  };

  return (
    <div className="method-selector">
      <h3>Upscaling Method</h3>
      
      <div className="ai-toggle">
        <label className="toggle-container">
          <input
            type="checkbox"
            checked={upscalingSettings.useAI}
            onChange={handleAIToggle}
            disabled
          />
          <span className="toggle-slider"></span>
          <span className="toggle-label">
            AI-Based Upscaling (Coming Soon)
          </span>
        </label>
        <p className="ai-info">
          AI upscaling will provide superior quality using advanced neural networks.
        </p>
      </div>

      {!upscalingSettings.useAI && (
        <div className="method-buttons">
          {methods.map((method) => (
            <button
              key={method.value}
              className={`method-button ${
                upscalingSettings.method === method.value ? 'active' : ''
              }`}
              onClick={() => handleMethodChange(method.value)}
            >
              <div className="method-label">{method.label}</div>
              <div className="method-description">{method.description}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default MethodSelector;
