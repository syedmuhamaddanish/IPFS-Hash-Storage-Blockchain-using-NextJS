import React, {useState, useEffect} from "react";
import styles from "./page.module.css";
import { setRequestMeta } from "next/dist/server/request-meta";

function App() {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [result, setResult] = useState("");

  useEffect(() => {}, []);

  const handleChange = (e) => {
    if(e.target.name === "filename") {
      setFileName(e.target.value);
    }
    if(e.target.name === "file") {
      setFile(e.target.files[0]);
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      var formData = new FormData();
      formData.append("filename", fileName);
      formData.append("file", file);

      const res = await fetch("/api/uploadData", {
        method: "POST",
        body: formData
      });

      if (!res.ok) {
        throw new Error("Network response is not ok");
      }
      const data = await res.json();    
      setResult(data.message);

    } catch (err) {
      console.error(err);
    }
  }

  return(
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>⁂<span>Store IPFS hash on blockchain</span>⁂</h1>
      </header>
      <form onSubmit={handleSubmit}>
        <label className={styles.lable}>Enter Unique Filename: </label>
        <input type="text" name="filename" value={fileName} onChange={handleChange} className={styles.input}></input>
        <br />
        <input type="file" name="file" onChange={handleChange} className={styles.input}></input>
        <br />
        <input type="Submit" className={styles.button}></input>
      </form>

      {result && <p className={styles.result}>{result}</p>}
    </div>
  )
}

export default App;