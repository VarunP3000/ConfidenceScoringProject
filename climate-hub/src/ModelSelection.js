import React, { useEffect, useState, useContext } from 'react';
import { GlobalContext } from './GlobalContext';
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Select } from "./components/ui/select";
import { Plus, ArrowLeft, ArrowRight, X } from 'lucide-react';
import './ModelSelection.css';

const modelOptions = {
  small: [
    'meta-llama/Meta-Llama-3.3-8B-Instruct',
    'mistralai/Mistral-7B-Instruct-v0.3',
    'gemma/Gemma-2-6B',
    'google/flan-t5-small'
  ],
  medium: [
    'google/flan-ul2',
    'openai/phi-3.5',
    'qwen/Qwen-2-7B'
  ],
  large: [
    'openai/gpt-4',
    'anthropic/claude-v2',
    'deepseek/DeepSeek-20B'
  ]
};

export default function ModelSelection({ onBack, onSubmit }) {
  const { setModels } = useContext(GlobalContext); // only used on save
  const [localModels, setLocalModels] = useState([]);

  useEffect(() => {
    const modelsWereSaved = localStorage.getItem("modelsWereSaved") === "true";
    const savedModels = localStorage.getItem("models");

    if (modelsWereSaved && savedModels) {
      try {
        const parsed = JSON.parse(savedModels);
        if (Array.isArray(parsed)) {
          setLocalModels(parsed);
          return;
        }
      } catch (err) {
        console.error("Failed to parse saved models:", err);
      }
    }

    // fallback: default empty input row
    setLocalModels([{ name: '', confidence: '', level: 'small' }]);
  }, []);

  const addModel = () => {
    const lastLevel = localModels[localModels.length - 1]?.level || 'small';
    const nextLevel = lastLevel === 'small' ? 'medium' : 'large';
    setLocalModels([...localModels, { name: '', confidence: '', level: nextLevel }]);
  };

  const updateModel = (index, field, value) => {
    const updated = [...localModels];
    updated[index][field] = value;
    setLocalModels(updated);
  };

  const removeModel = (index) => {
    setLocalModels(localModels.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    localStorage.setItem("models", JSON.stringify(localModels));
    localStorage.setItem("modelsWereSaved", "true");
    setModels(localModels); // only update context on Save
    alert("Models saved.");
  };

  const handleSubmit = () => {
    onSubmit(localModels); // don't update context here
  };

  return (
    <div className="model-selection-container">
      <h1>Select Models and Confidence Scores</h1>
      <p>Choose models and assign scores to ensemble them effectively.</p>

      {localModels.map((model, index) => (
        <div key={index} className="model-row">
          <div className="model-inputs">
            <Select
              className="select-model"
              value={model.name}
              onChange={(e) => updateModel(index, 'name', e.target.value)}
            >
              <option value="" disabled>Select Model</option>
              {modelOptions[model.level].map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>

            <Input
              className="confidence-input"
              type="number"
              placeholder="Confidence Score"
              value={model.confidence}
              onChange={(e) => updateModel(index, 'confidence', e.target.value)}
              min="0"
              max="1"
              step="0.01"
            />
          </div>

          {localModels.length > 1 && (
            <button
              className="remove-model-button"
              onClick={() => removeModel(index)}
              title="Remove Model"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      ))}

      {localModels.length < 3 && (
        <Button onClick={addModel} className="add-model-button mt-4">
          <Plus className="w-4 h-4 mr-2" />
          Add Model
        </Button>
      )}

      <div className="button-group mt-6">
        <Button onClick={onBack} className="primary-button">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <Button onClick={handleSave} className="primary-button">
          Save
        </Button>
        <Button onClick={handleSubmit} className="primary-button">
          Submit <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
