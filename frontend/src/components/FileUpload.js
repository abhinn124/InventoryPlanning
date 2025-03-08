import React, { useState } from 'react';
import { uploadFile } from '../services/api';

function FileUpload() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [result, setResult] = useState(null);

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      const data = await uploadFile(selectedFile);
      setResult(data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <h2>Upload an Inventory Workbook</h2>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleUpload}>Upload</button>
      {result && (
        <div>
          <p>Is Inventory Planning?: {result.is_inventory_planning ? 'Yes' : 'No'}</p>
          <p>Confidence: {result.confidence}</p>
          <p>Justification: {result.justification}</p>
        </div>
      )}
    </div>
  );
}

export default FileUpload;
