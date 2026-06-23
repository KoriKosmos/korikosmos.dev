import { useEffect, useRef } from "react";

const TEXT = "Hi, I'm Maan";
const TYPING_DELAY = 100;

export function TypingHeading() {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    let i = 0;
    let timeoutId: ReturnType<typeof setTimeout>;
    function type() {
      if (i < TEXT.length) {
        element!.textContent += TEXT.charAt(i);
        i++;
        timeoutId = setTimeout(type, TYPING_DELAY);
      }
    }
    timeoutId = setTimeout(type, 500);

    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <h1 className="text-5xl font-bold mb-4 min-h-[1.2em]">
      <span ref={ref}></span>
      <span className="animate-pulse">|</span>
    </h1>
  );
}
