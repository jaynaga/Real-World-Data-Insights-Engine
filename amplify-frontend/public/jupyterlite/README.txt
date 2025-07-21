Place the JupyterLite static build files here. You can download the official build from https://jupyterlite.github.io/demo/repl/ or build your own using JupyterLite docs.

Example files to include:
- index.html
- jupyterlite.json
- pyodide.js
- ... (all assets from the JupyterLite build)

Once files are here, you can embed JupyterLite in your React app using an iframe:

<iframe src="/jupyterlite/index.html" width="100%" height="700px" />

To open a generated notebook, use the file upload feature in JupyterLite, or customize the integration to pass the notebook URL.
