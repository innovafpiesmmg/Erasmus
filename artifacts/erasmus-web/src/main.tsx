import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { applyGoogleTranslatePatch } from "./lib/google-translate-patch";

applyGoogleTranslatePatch();

createRoot(document.getElementById("root")!).render(<App />);
