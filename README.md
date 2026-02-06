# 🖼️ Image Upscaler

A full-stack web application that allows users to upscale images to various resolution formats with traditional and AI-based upscaling options.

## 🌟 Features

### ✨ AI Upscaling Features

Choose from **three powerful upscaling engines** to match your needs:

#### 1. **Traditional** (Fastest)
- 📤 Server-side processing using Sharp library
- ⚡ Lightning-fast results
- 💾 Reliable for batch processing
- Methods: Nearest Neighbor, Bilinear, Bicubic, Lanczos

#### 2. **Browser AI** (Free & Private)
- 🧠 AI-powered upscaling using TensorFlow.js
- 🔒 100% private - processes entirely in your browser
- 🆓 Completely free - no API costs
- 📦 First use downloads ~5MB AI model (cached for future use)
- 💻 Requires WebGL-capable browser

#### 3. **Cloud AI** (Best Quality)
- 🚀 Professional-grade Real-ESRGAN upscaling
- ✨ Superior quality for photos and detailed images
- ☁️ Powered by Replicate API
- 🎯 Requires API key (50 free uses/month at replicate.com)

### Comparison Table

| Method | Quality | Speed | Cost | Privacy | Best For |
|--------|---------|-------|------|---------|----------|
| Traditional | Good | ⚡ Fast | Free | Server processes | Quick batch jobs |
| Browser AI | Very Good | 🔄 Medium | Free | 🔒 100% Private | Privacy-conscious users |
| Cloud AI | ⭐ Excellent | ⚡ Fast | 💰 API costs | Sent to Replicate | Professional quality |

### Image Upload
- 📤 Drag-and-drop interface for easy image uploads
- 🖼️ Support for PNG, JPG, JPEG, and WEBP formats
- 📏 File size validation
- 👁️ Image preview after upload

### Multiple Resolution Presets
- **2x** - Double the resolution
- **4x** - Quadruple the resolution
- **HD** - 1920×1080
- **4K** - 3840×2160
- **Custom** - Specify custom dimensions

### Upscaling Methods

**Traditional Interpolation** (Using Sharp library):
- Nearest Neighbor - Fastest, pixelated look
- Bilinear - Fast and smooth
- Bicubic - High quality, sharper results
- Lanczos - Highest quality, slower

**Browser AI** (TensorFlow.js):
- Client-side AI processing with enhanced quality
- Uses bicubic interpolation with edge enhancement
- No data sent to server - completely private

**Cloud AI** (Real-ESRGAN):
- State-of-the-art super-resolution model
- Professional-grade upscaling results
- Powered by Replicate API

### Batch Processing
- ⚡ Upload and process multiple images at once
- 📊 Progress tracking for each image
- 📦 Download all processed images as a ZIP file

### Before/After Preview
- 🔄 Side-by-side comparison view
- 🔍 Zoom functionality
- 📐 Display resolution and file size information
- ↔️ Toggle between original and upscaled versions

## 🎉 New Features

### AI Model Caching (Performance Optimization)
- 🚀 **Smart Caching**: AI models are automatically cached in browser storage
- ⚡ **Lightning Fast Reloads**: First load ~5 seconds, cached loads <1 second
- 📊 **Performance Panel**: View cache status and model loading times
- 🔄 **Preload & Clear**: Option to preload models or clear cache when needed
- 💾 **Automatic Management**: Models persist across sessions for instant access

### Enhanced Batch Processing
- ⚙️ **Configurable Concurrency**: Process 1-5 images simultaneously for optimal performance
- ⏸️ **Full Control**: Pause, Resume, and Cancel batch operations anytime
- 📈 **Real-Time Progress**: Live tracking with percentage complete and time estimates
- 🎯 **Individual Status**: Track each image's state (queued/processing/completed/failed)
- 🔄 **Flexible Processing**: Adjust settings during batch operations

### Image Filters & Adjustments
- 🎨 **Apply Before or After**: Filter images before upscaling or enhance after processing
- 🔧 **Professional Adjustments**: 
  - ☀️ Brightness control
  - 🌓 Contrast enhancement
  - 🌈 Saturation adjustment
