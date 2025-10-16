import React, { useEffect, useState, useContext } from "react";
import { GlobalContext } from "./GlobalContext";

export default function FileUpload({ onNext }) {
  const { csvFile: savedFile, setCsvFile, hfToken: savedToken, setHfToken } = useContext(GlobalContext);
  const [file, setFile] = useState(null);
  const [token, setToken] = useState("");

  useEffect(() => {
    if (savedFile) setFile(savedFile);
    if (savedToken) setToken(savedToken);
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

    setCsvFile(file);
    setHfToken(token);

    localStorage.setItem("hfToken", token);
    localStorage.setItem("fileWasSaved", "true");

    const reader = new FileReader();
    reader.onload = () => {
      sessionStorage.setItem("csvFileBase64", reader.result);
      sessionStorage.setItem("csvFileName", file.name);
    };
    reader.readAsDataURL(file);

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
