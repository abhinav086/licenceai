import React, { useState } from 'react';
import './App.css';

function MistralOCRApp() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const MISTRAL_API_KEY = '3Qti3h1R9S5DwzGIQun8f0wspDPmt4fz';
  const MISTRAL_API_URL = 'https://api.mistral.ai/v1/chat/completions';

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type.startsWith('image/')) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(selectedFile);
      setError('');
    } else {
      setError('Please select a valid image file.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('No file selected.');
      return;
    }

    setLoading(true);
    setError('');
    setResult('');

    try {
      const base64Image = await toBase64(file);
      const payload = {
        model: 'pixtral-large-latest',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Extract the license plate number from this image.' },
              { type: 'image_url', image_url: { url: base64Image } }
            ]
          }
        ],
        temperature: 0.2,
        max_tokens: 300
      };

      const response = await fetch(MISTRAL_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${MISTRAL_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok) {
        const fullText = data.choices[0].message.content.trim();
        const match = fullText.match(/[A-Z]{2}\d{2}[A-Z]{1,2}\d{4}/i); // Extracts license plate
        const plateNumber = match ? match[0].toUpperCase() : 'No plate number found';
        setResult(plateNumber);
      } else {
        setError(data.error?.message || 'Failed to process image.');
      }
    } catch (err) {
      setError('An error occurred while processing the image.');
    } finally {
      setLoading(false);
    }
  };

  const toBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });

  return (
    <div className="ocr-container">
      <div className="ocr-card">
        <h1 className="title">License Plate Extraction (AI)- BT 41033 <br /> ABHINAV & AAROHI</h1>
        
        <form onSubmit={handleSubmit} className="upload-form">
          <div className="file-upload">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              id="file-input"
              className="file-input"
            />
            <label htmlFor="file-input" className="file-label">
              {file ? file.name : 'Choose Image'}
            </label>
          </div>
          
          <button
            type="submit"
            className={`submit-btn ${loading ? 'loading' : ''}`}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Processing...
              </>
            ) : (
              'Extract Number Plate'
            )}
          </button>
        </form>

        {preview && (
          <div className="preview-section">
            <h3 className="section-title">Preview:</h3>
            <img src={preview} alt="Preview" className="preview-image" />
          </div>
        )}

        {result && (
          <div className="result-section">
            <h3 className="section-title">Extracted Text:</h3>
            <div className="result-box">
              <p className="result-text">{result}</p>
            </div>
          </div>
        )}

        {result && (
          <div className="carinfo-link-section">
            <button
              className="carinfo-btn"
              onClick={() =>
                window.location.href = `https://www.carinfo.app/rc-details/${result.replace(/\s/g, '')}`
              }
            >
              View Details of owner.
            </button>
          </div>
        )}

        {error && (
          <div className="error-section">
            <p className="error-text">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default MistralOCRApp;
