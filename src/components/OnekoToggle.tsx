import { useEffect, useRef, useState } from "react";

const STORAGE_KEY = "oneko-enabled";

// The cat is mounted inside this island's subtree (not document.body) so that
// transition:persist carries it across client-side navigations untouched.
function enableCat(container: HTMLElement) {
  if (document.getElementById("oneko-script")) return;
  const script = document.createElement("script");
  script.id = "oneko-script";
  script.src = "/oneko.js";
  script.dataset.cat = "/oneko.gif";
  container.appendChild(script);
  localStorage.setItem(STORAGE_KEY, "true");
}

function disableCat() {
  document.getElementById("oneko")?.remove();
  document.getElementById("oneko-script")?.remove();
  localStorage.setItem(STORAGE_KEY, "false");
}

export function OnekoToggle() {
  const [visible, setVisible] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const catMountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const isEnabled = localStorage.getItem(STORAGE_KEY) === "true";
    if (isEnabled && catMountRef.current) enableCat(catMountRef.current);
    setEnabled(isEnabled);
    setVisible(true);
  }, []);

  const handleClick = () => {
    if (enabled) {
      disableCat();
      setEnabled(false);
    } else if (catMountRef.current) {
      enableCat(catMountRef.current);
      setEnabled(true);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div ref={catMountRef} />
      <button
        id="oneko-toggle"
        className="px-3 py-2 text-sm bg-base-200 text-base-content rounded transition-transform duration-200 hover:scale-105"
        style={{ visibility: visible ? "visible" : "hidden" }}
        onClick={handleClick}
      >
        {enabled ? "Hide Cat" : "Show Cat"}
      </button>
    </div>
  );
}

export default OnekoToggle;
