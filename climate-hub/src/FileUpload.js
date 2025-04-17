import React, { useState, useEffect } from 'react';
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { ArrowRight } from 'lucide-react';
import './FileUpload.css'; 

export default function FileUpload({ onSave, onNext }) {
  const [file, setFile] = useState(null);
  const [token, setToken] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const savedFile = localStorage.getItem("csvFile");
    const savedToken = localStorage.getItem("hfToken");
    if (savedFile) setFile(savedFile);
    if (savedToken) setToken(savedToken);
  }, []);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSave = () => {
    if (file && token) {
      onSave(file, token);
      setIsSaved(true);
      localStorage.setItem("csvFile", file.name);
      localStorage.setItem("hfToken", token);
    } else {
      alert("Please upload a CSV file and enter the token before saving.");
    }
  };

  const handleNext = () => {
    if (isSaved) {
      onNext();
    } else {
      alert("Please save your data before proceeding.");
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-xl mx-auto">
      <h2 className="text-xl font-bold">Upload CSV & Enter Hugging Face Token</h2>
      <Input type="file" accept=".csv" onChange={handleFileChange} />
      <Input 
        type="text" 
        placeholder="Enter Hugging Face Token" 
        value={token} 
        onChange={(e) => setToken(e.target.value)} 
      />
      <div className="flex justify-between">
        <Button onClick={handleSave} variant="secondary">Save</Button>
        <Button onClick={handleNext} variant="primary">
          Next <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
