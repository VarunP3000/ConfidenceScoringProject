import React, { useState, useEffect } from "react";
import FileUpload from "./FileUpload";
import ModelSelection from "./ModelSelection";
import "./App.css"; 

export default function App() {
  const [step, setStep] = useState(1);
  const [csvFile, setCsvFile] = useState(null);
  const [hfToken, setHfToken] = useState("");
  const [models, setModels] = useState([]);

  useEffect(() => {
    const savedFile = localStorage.getItem("csvFile");
    const savedToken = localStorage.getItem("hfToken");
    const savedModels = localStorage.getItem("models");

    if (savedFile) setCsvFile(savedFile);
    if (savedToken) setHfToken(savedToken);
    if (savedModels) setModels(JSON.parse(savedModels));
  }, []);

  const handleFileSave = (file, token) => {
    setCsvFile(file);
    setHfToken(token);
    localStorage.setItem("csvFile", file);
    localStorage.setItem("hfToken", token);
  };

  const handleNext = () => {
    if (csvFile && hfToken) {
      setStep(2);
    } else {
      alert("Please save your file and token before proceeding.");
    }
  };

  const handleModelSave = (selectedModels) => {
    setModels(selectedModels);
    localStorage.setItem("models", JSON.stringify(selectedModels));
  };

  const handleSubmit = async () => {
    if (!csvFile || !hfToken || models.length === 0) {
      alert("Please ensure you have uploaded a file, entered the token, and selected at least one model.");
      return;
    }

    const formData = new FormData();
    formData.append("csvFile", csvFile);
    formData.append("hfToken", hfToken);
    models.forEach((model, index) => {
      formData.append("modelNames", model.name);
      formData.append("confidenceScores", model.confidenceScore || "0.5");
    });

    try {
      const response = await fetch("http://127.0.0.1:5000/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        alert("File processed successfully! Output saved.");
        console.log("Response:", data);
      } else {
        alert(`Error: ${data.error}`);
        console.error("Error response:", data);
      }
    } catch (error) {
      alert("An error occurred while submitting the data.");
      console.error("Submit error:", error);
    }
  };

  return (
    <div className="app-container">
      <header className="top-bar">Confidence Scoring Project</header>
      <main className="content">
        <div className="section-container">
          {step === 1 ? (
            <div className="file-upload">
              <FileUpload onSave={handleFileSave} onNext={handleNext} savedFile={csvFile} savedToken={hfToken} />
            </div>
          ) : (
            <div className="model-selection">
              <ModelSelection onSave={handleModelSave} onBack={() => setStep(1)} onSubmit={handleSubmit} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
