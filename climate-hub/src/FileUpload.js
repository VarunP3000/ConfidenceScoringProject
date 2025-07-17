import React, { useState, useEffect } from "react";

export default function FileUpload({ onSave, onNext, savedFile, savedToken }) {
  const [file, setFile] = useState(null);
  const [token, setToken] = useState("");

  useEffect(() => {
    if (savedFile) {
      setFile(savedFile);
    }
    if (savedToken) {
      setToken(savedToken);
    }
  }, [savedFile, savedToken]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
  };

  const handleSave = () => {
    if (!file || !token) {
      alert("Please upload a file and enter your Hugging Face token.");
      return;
    }
    onSave(file, token);
    alert("Saved successfully.");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <h2>Upload File and Token</h2>

      {file?.name && (
        <p style={{ fontStyle: "italic", color: "#555" }}>
          Current file: {file.name}
        </p>
      )}

      <input type="file" accept=".csv" onChange={handleFileChange} />
      <input
        type="text"
        placeholder="Enter Hugging Face Token"
        value={token}
        onChange={(e) => setToken(e.target.value)}
        style={{ padding: "8px", borderRadius: "6px", border: "1px solid #ccc" }}
      />

      <div style={{ display: "flex", gap: "12px" }}>
        <button onClick={handleSave}>Save</button>
        <button onClick={onNext}>Next</button>
      </div>
    </div>
  );
}
