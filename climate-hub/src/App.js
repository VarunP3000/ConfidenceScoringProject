import './App.css';
import { useDropzone } from 'react-dropzone'; 
import React, { useState } from 'react';  

function App() {
  const [file, setFile] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [hfToken, setHfToken] = useState(''); // State for HuggingFace token
  const [successMessage, setSuccessMessage] = useState('');

  // Handle file drop
  const onDrop = (acceptedFiles) => {
    if (acceptedFiles[0]?.type !== 'text/csv') {
      setErrorMessage('Only CSV files are allowed.');
      setFile(null);
      return;
    }
    setFile(acceptedFiles[0]);
    setErrorMessage('');
    setSuccessMessage('');
  };

  // Handle token input change
  const handleTokenInputChange = (event) => {
    setHfToken(event.target.value);
  };

  // Send form to back end
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!file || !hfToken) {
      setErrorMessage("Please input both a CSV file and a token.");
      return;
    }

    const formData = new FormData();
    formData.append('csvFile', file);
    formData.append('hfToken', hfToken);

    try {
      const response = await fetch('http://localhost:5000/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        setSuccessMessage(result.message || 'File uploaded successfully!');
        setErrorMessage('');
      } else {
        const result = await response.json();
        setErrorMessage(result.error || 'An unknown error occurred.');
        setSuccessMessage('');
      }

    } catch (error) {
      console.error('Error:', error);
      setErrorMessage('Error uploading the file.');
      setSuccessMessage('');
    }
  };

  // Setup drag-and-drop functionality
  const { getRootProps, getInputProps } = useDropzone({
    accept: '.csv',
    onDrop,
  });

  return (
    <div>
      <nav className="navbar">
        <div className="navbar__container">
            <a href="" id="navbar__logo">NAME</a>
            <div className="navbar__toggle" id="mobile-menu">
                <span className="bar"></span>
                <span className="bar"></span>
                <span className="bar"></span>
            </div>
            <ul className="navbar__menu">
                <li className="navbar__item">
                    <a href="/" className="navbar__links">Home</a>
                </li>
                <li className="navbar__item">
                    <a href="/resources.html" className="navbar__links">Resources</a>
                </li>
                <li className="navbar__btn">
                    <a href="/LogIn.html" className="button"> Log In </a>
                </li>
            </ul>
        </div>
      </nav>
      <div className="main">
        <div className="main__container">
          <div className="main__content">
            <h1>Data Annotator</h1>    
            {/* Drag-and-drop area */}
            <div className="dropzone" {...getRootProps({ className: 'dropzone' })}>
              <input {...getInputProps()} />
              <p>Drag & drop a CSV file here, or click to select one</p>
            </div>
            {file && (
              <div className="file-info">
                <p>Selected file: {file.name}</p>
              </div>
            )}
            {/* HuggingFace token input */}
            <div className="input-section">
              <label htmlFor="hfToken">Enter HuggingFace API Token:</label>
              <input
                type="text"
                id="hfToken"
                value={hfToken}
                onChange={handleTokenInputChange}
                placeholder="Enter your HuggingFace token"
              />
            </div>
            {/* Submit button */}
            <button onClick={handleSubmit} className="submit-btn">Submit</button>
            {successMessage && <div className="success-message">{successMessage}</div>}
            {errorMessage && <div className="error-message">{errorMessage}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
