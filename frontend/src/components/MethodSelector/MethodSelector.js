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
      
      {/* Only show traditional methods when 'traditional' engine is selected */}
      {upscalingSettings.engine === 'traditional' && (
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

      {upscalingSettings.engine === 'browser-ai' && (
        <div className="method-info">
          <p>✨ Browser AI uses advanced image processing in your browser for enhanced quality.</p>
        </div>
      )}

      {upscalingSettings.engine === 'cloud-ai' && (
        <div className="method-info">
          <p>🚀 Cloud AI uses Real-ESRGAN for professional-grade upscaling.</p>
        </div>
      )}
    </div>
  );
};

export default MethodSelector;
