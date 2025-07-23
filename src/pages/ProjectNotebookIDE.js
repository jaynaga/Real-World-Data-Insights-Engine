import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Storage } from 'aws-amplify';

export default function ProjectNotebookIDE() {
  // This component embeds a JupyterLite REPL with a notebook for the current session
  const location = useLocation();
  const notebookJson = location.state?.notebookJson;
  const notebookS3Key = location.state?.notebookS3Key;
  const [notebook, setNotebook] = useState(notebookJson || null);
  const [notebookUrl, setNotebookUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchNotebook() {
      if (notebookS3Key) {
        setLoading(true);
        setError(null);
        try {
          const file = await Storage.get(notebookS3Key, { download: true, level: 'protected' });
          const text = await file.Body.text();
          const json = JSON.parse(text);
          if (isMounted) setNotebook(json);
        } catch (err) {
          if (isMounted) setError('Failed to fetch notebook from S3.');
          console.error('Notebook fetch error:', err);
        } finally {
          if (isMounted) setLoading(false);
        }
      }
    }
    fetchNotebook();
    return () => { isMounted = false; };
  }, [notebookS3Key]);

  useEffect(() => {
    if (notebook) {
      console.log('Notebook JSON to be passed to JupyterLite:', notebook);
      const blob = new Blob([JSON.stringify(notebook)], {
        type: "application/x-ipynb+json",
      });
      const url = URL.createObjectURL(blob);
      setNotebookUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [notebook]);

  if (loading) {
    return (
      <div style={{ padding: "2rem" }}>
        <h2>Loading notebook...</h2>
      </div>
    );
  }
  if (error || !notebook) {
    return (
      <div style={{ padding: "2rem", color: "#c00" }}>
        <h2>Notebook Not Found</h2>
        <p>
          {error || 'No notebook was loaded for this session. Please return to your project page and open a notebook from the list.'}
        </p>
      </div>
    );
  }
  return (
    <div style={{ padding: "2rem" }}>
      <h2>Project Notebook IDE (Session Only)</h2>
      <p>
        This JupyterLite IDE is available for your current session. Changes will not be saved permanently. Download your notebook if you want to keep your work.
      </p>
      {notebookUrl && (
        <iframe
          src={`/jupyterlite/index.html?notebookUrl=${encodeURIComponent(notebookUrl)}`}
          title="JupyterLite IDE"
          style={{ width: "100%", height: "800px", border: "1px solid #ccc", borderRadius: "8px" }}
          allowFullScreen
        />
      )}
    </div>
  );
}
