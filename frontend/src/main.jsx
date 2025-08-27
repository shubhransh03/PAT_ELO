import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { ClerkProvider } from "@clerk/clerk-react";
import "./index.css"; // load global design tokens and app gradient
import "@mantine/core/styles.css";
import { MantineProvider } from "@mantine/core";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Clerk Publishable Key");
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
      <MantineProvider>
        <App />
      </MantineProvider>
    </ClerkProvider>
  </React.StrictMode>
);
