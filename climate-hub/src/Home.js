// src/Home.js
import React from "react";
import { Link } from "react-router-dom";
import "./Home.css";

export default function Home() {
  return (
    <div className="home-container">
      <section className="hero">
        <h1 className="hero-title">Confidence Scorer</h1>
        <p className="hero-subtitle">Run ensemble predictions with your own models, your own data.</p>
        <Link to="/get-started" className="cta-button">Get Started</Link>
      </section>

      <section className="instructions">
        <h2>How it works</h2>
        <div className="steps">
          <div className="step">
            <h3>1. Upload</h3>
            <p>Upload your CSV file and Hugging Face token to begin.</p>
          </div>
          <div className="step">
            <h3>2. Select Models</h3>
            <p>Choose which models to run and assign confidence scores.</p>
          </div>
          <div className="step">
            <h3>3. Submit</h3>
            <p>Send everything to the server and download your predictions.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
