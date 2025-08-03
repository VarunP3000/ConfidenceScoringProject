import React, { useEffect, useState, useContext } from "react";
import { Link, Routes, Route } from "react-router-dom";
import FileUpload from "./FileUpload";
import ModelSelection from "./ModelSelection";
import { auth } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import Login from "./auth/Login";
import SignUp from "./auth/SignUp";
import Home from "./Home";
import AnnotatedFiles from "./annotated_files/AnnotatedFiles";
import { GlobalProvider, GlobalContext } from "./GlobalContext";
import "./App.css";

function AppContent() {
  const {
    csvFile, setCsvFile,
    hfToken, setHfToken,
    models, setModels,
    downloadUrl, setDownloadUrl
  } = useContext(GlobalContext);

  const [step, setStep] = useState(1);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
    });

    // ✅ Only restore token and file if user explicitly saved
    const savedToken = localStorage.getItem("hfToken");
    const tokenSaved = localStorage.getItem("fileWasSaved") === "true";
    if (savedToken && tokenSaved && typeof setHfToken === "function") {
      setHfToken(savedToken);
    }

    const base64 = sessionStorage.getItem("csvFileBase64");
    const name = sessionStorage.getItem("csvFileName");
    if (base64 && name && tokenSaved && typeof setCsvFile === "function") {
      const byteString = atob(base64.split(',')[1]);
      const mimeString = base64.split(',')[0].split(':')[1].split(';')[0];
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      const restoredFile = new File([ab], name, { type: mimeString });
      setCsvFile(restoredFile);
    }

    // ✅ Only restore models if user explicitly saved
    const savedModels = localStorage.getItem("models");
    const modelsSaved = localStorage.getItem("modelsWereSaved") === "true";
    if (savedModels && modelsSaved && typeof setModels === "function") {
      setModels(JSON.parse(savedModels));
    }

    return () => unsubscribe();
  }, [setCsvFile, setHfToken, setModels]);

  const handleSubmit = async () => {
    if (!csvFile || !hfToken || models.length === 0) {
      alert("Please ensure you have uploaded a file, entered the token, and selected at least one model.");
      return;
    }

    const formData = new FormData();
    formData.append("csvFile", csvFile);
    formData.append("hfToken", hfToken);

    models.forEach((model) => {
      formData.append("modelNames", model.name);
      formData.append("confidenceScores", model.confidenceScore || "0.5");
    });

    if (user) {
      const idToken = await user.getIdToken();
      formData.append("firebaseIdToken", idToken);
    }

    try {
      const response = await fetch("http://127.0.0.1:5000/upload", {
        method: "POST",
        body: formData,
      });

      const contentType = response.headers.get("Content-Type");

      if (response.ok && contentType && contentType.includes("text/csv")) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        setDownloadUrl(url);
        window.open(url, "_blank");
      } else {
        const text = await response.text();
        alert(`Error: ${text}`);
        console.error("Error response:", text);
      }
    } catch (error) {
      alert("An error occurred while submitting the data.");
      console.error("Submit error:", error);
    }
  };

  const handleSignOut = () => {
    signOut(auth)
      .then(() => setUser(null))
      .catch((error) => console.error("Sign out error:", error));
  };

  return (
    <div className="app-container">
      <header className="top-bar">
        <div className="left-nav">
          <Link to="/" className="logo">Confidence Scorer</Link>
          <Link to="/get-started" className="nav-button">Get Started</Link>
        </div>
        <div className="right-nav">
          {user ? (
            <>
              <div className="user-email">{user.displayName || user.email}</div>
              <Link to="/annotated-files" className="auth-link">Annotated Files</Link>
              <button onClick={handleSignOut} className="signout-button">Sign Out</button>
            </>
          ) : (
            <>
              <Link to="/login" className="auth-link">Log In</Link>
              <Link to="/signup" className="auth-link">Sign Up</Link>
            </>
          )}
        </div>
      </header>

      <main className="content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/get-started" element={
            <div className="section-container">
              {step === 1 ? (
                <div className="file-upload">
                  <FileUpload onNext={() => setStep(2)} />
                </div>
              ) : (
                <div className="model-selection">
                  <ModelSelection
                    onBack={() => setStep(1)}
                    onSubmit={handleSubmit}
                  />
                  {downloadUrl && (
                    <div style={{ marginTop: '20px', textAlign: 'center' }}>
                      <a href={downloadUrl} download="annotated_data.csv">
                        <button>Download Output</button>
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          } />
          <Route path="/annotated-files" element={<AnnotatedFiles />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <GlobalProvider>
      <AppContent />
    </GlobalProvider>
  );
}