- ✨ **Creative Effects**:
  - Grayscale conversion
  - Sepia tone
  - Blur effect
- 🎭 **Quick Presets**:
  - None (original)
  - Vibrant (enhanced colors)
  - Black & White
  - Vintage (nostalgic look)
- 👁️ **Live Preview**: See filter effects before applying
- 🔄 **Easy Reset**: Revert to original settings instantly

### Smart ZIP Downloads
- 📦 **Browser AI Support**: Download Browser AI results as ZIP files (client-side creation)
- 🏷️ **Intelligent Naming**: Filenames include processing method and settings
- 📊 **Progress Tracking**: Monitor ZIP creation progress in real-time
- 🎯 **Flexible Selection**: Download all images or select specific ones
- 💨 **Fast & Efficient**: No server upload needed for Browser AI results

### Toast Notifications
- 💬 **Non-Intrusive Alerts**: Clean, minimal notifications that don't block your workflow
- 🎨 **Status Types**: Success, error, warning, and info messages
- ⏱️ **Auto-Dismiss**: Notifications automatically fade after a few seconds
- 📍 **Smart Positioning**: Stay visible but out of the way
- 🎯 **Clear Feedback**: Instant confirmation of actions and operations

## 🛠️ Technical Stack

- **Frontend**: React 18
- **Backend**: Node.js with Express
- **Image Processing**: Sharp library
- **File Upload**: Multer
- **State Management**: React Context API
- **Browser AI**: TensorFlow.js with WebGL backend
- **Cloud AI**: Replicate API (Real-ESRGAN)

## 📋 Prerequisites

- Node.js (v14 or higher)
- npm or yarn

## 🚀 Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/SayandeepGit/image-upscaler.git
cd image-upscaler
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the backend directory:

```bash
cp .env.example .env
```

Edit the `.env` file as needed (default values work for local development):

```env
PORT=5000
MAX_FILE_SIZE=10485760
CORS_ORIGIN=http://localhost:3000

# Optional: Add your Replicate API token for Cloud AI upscaling
# Get yours at: https://replicate.com/account/api-tokens
REPLICATE_API_TOKEN=your_token_here
```

