import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import ReactDOM from "react-dom/client";
import "@uiw/react-markdown-preview/markdown.css";
import "@uiw/react-md-editor/markdown-editor.css";
import { registerSW } from "virtual:pwa-register";
import App from "./App";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const container = document.getElementById("root");
if (!container) throw new Error("#root nao encontrado no DOM");

if (import.meta.env.PROD) {
  registerSW({
    immediate: true,
  });
} else if ("serviceWorker" in navigator) {
  void navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => {
      void registration.unregister();
    });
  });

  if ("caches" in window) {
    void caches.keys().then((cacheKeys) => {
      cacheKeys.forEach((cacheKey) => {
        void caches.delete(cacheKey);
      });
    });
  }
}

ReactDOM.createRoot(container).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
);
