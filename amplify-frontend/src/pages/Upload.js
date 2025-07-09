import React, { useState } from "react";

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
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded shadow-md w-full max-w-md"
      >
        <h2 className="text-2xl font-bold mb-6 text-center">Upload Dataset</h2>
        <input
          className="w-full mb-4 p-2 border rounded"
          type="text"
          placeholder="Dataset Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <textarea
          className="w-full mb-4 p-2 border rounded"
          placeholder="Description"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          required
        />
        <input
          className="w-full mb-6"
          type="file"
          onChange={(e) => setFile(e.target.files[0])}
        />
        <button
          className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
          type="submit"
        >
          Upload
        </button>
      </form>
    </div>
  );
}
