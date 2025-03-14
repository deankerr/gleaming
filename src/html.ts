import { ImageMetadata } from './types'

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
    .status {
      margin-top: 1rem;
      padding: 1rem;
      border-radius: 6px;
    }
    .status.error {
      background-color: #ffebee;
      color: #c62828;
    }
    .status.success {
      background-color: #e8f5e9;
      color: #2e7d32;
    }
    .preview {
      margin-top: 1.5rem;
      text-align: left;
    }
    .preview img {
      max-width: 100%;
      max-height: 300px;
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    .meta {
      margin-top: 1rem;
      font-size: 0.9rem;
      color: #666;
    }
    .gallery-link {
      display: block;
      margin-top: 2rem;
      color: #0070f3;
      text-decoration: none;
    }
    .gallery-link:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <h1>Image Upload</h1>
  <div class="upload-container" id="dropzone">
    <p>Drag and drop an image here or</p>
    <input type="file" id="fileInput" class="file-input" accept="image/*">
    <button class="upload-btn" id="selectFileBtn">Select File</button>
    <div id="status" class="status" style="display: none;"></div>
    <div id="preview" class="preview" style="display: none;">
      <img id="previewImage" src="" alt="Preview">
      <div id="meta" class="meta"></div>
    </div>
  </div>
  
  <a href="/admin/images" class="gallery-link">View Image Gallery</a>

  <script>
    document.addEventListener('DOMContentLoaded', () => {
      const dropzone = document.getElementById('dropzone');
      const fileInput = document.getElementById('fileInput');
      const selectFileBtn = document.getElementById('selectFileBtn');
      const statusDiv = document.getElementById('status');
      const previewDiv = document.getElementById('preview');
      const previewImage = document.getElementById('previewImage');
      const metaDiv = document.getElementById('meta');

      // Handle file selection
      selectFileBtn.addEventListener('click', () => {
        fileInput.click();
      });

      // Handle file selection
      fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          handleFile(file);
        }
      });

      // Handle drag and drop
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
        
        if (e.dataTransfer.files.length) {
          const file = e.dataTransfer.files[0];
          handleFile(file);
        }
      });

      // Handle the selected file
      function handleFile(file) {
        // Reset status
        statusDiv.style.display = 'none';
        statusDiv.className = 'status';
        statusDiv.textContent = '';

        // Validate file
        if (!file.type.startsWith('image/')) {
          showError('Please select an image file.');
          return;
        }

        // Show preview
        const reader = new FileReader();
        reader.onload = (e) => {
          previewImage.src = e.target.result;
          previewDiv.style.display = 'block';
          metaDiv.textContent = \`\${file.name} (\${(file.size / 1024).toFixed(2)} KB)\`;
        };
        reader.readAsDataURL(file);

        // Upload the file
        uploadFile(file);
      }

      // Upload file to server
      async function uploadFile(file) {
        const formData = new FormData();
        formData.append('file', file);

        try {
          const response = await fetch('/api/v1/images/upload', {
            method: 'POST',
            body: formData
          });

          const data = await response.json();

          if (data.success) {
            showSuccess('Upload successful! Image ID: ' + data.image.id);
            // Add link to the image
            const link = document.createElement('a');
            link.href = data.image.url;
            link.textContent = 'View Uploaded Image';
            link.target = '_blank';
            link.className = 'gallery-link';
            metaDiv.appendChild(document.createElement('br'));
            metaDiv.appendChild(link);
          } else {
            showError(data.error || 'Upload failed.');
          }
        } catch (error) {
          showError('Upload failed: ' + error.message);
        }
      }

      function showError(message) {
        statusDiv.className = 'status error';
        statusDiv.textContent = message;
        statusDiv.style.display = 'block';
      }

      function showSuccess(message) {
        statusDiv.className = 'status success';
        statusDiv.textContent = message;
        statusDiv.style.display = 'block';
      }
    });
  </script>
</body>
</html>
  `
}

/**
 * HTML template for the gallery page
 */
export function galleryHtml(images: ImageMetadata[]): string {
  const imageItems = images
    .map(
      (image) => `
    <div class="image-item">
      <a href="${image.url}" target="_blank">
        <img src="${image.url}" alt="${image.filename}">
      </a>
      <div class="image-info">
        <div class="image-name">${image.filename}</div>
        <div class="image-meta">
          <span>${new Date(image.uploadedAt).toLocaleString()}</span>
          <span>${(image.size / 1024).toFixed(2)} KB</span>
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
    .images-container {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 1.5rem;
    }
    .image-item {
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      transition: transform 0.2s;
    }
    .image-item:hover {
      transform: translateY(-5px);
    }
    .image-item img {
      width: 100%;
      height: 200px;
      object-fit: cover;
      display: block;
    }
    .image-info {
      padding: 1rem;
    }
    .image-name {
      font-weight: 500;
      margin-bottom: 0.5rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .image-meta {
      font-size: 0.8rem;
      color: #666;
      display: flex;
      justify-content: space-between;
    }
    .upload-link {
      display: inline-block;
      margin-bottom: 2rem;
      color: #0070f3;
      text-decoration: none;
    }
    .upload-link:hover {
      text-decoration: underline;
    }
    .empty-state {
      text-align: center;
      padding: 2rem;
      background-color: #f9f9f9;
      border-radius: 8px;
    }
  </style>
</head>
<body>
  <h1>Image Gallery</h1>
  <a href="/admin" class="upload-link">Upload New Image</a>
  
  ${
    images.length > 0
      ? `<div class="images-container">${imageItems}</div>`
      : `<div class="empty-state">No images uploaded yet. <a href="/admin">Upload your first image</a>.</div>`
  }
</body>
</html>
  `
}
