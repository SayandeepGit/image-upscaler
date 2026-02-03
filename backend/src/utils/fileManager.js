const fs = require('fs').promises;
const path = require('path');

class FileManager {
  constructor() {
    this.uploadDir = path.join(__dirname, '../../uploads');
    this.processedDir = path.join(__dirname, '../../processed');
    this.cleanupInterval = 60 * 60 * 1000; // 1 hour
    
    this.startCleanup();
  }

  async ensureDirectories() {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
      await fs.mkdir(this.processedDir, { recursive: true });
    } catch (error) {
      console.error('Error creating directories:', error);
    }
  }

  async deleteFile(filePath) {
    try {
      await fs.unlink(filePath);
      console.log(`Deleted file: ${filePath}`);
    } catch (error) {
      console.error(`Error deleting file ${filePath}:`, error);
    }
  }

  async cleanupOldFiles(directory, maxAge = 3600000) { // 1 hour default
    try {
      const files = await fs.readdir(directory);
      const now = Date.now();

      for (const file of files) {
        const filePath = path.join(directory, file);
        const stats = await fs.stat(filePath);
        const age = now - stats.mtimeMs;

        if (age > maxAge) {
          await this.deleteFile(filePath);
        }
      }
    } catch (error) {
      console.error(`Error cleaning up directory ${directory}:`, error);
    }
  }

  startCleanup() {
    // Initial cleanup
    this.ensureDirectories();
    
    // Periodic cleanup
    setInterval(async () => {
      await this.cleanupOldFiles(this.uploadDir);
      await this.cleanupOldFiles(this.processedDir);
    }, this.cleanupInterval);
  }

  getFilePath(filename, isProcessed = false) {
    const dir = isProcessed ? this.processedDir : this.uploadDir;
    return path.join(dir, filename);
  }
}

module.exports = new FileManager();
