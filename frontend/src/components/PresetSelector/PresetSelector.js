import React from 'react';
import { useImageContext } from '../../contexts/ImageContext';
import './PresetSelector.css';

const PresetSelector = () => {
  const { upscalingSettings, updateUpscalingSettings } = useImageContext();

  const presets = [
    { value: '2x', label: '2x', description: 'Double resolution' },
    { value: '4x', label: '4x', description: 'Quadruple resolution' },
    { value: 'HD', label: 'HD', description: '1920×1080' },
    { value: '4K', label: '4K', description: '3840×2160' },
    { value: 'custom', label: 'Custom', description: 'Specify dimensions' },
  ];

  const handlePresetChange = (preset) => {
    updateUpscalingSettings({ preset });
  };

  const handleCustomChange = (field, value) => {
    updateUpscalingSettings({ [field]: value });
  };

  return (
    <div className="preset-selector">
      <h3>Resolution Preset</h3>
      <div className="preset-buttons">
        {presets.map((preset) => (
          <button
            key={preset.value}
            className={`preset-button ${
              upscalingSettings.preset === preset.value ? 'active' : ''
            }`}
            onClick={() => handlePresetChange(preset.value)}
          >
            <div className="preset-label">{preset.label}</div>
            <div className="preset-description">{preset.description}</div>
          </button>
        ))}
      </div>

      {upscalingSettings.preset === 'custom' && (
        <div className="custom-dimensions">
          <div className="input-group">
            <label htmlFor="customWidth">Width (px)</label>
            <input
              id="customWidth"
              type="number"
              min="1"
              value={upscalingSettings.customWidth}
              onChange={(e) => handleCustomChange('customWidth', e.target.value)}
              placeholder="e.g., 1920"
            />
          </div>
          <div className="input-group">
            <label htmlFor="customHeight">Height (px)</label>
            <input
              id="customHeight"
              type="number"
              min="1"
              value={upscalingSettings.customHeight}
              onChange={(e) => handleCustomChange('customHeight', e.target.value)}
              placeholder="e.g., 1080"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PresetSelector;
