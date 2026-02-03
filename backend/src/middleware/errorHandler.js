const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  // Multer errors
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'File too large',
        message: 'File size exceeds the maximum allowed limit'
      });
    }
    return res.status(400).json({
      error: 'Upload error',
      message: err.message
    });
  }

  // Custom errors
  if (err.message) {
    return res.status(err.statusCode || 500).json({
      error: err.name || 'Error',
      message: err.message
    });
  }

  // Default error
  res.status(500).json({
    error: 'Internal Server Error',
    message: 'Something went wrong on the server'
  });
};

module.exports = errorHandler;
