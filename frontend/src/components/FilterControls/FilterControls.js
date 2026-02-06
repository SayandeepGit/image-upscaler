import React from 'react';
import { useImageContext } from '../../contexts/ImageContext';
import './FilterControls.css';

const FilterControls = () => {
  const { filterSettings, updateFilterSettings } = useImageContext();

  const presets = [
    { value: 'none', label: 'None', settings: {} },
    { 
      value: 'vibrant', 
      label: 'Vibrant', 
      settings: { brightness: 0, contrast: 10, saturation: 20, grayscale: false, sepia: false, blur: false }
    },
    { 
      value: 'blackwhite', 
      label: 'Black & White', 
      settings: { brightness: 0, contrast: 20, saturation: 0, grayscale: true, sepia: false, blur: false }
    },
    { 
      value: 'vintage', 
      label: 'Vintage', 
      settings: { brightness: -10, contrast: 10, saturation: 0, grayscale: false, sepia: true, blur: false }
    }
  ];

  const handleSliderChange = (field, value) => {
    updateFilterSettings({ [field]: parseFloat(value), preset: 'custom' });
  };

  const handleCheckboxChange = (field, checked) => {
    updateFilterSettings({ [field]: checked, preset: 'custom' });
  };

  const handleTimingChange = (timing) => {
    updateFilterSettings({ timing });
  };

  const handlePresetChange = (preset) => {
    if (preset === 'none') {
      handleReset();
    } else {
      const presetConfig = presets.find(p => p.value === preset);
      if (presetConfig) {
        updateFilterSettings({ ...presetConfig.settings, preset });
      }
    }
  };

  const handleReset = () => {
    updateFilterSettings({
      brightness: 0,
      contrast: 0,
      saturation: 0,
      grayscale: false,
      sepia: false,
      blur: false,
      timing: 'before',
      preset: 'none'
    });
  };

  return (
    <div className="filter-controls">
      <h3>Image Filters (Optional)</h3>
      
      <div className="filter-presets">
        <label>Presets:</label>
        <div className="preset-buttons-small">
          {presets.map(preset => (
            <button
              key={preset.value}
              className={`preset-btn ${filterSettings.preset === preset.value ? 'active' : ''}`}
              onClick={() => handlePresetChange(preset.value)}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-section">
        <div className="filter-row">
          <label htmlFor="brightness">
            Brightness: <span className="value">{filterSettings.brightness}</span>
          </label>
          <input
            id="brightness"
            type="range"
            min="-100"
            max="100"
            value={filterSettings.brightness}
            onChange={(e) => handleSliderChange('brightness', e.target.value)}
            className="slider"
          />
        </div>

        <div className="filter-row">
          <label htmlFor="contrast">
            Contrast: <span className="value">{filterSettings.contrast}</span>
          </label>
          <input
            id="contrast"
            type="range"
            min="-100"
            max="100"
            value={filterSettings.contrast}
            onChange={(e) => handleSliderChange('contrast', e.target.value)}
            className="slider"
          />
        </div>

        <div className="filter-row">
          <label htmlFor="saturation">
            Saturation: <span className="value">{filterSettings.saturation}</span>
          </label>
          <input
            id="saturation"
            type="range"
            min="-100"
            max="100"
            value={filterSettings.saturation}
            onChange={(e) => handleSliderChange('saturation', e.target.value)}
            className="slider"
          />
        </div>
      </div>

      <div className="filter-checkboxes">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={filterSettings.grayscale}
            onChange={(e) => handleCheckboxChange('grayscale', e.target.checked)}
          />
          <span>Grayscale</span>
        </label>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={filterSettings.sepia}
            onChange={(e) => handleCheckboxChange('sepia', e.target.checked)}
          />
          <span>Sepia</span>
        </label>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={filterSettings.blur}
            onChange={(e) => handleCheckboxChange('blur', e.target.checked)}
          />
          <span>Blur</span>
        </label>
      </div>

      <div className="filter-timing">
        <label htmlFor="timing">Apply filters:</label>
        <select
          id="timing"
          value={filterSettings.timing}
          onChange={(e) => handleTimingChange(e.target.value)}
          className="timing-dropdown"
        >
          <option value="before">Before Upscaling</option>
          <option value="after">After Upscaling</option>
          <option value="both">Both</option>
        </select>
      </div>

      <div className="filter-actions">
        <button className="btn-reset" onClick={handleReset}>
          Reset All Filters
        </button>
      </div>
    </div>
  );
};

export default FilterControls;
