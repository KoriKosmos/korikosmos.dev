import { useEffect, useRef } from "react";

// Full-viewport constellation background for the homepage hero.
// Stars drift and link into constellations; stars near the cursor link to it
// and drift gently toward it. Colors are sampled from the active DaisyUI theme
// (base-content for stars, primary for cursor links) and re-sampled on theme
// switch. Under prefers-reduced-motion a single static field is drawn instead.

interface Star {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  twinkle: number;
}

const LINK_DIST = 110;
const MOUSE_DIST = 170;
const MAX_SPEED = 0.35;

export function ConstellationField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let width = 0;
    let height = 0;
    let stars: Star[] = [];
    let rafId = 0;
    let starColor = "#a6adbb";
    let accentColor = "#818cf8";
    const mouse = { x: -1e4, y: -1e4 };
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    function readThemeColors() {
      starColor = getComputedStyle(document.body).color;
      const probe = document.createElement("span");
      probe.className = "text-primary";
      probe.style.display = "none";
      document.body.appendChild(probe);
      accentColor = getComputedStyle(probe).color;
      probe.remove();
    }

    function seedStars() {
      const count = Math.max(40, Math.min(160, Math.round((width * height) / 9000)));
      stars = Array.from({ length: count }, () => {
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.05 + Math.random() * 0.12;
        return {
          x: Math.random() * width,
          y: Math.random() * height,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          r: 0.6 + Math.random() * 1.4,
          twinkle: Math.random() * Math.PI * 2,
        };
      });
    }

    function drawFrame(time: number) {
      ctx.clearRect(0, 0, width, height);

      // Star-to-star constellation lines
      ctx.strokeStyle = starColor;
      ctx.lineWidth = 1;
      for (let i = 0; i < stars.length; i++) {
        for (let j = i + 1; j < stars.length; j++) {
          const dx = stars[i].x - stars[j].x;
          const dy = stars[i].y - stars[j].y;
          const d2 = dx * dx + dy * dy;
          if (d2 < LINK_DIST * LINK_DIST) {
            ctx.globalAlpha = (1 - Math.sqrt(d2) / LINK_DIST) * 0.22;
            ctx.beginPath();
            ctx.moveTo(stars[i].x, stars[i].y);
            ctx.lineTo(stars[j].x, stars[j].y);
            ctx.stroke();
          }
        }
      }

      // Cursor links
      ctx.strokeStyle = accentColor;
      for (const star of stars) {
        const dx = star.x - mouse.x;
        const dy = star.y - mouse.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < MOUSE_DIST * MOUSE_DIST) {
          ctx.globalAlpha = (1 - Math.sqrt(d2) / MOUSE_DIST) * 0.5;
          ctx.beginPath();
          ctx.moveTo(star.x, star.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
        }
      }

      // Stars
      ctx.fillStyle = starColor;
      for (const star of stars) {
        ctx.globalAlpha = 0.45 + 0.35 * Math.sin(star.twinkle + time / 900);
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    function step() {
      for (const star of stars) {
        // Gentle pull toward the cursor
        const dx = mouse.x - star.x;
        const dy = mouse.y - star.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < MOUSE_DIST * MOUSE_DIST && d2 > 1) {
          const d = Math.sqrt(d2);
          star.vx += (dx / d) * 0.004;
          star.vy += (dy / d) * 0.004;
        }
        const speed = Math.hypot(star.vx, star.vy);
        if (speed > MAX_SPEED) {
          star.vx = (star.vx / speed) * MAX_SPEED;
          star.vy = (star.vy / speed) * MAX_SPEED;
        }
        star.x += star.vx;
        star.y += star.vy;
        // Wrap around the viewport edges
        if (star.x < -10) star.x = width + 10;
        if (star.x > width + 10) star.x = -10;
        if (star.y < -10) star.y = height + 10;
        if (star.y > height + 10) star.y = -10;
      }
    }

    function tick(time: number) {
      step();
      drawFrame(time);
      rafId = requestAnimationFrame(tick);
    }

    function start() {
      if (!rafId && !reducedMotion.matches && !document.hidden) {
        rafId = requestAnimationFrame(tick);
      }
    }

    function stop() {
      cancelAnimationFrame(rafId);
      rafId = 0;
    }

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seedStars();
      if (reducedMotion.matches) drawFrame(0);
    }

    const onPointerMove = (e: PointerEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    const onPointerLeave = () => {
      mouse.x = -1e4;
      mouse.y = -1e4;
    };
    const onMotionChange = () => {
      stop();
      if (reducedMotion.matches) drawFrame(0);
      else start();
    };
    const onVisibilityChange = () => (document.hidden ? stop() : start());

    const themeObserver = new MutationObserver(() => {
      readThemeColors();
      if (reducedMotion.matches) drawFrame(0);
    });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    readThemeColors();
    resize();
    start();

    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onPointerMove);
    document.documentElement.addEventListener("pointerleave", onPointerLeave);
    document.addEventListener("visibilitychange", onVisibilityChange);
    reducedMotion.addEventListener("change", onMotionChange);

    return () => {
      stop();
      themeObserver.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
      document.documentElement.removeEventListener("pointerleave", onPointerLeave);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      reducedMotion.removeEventListener("change", onMotionChange);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className="fixed inset-0 -z-10 pointer-events-none" />;
}

export default ConstellationField;
