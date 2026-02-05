import { useState, useEffect } from 'react';

const storageIdentifier = 'upscaler-palette';
const themeLight = 'bright';
const themeDark = 'midnight';

const createPaletteStore = () => {
  let memoizedTheme = null;
  
  const loadTheme = () => {
    if (memoizedTheme) return memoizedTheme;
    const persisted = window.localStorage.getItem(storageIdentifier);
    memoizedTheme = persisted === themeDark ? themeDark : themeLight;
    return memoizedTheme;
  };
  
  const toggleTheme = (current) => {
    const next = current === themeLight ? themeDark : themeLight;
    memoizedTheme = next;
    window.localStorage.setItem(storageIdentifier, next);
    return next;
  };
  
  const applyTheme = (theme) => {
    document.documentElement.setAttribute('data-palette', theme);
  };
  
  return { loadTheme, toggleTheme, applyTheme };
};

const paletteStore = createPaletteStore();

export function useColorPalette() {
  const [palette, setPalette] = useState(paletteStore.loadTheme);

  useEffect(() => {
    paletteStore.applyTheme(palette);
  }, [palette]);

  const togglePalette = () => {
    setPalette(currentTheme => paletteStore.toggleTheme(currentTheme));
  };

  return { palette, togglePalette };
}
