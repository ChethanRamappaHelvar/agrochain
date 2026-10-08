import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { RouterProvider } from "./router.jsx";
import { Providers } from "./context/Contexts.jsx";
import "./index.css";

try {
  document.documentElement.dataset.theme =
    JSON.parse(localStorage.getItem("agro_theme")) || "dark";
} catch (e) {
  /* ignore */
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <RouterProvider>
    <Providers>
      <App />
    </Providers>
  </RouterProvider>,
);
