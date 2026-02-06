import React from 'react';
import { BsMoon, BsSun } from 'react-icons/bs';
import './PaletteToggle.css';

const iconDimensions = 26;
const darkThemeValue = 'midnight';

export default function PaletteToggle({ palette, onToggle }) {
  const isDarkTheme = palette === darkThemeValue;
  const IconToDisplay = isDarkTheme ? BsSun : BsMoon;
  const screenReaderText = isDarkTheme ? 'Switch to bright mode' : 'Switch to midnight mode';

  return (
    <button
      onClick={onToggle}
      className="palette-toggle"
      aria-label={screenReaderText}
      type="button"
    >
      <IconToDisplay size={iconDimensions} />
    </button>
  );
}