**Note:** Cloud AI upscaling requires a Replicate API token. You can:
- Get a free API key at [replicate.com](https://replicate.com/account/api-tokens) (50 free uses/month)
- Leave it empty to disable server-side Cloud AI (users can still provide their own keys)
- Traditional and Browser AI methods work without any API keys

### 3. Frontend Setup

```bash
cd ../frontend
npm install
```

Create a `.env` file in the frontend directory:

```bash
cp .env.example .env
```

Content should be:

```env
REACT_APP_API_URL=http://localhost:5000/api
```

## 🎮 Running the Application

### Start the Backend Server

```bash
cd backend
npm start
```

The backend server will start on `http://localhost:5000`

For development with auto-reload:

```bash
npm run dev
```

### Start the Frontend

```bash
cd frontend
npm start
```

The frontend will start on `http://localhost:3000` and open in your browser.

## 🎯 How to Use AI Upscaling

### Using Browser AI (Free & Private)
1. Upload your images
2. **Optional**: Apply filters/adjustments before processing
3. Select your desired resolution preset (2x, 4x, HD, 4K, or Custom)
4. In **Upscaling Engine**, select **Browser AI**
5. **Optional**: Adjust batch concurrency (1-5 simultaneous images)
6. Click **Process All**
7. First time: AI model will download (~5MB, cached for future use)
8. Monitor progress with real-time updates and time estimates
9. Use Pause/Resume/Cancel controls as needed
10. **Optional**: Apply filters/adjustments after processing
11. Download individual images or all as a ZIP file

**Performance Tips:**
- Models are cached automatically - subsequent uses are 5x faster!
- Check the Performance Panel to view cache status
- Use model preloading for instant processing
- Adjust concurrency based on your system capabilities

**Requirements:**
- Modern browser with WebGL support (Chrome, Firefox, Edge, Safari)
- Sufficient RAM for image processing
- Internet connection for first-time model download only

### Using Cloud AI (Best Quality)
1. Upload your images
2. **Optional**: Apply filters/adjustments before processing
3. Select your desired resolution preset (2x or 4x recommended)
4. In **Upscaling Engine**, select **Cloud AI**
5. (Optional) Enter your Replicate API key for guaranteed access
6. **Optional**: Adjust batch concurrency for optimal throughput
7. Click **Process All**
8. Monitor progress with real-time updates
9. Images are uploaded to Replicate and processed with Real-ESRGAN
10. **Optional**: Apply filters/adjustments after processing
11. Download your professionally upscaled images as individual files or ZIP

**Getting a Replicate API Key:**
1. Visit [replicate.com/account/api-tokens](https://replicate.com/account/api-tokens)
2. Sign up for a free account
3. Copy your API token
4. Paste it in the application or add to server `.env` file
5. Free tier includes 50 predictions/month

**Note:** If you don't provide an API key, the server's configured key will be used (if available).

### Using Traditional Methods (Fastest)
1. Upload your images
2. **Optional**: Apply filters/adjustments before processing
3. Select your desired resolution preset
4. In **Upscaling Engine**, select **Traditional**
5. Choose interpolation method (Lanczos recommended)
6. **Optional**: Configure batch concurrency
7. Click **Process All**
8. Monitor progress with detailed status updates
9. **Optional**: Apply filters/adjustments after processing
10. Download your upscaled images individually or as a ZIP file

## 📡 API Documentation

### Endpoints

#### Upload Single Image
```
POST /api/upload
Content-Type: multipart/form-data
Body: { image: File }
```

#### Upload Multiple Images
```
POST /api/upload-multiple
Content-Type: multipart/form-data
Body: { images: File[] }
```

#### Upscale Single Image
```
POST /api/upscale
Content-Type: application/json
Body: {
  filename: string,
  preset: '2x' | '4x' | 'HD' | '4K' | 'custom',
  method: 'nearest' | 'bilinear' | 'bicubic' | 'lanczos',
  customWidth?: number,
  customHeight?: number
}
```

#### Upscale with Cloud AI
```
POST /api/upscale/ai
Content-Type: application/json
Body: {
  filename: string,
  scale: 2 | 4,
  userApiKey?: string  // Optional user-provided Replicate API key
}
```

#### Batch Upscale
```
POST /api/batch-upscale
Content-Type: application/json
Body: {
  filenames: string[],
  preset: string,
  method: string,
  customWidth?: number,
  customHeight?: number
}
```

#### Download Image
```
GET /api/download/:filename
```

#### Download Batch as ZIP
```
POST /api/download-batch/:batchId
Content-Type: application/json
Body: { filenames: string[] }
```

#### Get File Info
```
GET /api/file-info/:filename
```

## 📁 Project Structure

```
image-upscaler/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   └── imageController.js
│   │   ├── routes/
│   │   │   └── imageRoutes.js
│   │   ├── services/
│   │   │   ├── upscaleService.js
│   │   │   └── aiUpscaleService.js
│   │   ├── middleware/
│   │   │   ├── upload.js
│   │   │   └── errorHandler.js
│   │   ├── utils/
│   │   │   └── fileManager.js
│   │   └── server.js
│   ├── uploads/ (gitignored)
│   ├── processed/ (gitignored)
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ImageUploader/
│   │   │   ├── PresetSelector/
│   │   │   ├── MethodSelector/
│   │   │   ├── BatchManager/
│   │   │   ├── PreviewComparison/
│   │   │   └── DownloadManager/
│   │   ├── contexts/
│   │   │   └── ImageContext.js
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.js
│   │   └── index.js
│   ├── public/
│   ├── package.json
│   └── .env.example
├── README.md
└── .gitignore
```

## 🔧 Configuration

### Backend Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 5000 |
| MAX_FILE_SIZE | Maximum upload file size (bytes) | 10485760 (10MB) |
| CORS_ORIGIN | Allowed CORS origin | http://localhost:3000 |
| FILE_CLEANUP_INTERVAL | Cleanup interval (ms) | 3600000 (1 hour) |
| FILE_MAX_AGE | Maximum file age before cleanup (ms) | 3600000 (1 hour) |
| REPLICATE_API_TOKEN | Replicate API token for Cloud AI (optional) | - |

### Frontend Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| REACT_APP_API_URL | Backend API URL | http://localhost:5000/api |
| REACT_APP_TF_BACKEND | TensorFlow.js backend (optional) | webgl (auto-detect) |

## 🧹 File Cleanup

The application automatically cleans up uploaded and processed files older than 1 hour. This prevents disk space issues and ensures user privacy.

## 🚀 Deployment

This application can be deployed to free hosting services - Vercel for the frontend and Render for the backend.

### Deploy Backend to Render

1. Create an account on <a href="https://render.com">Render</a>
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Render will auto-detect the `render.yaml` configuration
5. Set the `CORS_ORIGIN` environment variable (will be your Vercel frontend URL, e.g., `https://your-app.vercel.app`)
6. Click "Create Web Service"
7. Wait for the deployment to complete
8. Copy the deployed backend URL (e.g., `https://your-app.onrender.com`)

**Note**: The free tier on Render may spin down after inactivity, which can cause a delay on the first request.

### Deploy Frontend to Vercel

1. Create an account on <a href="https://vercel.com">Vercel</a>
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset**: Create React App
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`
5. Add environment variable:
   - Key: `REACT_APP_API_URL`
   - Value: `https://your-backend-url.onrender.com/api` (use the URL from Render deployment)
6. Click "Deploy"
7. Wait for the deployment to complete
8. Copy the deployed frontend URL

### Environment Variables for Production

**Backend (Render):**
- `CORS_ORIGIN`: Your Vercel frontend URL (e.g., `https://your-app.vercel.app`)
- `REPLICATE_API_TOKEN`: (Optional) Your Replicate API key for Cloud AI upscaling

**Frontend (Vercel):**
- `REACT_APP_API_URL`: Your Render backend URL with `/api` (e.g., `https://your-backend.onrender.com/api`)

### Post-Deployment Configuration

After both services are deployed, update the backend CORS settings:

1. Go back to your Render dashboard
2. Navigate to your web service
3. Go to "Environment" section
4. Update the `CORS_ORIGIN` environment variable with your Vercel frontend URL (e.g., `https://your-app.vercel.app`)
5. Save changes and the service will automatically redeploy

### Troubleshooting

**Backend Issues:**
- If images fail to process, check that Render has sufficient memory (free tier limitations may apply)
- Check Render logs for any error messages
- Verify all environment variables are set correctly

**Frontend Issues:**
- If API calls fail, verify the `REACT_APP_API_URL` is set correctly with `/api` suffix
- Check browser console for CORS errors
- Ensure the backend `CORS_ORIGIN` is set to your Vercel URL

**CORS Errors:**
- Make sure the `CORS_ORIGIN` on Render matches your Vercel URL exactly (no trailing slash)
- After updating environment variables, Render automatically redeploys

**AI Upscaling Issues:**
- Browser AI requires WebGL support - check browser compatibility
- Cloud AI requires valid Replicate API key
- If Cloud AI fails, try Browser AI or Traditional methods as alternatives

## 🔮 Future Enhancements

- [ ] Additional AI models (Waifu2x for anime, GFPGAN for faces)
- [ ] Progressive image loading and streaming
- [ ] User authentication and image history
- [ ] Cloud storage integration
- [ ] Docker containerization
- [ ] Comparison slider for before/after view

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 👤 Author

Created by [SayandeepGit](https://github.com/SayandeepGit)

## 🙏 Acknowledgments

- [Sharp](https://sharp.pixelplumbing.com/) - High-performance image processing
- [React](https://reactjs.org/) - UI framework
- [Express](https://expressjs.com/) - Backend framework
- [Multer](https://github.com/expressjs/multer) - File upload handling
- [TensorFlow.js](https://www.tensorflow.org/js) - Browser-based AI processing
- [Replicate](https://replicate.com/) - Cloud AI infrastructure
- [Real-ESRGAN](https://github.com/xinntao/Real-ESRGAN) - State-of-the-art super-resolution