import React, { useState } from "react";
import Navbar from "../components/Navbar";
import '../styles/tokens.css';

export default function Upload() {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [file, setFile] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    alert("Fake upload: " + name);
    setName("");
    setDesc("");
    setFile(null);
  };

  return (
    <>
      <Navbar />
      <div className="flex items-center justify-center min-h-screen page-bg">
        <form
          onSubmit={handleSubmit}
          className="card w-full max-w-md"
        >
          <h2 className="text-2xl font-bold mb-6 text-center text-textPrimary-light dark:text-textPrimary-dark">Upload Dataset</h2>
          <input
            className="w-full mb-4 p-2 border-default rounded"
            type="text"
            placeholder="Dataset Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <textarea
            className="w-full mb-4 p-2 border-default rounded"
            placeholder="Description"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            required
          />
          <input
            className="w-full mb-6 border-default rounded"
            type="file"
            onChange={(e) => setFile(e.target.files[0])}
          />
          <button
            type="submit"
            className="btn-accent w-full mt-2"
          >
            Upload
          </button>
        </form>
      </div>
    </>
  );
}
