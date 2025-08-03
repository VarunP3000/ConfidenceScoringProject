import React, { createContext, useState } from 'react';

export const GlobalContext = createContext();

export const GlobalProvider = ({ children }) => {
  const [csvFile, setCsvFile] = useState(null);
  const [hfToken, setHfToken] = useState('');
  const [models, setModels] = useState([]);
  const [downloadUrl, setDownloadUrl] = useState(null);

  return (
    <GlobalContext.Provider value={{
      csvFile, setCsvFile,
      hfToken, setHfToken,
      models, setModels,
      downloadUrl, setDownloadUrl
    }}>
      {children}
    </GlobalContext.Provider>
  );
};
