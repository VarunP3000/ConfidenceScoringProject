import React, { useEffect, useState } from "react";
import { getStorage, ref, listAll, getDownloadURL } from "firebase/storage";
import { getAuth } from "firebase/auth";
import "./AnnotatedFiles.css";

export default function AnnotatedFiles() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFiles = async () => {
      console.log("Fetching annotated files...");
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        setError("User not signed in");
        setLoading(false);
        return;
      }

      try {
        const storage = getStorage();
        const folderRef = ref(storage, `annotated_files/${user.uid}`);
        const result = await listAll(folderRef);
        console.log("Files found:", result.items);

        const urls = await Promise.all(
          result.items.map(async (itemRef) => {
            const url = await getDownloadURL(itemRef);
            return { name: itemRef.name, url };
          })
        );

        setFiles(urls);
      } catch (err) {
        console.error("Failed to load files", err);
        setError("Failed to load files");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchFiles();
  }, []);

  return (
    <div className="annotated-files-container">
      <h2>Your Annotated Files</h2>
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className="error-message">{error}</p>
      ) : files.length === 0 ? (
        <p>No files found.</p>
      ) : (
        <ul className="file-list">
          {files.map((file) => (
            <li key={file.name}>
              <a href={file.url} target="_blank" rel="noopener noreferrer">
                {file.name}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
