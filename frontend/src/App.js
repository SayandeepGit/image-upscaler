import React from 'react';
import { ImageProvider } from './contexts/ImageContext';
import ImageUploader from './components/ImageUploader';
import PresetSelector from './components/PresetSelector';
import EngineSelector from './components/EngineSelector';
import MethodSelector from './components/MethodSelector';
import BatchManager from './components/BatchManager';
import PreviewComparison from './components/PreviewComparison';
import DownloadManager from './components/DownloadManager';
import './App.css';

function App() {
  return (
    <ImageProvider>
      <div className="App">
        <header className="app-header">
          <h1>🖼️ Image Upscaler</h1>
          <p className="app-subtitle">
            Upscale your images to higher resolutions with ease
          </p>
        </header>

        <main className="app-main">
          <div className="container">
            <section className="section">
              <h2>Step 1: Upload Images</h2>
              <ImageUploader />
            </section>

            <section className="section">
              <h2>Step 2: Configure Upscaling</h2>
              <PresetSelector />
              <EngineSelector />
              <MethodSelector />
            </section>

            <section className="section">
              <h2>Step 3: Process Images</h2>
              <BatchManager />
            </section>

            <section className="section">
              <h2>Step 4: Preview Results</h2>
              <PreviewComparison />
            </section>

            <section className="section">
              <h2>Step 5: Download</h2>
              <DownloadManager />
            </section>
          </div>
        </main>

        <footer className="app-footer">
          <p>
            Built with React, Node.js, Express, and Sharp •{' '}
            <a
              href="https://github.com/SayandeepGit/image-upscaler"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
          </p>
        </footer>
      </div>
    </ImageProvider>
  );
}

export default App;
