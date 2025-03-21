import { FC } from 'hono/jsx'

export const UploadForm: FC = () => {
  return (
    <div>
      <style>{`
        .forms-container {
          display: flex;
          gap: 24px;
          margin-bottom: 20px;
        }
        
        @media (max-width: 768px) {
          .forms-container {
            flex-direction: column;
          }
        }
        
        .form-box {
          background: white;
          padding: 24px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
          flex: 1;
        }
        
        .form-title {
          font-size: 18px;
          font-weight: 500;
          margin-bottom: 20px;
          color: #333;
          padding-bottom: 12px;
          border-bottom: 1px solid #eee;
        }
        
        .form-group {
          margin-bottom: 20px;
        }
        
        label {
          display: block;
          margin-bottom: 8px;
          font-weight: 500;
          color: #333;
        }
        
        input[type="text"],
        input[type="file"] {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 14px;
        }
        
        input[type="file"] {
          padding: 8px;
        }
        
        .button {
          background: #0066cc;
          color: white;
          border: none;
          border-radius: 6px;
          padding: 10px 16px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
        }
        
        .button:hover {
          background: #0055aa;
        }
        
        .note {
          font-size: 13px;
          color: #666;
          margin-top: 6px;
        }
      `}</style>

      <div class="forms-container">
        {/* File Upload Form */}
        <div class="form-box">
          <h2 class="form-title">File Upload</h2>
          <form action="/api/upload" method="post" enctype="multipart/form-data">
            <div class="form-group">
              <label for="file">Select Image</label>
              <input type="file" id="file" name="file" accept="image/*" required />
            </div>
            <div class="form-group">
              <label for="slug">Custom Slug (Optional)</label>
              <input type="text" id="slug" name="slug" placeholder="my-awesome-image" />
              <div class="note">A unique identifier will be prepended to your slug</div>
            </div>
            <button type="submit" class="button">
              Upload Image
            </button>
          </form>
        </div>

        {/* URL Ingestion Form */}
        <div class="form-box">
          <h2 class="form-title">URL Ingestion</h2>
          <form id="ingest-form" onsubmit="handleIngest(event)">
            <div class="form-group">
              <label for="url">Image URL</label>
              <input type="text" id="url" name="url" placeholder="https://example.com/image.jpg" required />
            </div>
            <div class="form-group">
              <label for="url-slug">Custom Slug (Optional)</label>
              <input type="text" id="url-slug" name="slug" placeholder="my-awesome-image" />
              <div class="note">A unique identifier will be prepended to your slug</div>
            </div>
            <button type="submit" class="button">
              Ingest Image
            </button>
          </form>

          <script
            dangerouslySetInnerHTML={{
              __html: `
            function handleIngest(event) {
              event.preventDefault();
              
              const url = document.getElementById('url').value;
              const slug = document.getElementById('url-slug').value;
              
              // Create the JSON payload
              const payload = { url: url };
              if (slug) {
                payload.slug = slug;
              }
              
              // Submit as JSON
              fetch('/api/ingest', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
              })
              .then(response => {
                if (response.ok) {
                  window.location.href = '/dev/gallery';
                } else {
                  return response.json().then(data => {
                    alert('Error: ' + (data.error || 'Unknown error'));
                  });
                }
              })
              .catch(error => {
                alert('Error: ' + error.message);
              });
            }
          `,
            }}
          ></script>
        </div>
      </div>
    </div>
  )
}
