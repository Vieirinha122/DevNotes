import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

// Ponto de entrada do React — monta a árvore de componentes no #root
const container = document.getElementById("root");
if (!container) throw new Error("#root não encontrado no DOM");

ReactDOM.createRoot(container).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
