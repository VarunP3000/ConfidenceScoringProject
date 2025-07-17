import { useEffect, useState } from "react";
import { getStorage, ref, listAll, getDownloadURL } from "firebase/storage";
import { auth } from "../firebase";

export default function UserFiles() {
  const [fileUrls, setFileUrls] = useState([]);

  useEffect(() => {
    const fetchFiles = async () => {
      const storage = getStorage();
      const safeEmail = auth.currentUser.email.replace(/[^a-zA-Z0-9]/g, "_");
      const userRef = ref(storage, `${safeEmail}/`);

      const res = await listAll(userRef);
      const urls = await Promise.all(res.items.map((item) => getDownloadURL(item)));
      setFileUrls(urls);
    };

    fetchFiles();
  }, []);

  return (
    <div>
      <h2>Your Files</h2>
      <ul>
        {fileUrls.map((url, idx) => (
          <li key={idx}>
            <a href={url} target="_blank" rel="noreferrer">File {idx + 1}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}
