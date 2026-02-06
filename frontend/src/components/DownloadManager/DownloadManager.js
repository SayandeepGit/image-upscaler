import React, { useState } from 'react';
import { useImageContext } from '../../contexts/ImageContext';
import imageService from '../../services/api';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import './DownloadManager.css';

const DownloadManager = () => {
  const { processedImages, upscalingSettings } = useImageContext();
  const [zipBuilder, setZipBuilder] = useState(null);

  const handleDownloadSingle = async (image) => {
    try {
      // If it's a browser AI result with a blob, download directly
      if (image.blob) {
        const url = URL.createObjectURL(image.blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = image.originalname || 'upscaled-image.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        // Server-based image
        await imageService.downloadImage(image.filename);
      }
    } catch (error) {
      console.error('Error downloading image:', error);
      alert('Error downloading image: ' + (error.response?.data?.message || error.message));
    }
  };

  const constructFileName = (imgItem, position) => {
    const basename = imgItem.originalname?.split('.').slice(0, -1).join('.') || `image${position}`;
    const scaleLabel = upscalingSettings.preset || '2x';
    const engineUsed = imgItem.method || upscalingSettings.engine || 'traditional';
    const techSuffix = (typeof engineUsed === 'string' && engineUsed.match(/ai/i)) ? 'ai' : 'trad';
    return `${basename}_upscaled_${scaleLabel}_${techSuffix}.${imgItem.format || 'png'}`;
  };

  const handleDownloadAll = async () => {
    if (!processedImages.length) {
      alert('No processed images to download');
      return;
    }

    const progressTracker = { total: processedImages.length, collected: 0, phase: 'starting' };
    
    try {
      const zipContainer = new JSZip();
      const targetFolder = zipContainer.folder('upscaled');
      let successfulAdds = 0;

      for (let idx = 0; idx < processedImages.length; idx++) {
        const imgItem = processedImages[idx];
        const targetName = constructFileName(imgItem, idx + 1);
        
        progressTracker.collected = idx + 1;
        progressTracker.phase = `collecting ${targetName}`;
        if (idx % 3 === 0 || idx === processedImages.length - 1) {
          setZipBuilder({...progressTracker});
        }

        let imageBlob = null;

        if (imgItem.blob) {
          imageBlob = imgItem.blob;
        } else if (imgItem.filename) {
          try {
            const imgURL = imageService.getImageUrl(imgItem.filename, true);
            const response = await fetch(imgURL);
            if (response.ok) {
              imageBlob = await response.blob();
            }
          } catch (fetchError) {
            console.warn(`Skipping ${imgItem.filename}:`, fetchError);
            continue;
          }
        }

        if (imageBlob) {
          targetFolder.file(targetName, imageBlob);
          successfulAdds++;
        }
      }

      if (successfulAdds === 0) {
        throw new Error('Could not collect any images for archive');
      }

      progressTracker.phase = 'building archive';
      setZipBuilder({...progressTracker});

      const finalBlob = await zipContainer.generateAsync(
        { type: 'blob', compression: 'DEFLATE' },
        (progressData) => {
          progressTracker.phase = `compressing ${Math.round(progressData.percent)}%`;
          setZipBuilder({...progressTracker});
        }
      );

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
      const zipName = `upscaled_images_${timestamp}.zip`;
      saveAs(finalBlob, zipName);

      setZipBuilder(null);
    } catch (error) {
      console.error('Zip creation failed:', error);
      alert(`Archive creation failed: ${error.message}`);
      setZipBuilder(null);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (processedImages.length === 0) {
    return null;
  }

  return (
    <div className="download-manager">
      <div className="download-header">
        <h3>Processed Images ({processedImages.length})</h3>
        <button
          className="btn btn-download-all"
          onClick={handleDownloadAll}
          disabled={zipBuilder !== null}
        >
          📦 Download All as ZIP
        </button>
      </div>

      {zipBuilder && (
        <div className="zip-builder-status">
          <div className="zip-status-text">{zipBuilder.phase}</div>
          <div className="zip-progress-track">
            <div 
              className="zip-progress-fill"
              style={{ width: `${(zipBuilder.collected / zipBuilder.total) * 100}%` }}
            />
          </div>
          <div className="zip-count-display">{zipBuilder.collected} / {zipBuilder.total}</div>
        </div>
      )}

      <div className="download-list">
        {processedImages.map((image, index) => (
          <div key={image.filename} className="download-item">
            <div className="download-item-info">
              <span className="download-number">{index + 1}.</span>
              <div className="download-details">
                <p className="download-name" title={image.originalname}>
                  {image.originalname}
                </p>
                <p className="download-stats">
                  {image.upscaledDimensions?.width} x{' '}
                  {image.upscaledDimensions?.height} •{' '}
                  {formatFileSize(image.upscaledSize)}
                </p>
              </div>
            </div>
            <button
              className="btn-download"
              onClick={() => handleDownloadSingle(image)}
              title="Download this image"
            >
              ⬇️ Download
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DownloadManager;
