import { useEffect } from "react";

function applyTheme(theme: string) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);
}

export default function ThemeBar() {
  useEffect(() => {
    const current = localStorage.getItem("theme") || "dark";
    document.documentElement.setAttribute("data-theme", current);
  }, []);

  return (
    <div className="fixed top-4 right-4 z-50 flex gap-2">
      <button
        className="w-6 h-6 rounded-full bg-blue-600 border"
        aria-label="Dark theme"
        onClick={() => applyTheme("dark")}
      />
      <button
        className="w-6 h-6 rounded-full bg-yellow-400 border"
        aria-label="Light theme"
        onClick={() => applyTheme("light")}
      />
      <button
        className="w-6 h-6 rounded-full bg-green-600 border"
        aria-label="Forest theme"
        onClick={() => applyTheme("forest")}
      />
      <button
        className="w-6 h-6 rounded-full bg-black border border-yellow-500 flex items-center justify-center overflow-hidden"
        aria-label="Batman theme"
        onClick={() => applyTheme("batman")}
      >
        <svg viewBox="90 50 420 220" className="w-5 h-5 text-yellow-500 fill-current">
          <path d="M 212,220 C 197,171 156,153 123,221 109,157 120,109 159,63.6 190,114 234,115 254,89.8 260,82.3 268,69.6 270,60.3 273,66.5 275,71.6 280,75.6 286,79.5 294,79.8 300,79.8 306,79.8 314,79.5 320,75.6 325,71.6 327,66.5 330,60.3 332,69.6 340,82.3 346,89.8 366,115 410,114 441,63.6 480,109 491,157 477,221 444,153 403,171 388,220 366,188 316,200 300,248 284,200 234,188 212,220 Z" />
        </svg>
      </button>
    </div>
  );
}
