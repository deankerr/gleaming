import { ImageMetadata } from '../types'

/**
 * HTML template for the upload form page
 */
export function uploadFormHtml(): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Image Upload</title>
  <style>
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.5;
      max-width: 800px;
      margin: 0 auto;
      padding: 1rem;
      color: #1a1a1a;
    }
    h1 {
      font-size: 1.8rem;
      margin-bottom: 1.5rem;
    }
    .upload-container {
      border: 2px dashed #ccc;
      border-radius: 8px;
      padding: 2rem;
      text-align: center;
      margin-bottom: 2rem;
      background-color: #f9f9f9;
    }
    .upload-container.drag-over {
      border-color: #0070f3;
      background-color: rgba(0, 112, 243, 0.05);
    }
    .file-input {
      display: none;
    }
    .upload-btn {
      background-color: #0070f3;
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 6px;
      font-weight: 500;
      cursor: pointer;
      transition: background-color 0.2s;
    }
    .upload-btn:hover {
      background-color: #0060df;
    }
    .upload-btn:disabled {
      background-color: #ccc;
      cursor: not-allowed;
    }
    .preview-container {
      margin-top: 1.5rem;
      display: none;
    }
    .preview-container.visible {
      display: block;
    }
    .preview-image {
      max-width: 100%;
      max-height: 300px;
      border-radius: 4px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    .preview-info {
      margin-top: 0.75rem;
      font-size: 0.9rem;
      color: #666;
    }
    .progress-container {
      margin-top: 1rem;
      display: none;
    }
    .progress-container.visible {
      display: block;
    }
    .progress-bar {
      height: 8px;
      background-color: #eee;
      border-radius: 4px;
      overflow: hidden;
    }
    .progress-fill {
      height: 100%;
      background-color: #0070f3;
      width: 0%;
      transition: width 0.3s;
    }
    .result-container {
      margin-top: 1.5rem;
      padding: 1rem;
      border-radius: 8px;
      background-color: #f0f9ff;
      border: 1px solid #cce5ff;
      display: none;
    }
    .result-container.visible {
      display: block;
    }
    .result-container.error {
      background-color: #fff5f5;
      border-color: #fed7d7;
    }
    .result-title {
      font-weight: 600;
      margin-bottom: 0.5rem;
    }
    .result-url {
      word-break: break-all;
      font-family: monospace;
      padding: 0.5rem;
      background-color: rgba(255, 255, 255, 0.5);
      border-radius: 4px;
      margin-top: 0.5rem;
    }
    .copy-btn {
      background-color: #f0f0f0;
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 0.25rem 0.5rem;
      font-size: 0.8rem;
      cursor: pointer;
      margin-top: 0.5rem;
    }
    .copy-btn:hover {
      background-color: #e0e0e0;
    }
    .nav-links {
      margin-bottom: 1.5rem;
    }
    .nav-links a {
      margin-right: 1rem;
      color: #0070f3;
      text-decoration: none;
    }
    .nav-links a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="nav-links">
    <a href="/admin">Upload</a>
    <a href="/admin/images">Gallery</a>
  </div>

  <h1>Upload Image</h1>
  
  <div class="upload-container" id="dropzone">
    <p>Drag and drop an image here, or click to select a file</p>
    <input type="file" id="fileInput" class="file-input" accept="image/*">
    <button class="upload-btn" id="selectBtn">Select Image</button>
    
    <div class="preview-container" id="previewContainer">
      <img id="previewImage" class="preview-image" src="" alt="Preview">
      <div class="preview-info" id="previewInfo"></div>
    </div>
    
    <div class="progress-container" id="progressContainer">
      <div class="progress-bar">
        <div class="progress-fill" id="progressFill"></div>
      </div>
    </div>
  </div>
  
  <button class="upload-btn" id="uploadBtn" disabled>Upload Image</button>
  
  <div class="result-container" id="resultContainer">
    <div class="result-title" id="resultTitle">Upload Successful</div>
    <div id="resultMessage"></div>
    <div class="result-url" id="resultUrl"></div>
    <button class="copy-btn" id="copyBtn">Copy URL</button>
  </div>

  <script>
    document.addEventListener('DOMContentLoaded', () => {
      const dropzone = document.getElementById('dropzone');
      const fileInput = document.getElementById('fileInput');
      const selectBtn = document.getElementById('selectBtn');
      const uploadBtn = document.getElementById('uploadBtn');
      const previewContainer = document.getElementById('previewContainer');
      const previewImage = document.getElementById('previewImage');
      const previewInfo = document.getElementById('previewInfo');
      const progressContainer = document.getElementById('progressContainer');
      const progressFill = document.getElementById('progressFill');
      const resultContainer = document.getElementById('resultContainer');
      const resultTitle = document.getElementById('resultTitle');
      const resultMessage = document.getElementById('resultMessage');
      const resultUrl = document.getElementById('resultUrl');
      const copyBtn = document.getElementById('copyBtn');
      
      let selectedFile = null;
      
      // Handle file selection
      const handleFileSelect = (file) => {
        if (!file || !file.type.startsWith('image/')) {
          alert('Please select a valid image file');
          return;
        }
        
        selectedFile = file;
        uploadBtn.disabled = false;
        
        // Show preview
        const reader = new FileReader();
        reader.onload = (e) => {
          previewImage.src = e.target.result;
          previewContainer.classList.add('visible');
          
          // Display file info
          const size = (file.size / 1024).toFixed(2);
          previewInfo.textContent = \`\${file.name} (\${size} KB)\`;
        };
        reader.readAsDataURL(file);
      };
      
      // Event listeners
      selectBtn.addEventListener('click', () => fileInput.click());
      
      fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
          handleFileSelect(e.target.files[0]);
        }
      });
      
      // Drag and drop
      dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('drag-over');
      });
      
      dropzone.addEventListener('dragleave', () => {
        dropzone.classList.remove('drag-over');
      });
      
      dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('drag-over');
        
        if (e.dataTransfer.files.length > 0) {
          handleFileSelect(e.dataTransfer.files[0]);
        }
      });
      
      // Upload functionality
      uploadBtn.addEventListener('click', async () => {
        if (!selectedFile) return;
        
        // Reset UI
        resultContainer.classList.remove('visible', 'error');
        progressContainer.classList.add('visible');
        uploadBtn.disabled = true;
        
        // Create FormData
        const formData = new FormData();
        formData.append('file', selectedFile);
        
        try {
          // Simulate progress
          let progress = 0;
          const progressInterval = setInterval(() => {
            progress += 5;
            if (progress > 90) clearInterval(progressInterval);
            progressFill.style.width = \`\${progress}%\`;
          }, 100);
          
          // Upload file
          const response = await fetch('/api/v1/images/upload', {
            method: 'POST',
            body: formData
          });
          
          clearInterval(progressInterval);
          progressFill.style.width = '100%';
          
          const result = await response.json();
          
          if (result.success) {
            // Show success
            resultContainer.classList.add('visible');
            resultTitle.textContent = 'Upload Successful';
            resultMessage.textContent = result.message || 'Image uploaded successfully';
            resultUrl.textContent = result.image.url;
          } else {
            // Show error
            resultContainer.classList.add('visible', 'error');
            resultTitle.textContent = 'Upload Failed';
            resultMessage.textContent = result.error || 'Failed to upload image';
            resultUrl.textContent = '';
          }
        } catch (error) {
          // Show error
          resultContainer.classList.add('visible', 'error');
          resultTitle.textContent = 'Upload Failed';
          resultMessage.textContent = 'An error occurred during upload';
          resultUrl.textContent = '';
          console.error('Upload error:', error);
        } finally {
          progressContainer.classList.remove('visible');
          uploadBtn.disabled = false;
        }
      });
      
      // Copy URL functionality
      copyBtn.addEventListener('click', () => {
        const url = resultUrl.textContent;
        if (!url) return;
        
        navigator.clipboard.writeText(url)
          .then(() => {
            copyBtn.textContent = 'Copied!';
            setTimeout(() => {
              copyBtn.textContent = 'Copy URL';
            }, 2000);
          })
          .catch(err => {
            console.error('Failed to copy:', err);
          });
      });
    });
  </script>
</body>
</html>
  `
}

/**
 * HTML template for the image gallery page
 */
export function galleryHtml(images: ImageMetadata[]): string {
  const imageItems = images
    .map(
      (img) => `
    <div class="image-item">
      <div class="image-container">
        <img src="${img.url}" alt="${img.filename}" loading="lazy">
      </div>
      <div class="image-info">
        <div class="image-filename">${img.filename}</div>
        <div class="image-meta">
          ${img.width && img.height ? `${img.width}×${img.height} • ` : ''}
          ${formatFileSize(img.size)}
        </div>
        <div class="image-actions">
          <button class="copy-btn" data-url="${img.url}">Copy URL</button>
          <a href="${img.url}" target="_blank" class="view-btn">View</a>
        </div>
      </div>
    </div>
  `,
    )
    .join('')

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Image Gallery</title>
  <style>
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.5;
      max-width: 1200px;
      margin: 0 auto;
      padding: 1rem;
      color: #1a1a1a;
    }
    h1 {
      font-size: 1.8rem;
      margin-bottom: 1.5rem;
    }
    .nav-links {
      margin-bottom: 1.5rem;
    }
    .nav-links a {
      margin-right: 1rem;
      color: #0070f3;
      text-decoration: none;
    }
    .nav-links a:hover {
      text-decoration: underline;
    }
    .gallery {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 1.5rem;
    }
    .image-item {
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .image-item:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
    .image-container {
      height: 200px;
      overflow: hidden;
      background-color: #f5f5f5;
      position: relative;
    }
    .image-container img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s;
    }
    .image-item:hover .image-container img {
      transform: scale(1.05);
    }
    .image-info {
      padding: 0.75rem;
      background-color: white;
    }
    .image-filename {
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-bottom: 0.25rem;
    }
    .image-meta {
      font-size: 0.8rem;
      color: #666;
      margin-bottom: 0.5rem;
    }
    .image-actions {
      display: flex;
      gap: 0.5rem;
    }
    .copy-btn, .view-btn {
      font-size: 0.8rem;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      cursor: pointer;
      flex: 1;
      text-align: center;
    }
    .copy-btn {
      background-color: #f0f0f0;
      border: 1px solid #ddd;
      color: #333;
    }
    .copy-btn:hover {
      background-color: #e0e0e0;
    }
    .view-btn {
      background-color: #0070f3;
      border: 1px solid #0070f3;
      color: white;
      text-decoration: none;
    }
    .view-btn:hover {
      background-color: #0060df;
    }
    .empty-gallery {
      text-align: center;
      padding: 3rem;
      background-color: #f9f9f9;
      border-radius: 8px;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="nav-links">
    <a href="/admin">Upload</a>
    <a href="/admin/images">Gallery</a>
  </div>

  <h1>Image Gallery</h1>
  
  ${
    images.length > 0
      ? `<div class="gallery">${imageItems}</div>`
      : `<div class="empty-gallery">
           <p>No images found. Upload some images to see them here.</p>
           <a href="/admin" class="view-btn">Upload Images</a>
         </div>`
  }

  <script>
    document.addEventListener('DOMContentLoaded', () => {
      // Copy URL functionality
      document.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const url = btn.getAttribute('data-url');
          if (!url) return;
          
          navigator.clipboard.writeText(url)
            .then(() => {
              btn.textContent = 'Copied!';
              setTimeout(() => {
                btn.textContent = 'Copy URL';
              }, 2000);
            })
            .catch(err => {
              console.error('Failed to copy:', err);
            });
        });
      });
    });
  </script>
</body>
</html>
  `
}

/**
 * Format file size in a human-readable format
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`
  } else if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  } else {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }
}
