import React, { useState } from 'react';
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

export default function ModelSelection({ onSave, onBack, onSubmit }) {
  const [models, setModels] = useState([
    { name: '', confidence: '', level: 'small' }
  ]);

  const addModel = () => {
    const lastLevel = models[models.length - 1].level;
    const nextLevel = lastLevel === 'small' ? 'medium' : 'large';
    setModels([...models, { name: '', confidence: '', level: nextLevel }]);
  };

  const updateModel = (index, field, value) => {
    const newModels = [...models];
    newModels[index][field] = value;
    setModels(newModels);
  };

  const removeModel = (indexToRemove) => {
    const updatedModels = models.filter((_, idx) => idx !== indexToRemove);
    setModels(updatedModels);
  };

  return (
    <div className="p-6 space-y-6 max-w-xl mx-auto">
      <h2 className="text-xl font-bold">Select Models and Confidence Scores</h2>
      {models.map((model, index) => (
        <div key={index} className="flex items-center space-x-4 model-row">
          <Select
            value={model.name}
            onChange={(e) => updateModel(index, 'name', e.target.value)}
          >
            <option value="" disabled>Select Model</option>
            {modelOptions[model.level].map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </Select>
          <Input
            type="number"
            placeholder="Confidence Score"
            value={model.confidence}
            onChange={(e) => updateModel(index, 'confidence', e.target.value)}
          />
          {models.length > 1 && model.level !== 'small' && (
            <button
              className="remove-model-button"
              onClick={() => removeModel(index)}
              title="Remove Model"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      ))}
      {models.length < 3 && (
        <Button onClick={addModel} variant="outline" className="flex items-center">
          <Plus className="w-4 h-4 mr-2" /> Add Model
        </Button>
      )}
      <div className="flex justify-between">
        <Button onClick={onBack} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <Button onClick={() => onSave(models)} variant="secondary">Save</Button>
        <Button onClick={() => onSubmit(models)} variant="primary">
          Submit <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
