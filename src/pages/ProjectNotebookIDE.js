import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Storage } from 'aws-amplify';

export default function ProjectNotebookIDE() {
  const location = useLocation();
  const notebookJson = location.state?.notebookJson;
  const notebookS3Key = location.state?.notebookS3Key;
  const [notebook, setNotebook] = useState(notebookJson || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasDownloaded, setHasDownloaded] = useState(false);

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

  const downloadNotebook = () => {
    if (!notebook) return;
    
    const notebookName = notebookS3Key 
      ? notebookS3Key.split('/').pop() 
      : 'notebook.ipynb';
    
    const blob = new Blob([JSON.stringify(notebook, null, 2)], {
      type: "application/x-ipynb+json",
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = notebookName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setHasDownloaded(true);
  };

  const openJupyterLite = () => {
    // Download the notebook first
    downloadNotebook();
    
    // Open JupyterLite in a new tab
    setTimeout(() => {
      window.open('/jupyterlite/index.html', '_blank', 'noopener,noreferrer');
    }, 500); // Small delay to ensure download starts
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto" }}>
      <h2>Open Notebook in JupyterLite</h2>
      
      {loading && (
        <div style={{ padding: "2rem", textAlign: "center" }}>
          <h3>Loading notebook...</h3>
        </div>
      )}
      
      {error && (
        <div style={{ padding: "2rem", color: "#c00", border: "1px solid #c00", borderRadius: "8px", backgroundColor: "#ffeaea" }}>
          <h3>Notebook Not Found</h3>
          <p>{error}</p>
        </div>
      )}
      
      {notebook && !loading && (
        <div>
          {/* Notebook info */}
          <div style={{ marginBottom: "2rem", padding: "1.5rem", backgroundColor: "#f8f9fa", borderRadius: "8px", border: "1px solid #e9ecef" }}>
            <h3 style={{ margin: "0 0 1rem 0", color: "#495057" }}>📓 Notebook Ready</h3>
            <p style={{ margin: "0.5rem 0", color: "#6c757d" }}>
              <strong>Cells:</strong> {notebook.cells?.length || 0} cells
            </p>
            <p style={{ margin: "0.5rem 0", color: "#6c757d" }}>
              <strong>File:</strong> {notebookS3Key ? notebookS3Key.split('/').pop() : 'notebook.ipynb'}
            </p>
          </div>

          {/* Instructions */}
          <div style={{ marginBottom: "2rem", padding: "1.5rem", backgroundColor: "#e3f2fd", borderRadius: "8px", border: "1px solid #bbdefb" }}>
            <h3 style={{ margin: "0 0 1rem 0", color: "#1565c0" }}>🚀 How to use your notebook:</h3>
            <ol style={{ margin: "0.5rem 0", paddingLeft: "1.5rem", color: "#1976d2" }}>
              <li style={{ margin: "0.5rem 0" }}>Click the button below to download your notebook file and open JupyterLite</li>
              <li style={{ margin: "0.5rem 0" }}>In JupyterLite, go to the file browser (folder icon in left sidebar)</li>
              <li style={{ margin: "0.5rem 0" }}>Click the upload button (arrow up icon) and select your downloaded notebook file</li>
              <li style={{ margin: "0.5rem 0" }}>Double-click the uploaded notebook to open and run it!</li>
            </ol>
          </div>

          {/* Action button */}
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <button
              onClick={openJupyterLite}
              style={{
                padding: "1rem 2rem",
                fontSize: "1.1rem",
                fontWeight: "bold",
                color: "white",
                backgroundColor: "#2196f3",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = "#1976d2"}
              onMouseOut={(e) => e.target.style.backgroundColor = "#2196f3"}
            >
              📥 Download Notebook & Open JupyterLite
            </button>
          </div>

          {/* Additional info */}
          {hasDownloaded && (
            <div style={{ padding: "1rem", backgroundColor: "#e8f5e8", borderRadius: "8px", border: "1px solid #4caf50", textAlign: "center" }}>
              <p style={{ margin: 0, color: "#2e7d32" }}>
                ✅ Notebook downloaded! Upload it in the JupyterLite tab that just opened.
              </p>
            </div>
          )}

          <div style={{ marginTop: "2rem", padding: "1rem", backgroundColor: "#fff3e0", borderRadius: "8px", border: "1px solid #ff9800" }}>
            <p style={{ margin: 0, fontSize: "0.9rem", color: "#ef6c00" }}>
              <strong>Note:</strong> JupyterLite runs entirely in your browser. Your work won't be automatically saved back to your project. 
              Download your modified notebook from JupyterLite if you want to keep changes.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
