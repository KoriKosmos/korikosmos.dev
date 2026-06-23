import { useEffect, useState } from "react";

const STORAGE_KEY = "oneko-enabled";

function enable() {
  if (document.getElementById("oneko-script")) return;
  const script = document.createElement("script");
  script.id = "oneko-script";
  script.src = "/oneko.js";
  document.body.appendChild(script);
  localStorage.setItem(STORAGE_KEY, "true");
}

function disable() {
  document.getElementById("oneko")?.remove();
  document.getElementById("oneko-script")?.remove();
  localStorage.setItem(STORAGE_KEY, "false");
}

export function OnekoToggle() {
  const [visible, setVisible] = useState(false);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const updateFromStorage = () => {
      const isEnabled = localStorage.getItem(STORAGE_KEY) === "true";
      if (isEnabled) enable();
      else disable();
      setEnabled(isEnabled);
      setVisible(true);
    };

    updateFromStorage();
    window.addEventListener("load", updateFromStorage);
    return () => window.removeEventListener("load", updateFromStorage);
  }, []);

  const handleClick = () => {
    const isEnabled = localStorage.getItem(STORAGE_KEY) === "true";
    if (isEnabled) {
      disable();
      setEnabled(false);
    } else {
      enable();
      setEnabled(true);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        id="oneko-toggle"
        className="px-3 py-2 text-sm bg-base-200 text-base-content rounded"
        style={{ visibility: visible ? "visible" : "hidden" }}
        onClick={handleClick}
      >
        {enabled ? "Hide Cat" : "Show Cat"}
      </button>
    </div>
  );
}

export default OnekoToggle;
