import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useImageContext } from '../../contexts/ImageContext';
import imageService from '../../services/api';
import './ImageUploader.css';

const ImageUploader = () => {
  const { addUploadedImage, addUploadedImages } = useImageContext();

  const onDrop = useCallback(async (acceptedFiles) => {
    try {
      if (acceptedFiles.length === 1) {
        // Single file upload
        const result = await imageService.uploadImage(acceptedFiles[0]);
        addUploadedImage({
          ...result.file,
          preview: URL.createObjectURL(acceptedFiles[0]),
        });
      } else if (acceptedFiles.length > 1) {
        // Multiple file upload
        const result = await imageService.uploadMultipleImages(acceptedFiles);
        const imagesWithPreview = result.files.map((file, index) => ({
          ...file,
          preview: URL.createObjectURL(acceptedFiles[index]),
        }));
        addUploadedImages(imagesWithPreview);
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      alert('Error uploading images: ' + (error.response?.data?.message || error.message));
    }
  }, [addUploadedImage, addUploadedImages]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
    },
    multiple: true,
  });

  return (
    <div className="image-uploader">
      <div
        {...getRootProps()}
        className={`dropzone ${isDragActive ? 'active' : ''}`}
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <div className="dropzone-content">
            <p className="dropzone-icon">📥</p>
            <p className="dropzone-text">Drop the images here...</p>
          </div>
        ) : (
          <div className="dropzone-content">
            <p className="dropzone-icon">🖼️</p>
            <p className="dropzone-text">
              Drag & drop images here, or click to select
            </p>
            <p className="dropzone-subtext">
              Supports PNG, JPG, JPEG, and WEBP
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageUploader;
