import { useEffect, useState } from 'react';

export function ReadingTools({ retro = false }: { retro?: boolean }) {
  const [ready, setReady] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');

  async function copy(text: string, success: string) {
    try {
      await navigator.clipboard.writeText(text);
      setMessage(success);
    } catch {
      setMessage('Copy is unavailable here. You can select the text or copy the address from your browser.');
    }
  }

  useEffect(() => {
    setReady(true);
    const content = document.querySelector<HTMLElement>('[data-reader-content]');
    if (!content) return;
    let frame = 0;

    const measure = () => {
      frame = 0;
      const rect = content.getBoundingClientRect();
      const distance = rect.height - window.innerHeight;
      const fraction = distance > 0 ? -rect.top / distance : (rect.bottom <= window.innerHeight ? 1 : 0);
      setProgress(Math.round(Math.min(1, Math.max(0, fraction)) * 100));
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(measure); };
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(schedule);
    observer?.observe(content);
    schedule();

    // Keep Markdown server-rendered. Only its code-copy controls need JS.
    const blocks = Array.from(content.querySelectorAll('pre')).map(pre => {
      const wrapper = document.createElement('div');
      wrapper.className = retro ? 'rt-reader-code' : 'reader-code';
      const button = document.createElement('button');
      button.type = 'button';
      button.className = retro ? 'rt-btn' : 'btn btn-ghost btn-xs';
      button.textContent = 'Copy code';
      button.setAttribute('aria-label', 'Copy code block');
      const onCopy = () => { void copy(pre.querySelector('code')?.textContent ?? pre.textContent ?? '', 'Code copied.'); };
      button.addEventListener('click', onCopy);
      pre.before(wrapper);
      wrapper.append(button, pre);
      return () => {
        button.removeEventListener('click', onCopy);
        wrapper.before(pre);
        wrapper.remove();
      };
    });

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      observer?.disconnect();
      blocks.forEach(cleanup => cleanup());
    };
  }, [retro]);

  return (
    <div className={retro ? 'rt-reading-tools' : 'flex flex-wrap items-center gap-3 my-4 min-h-10'}>
      <div
        role="progressbar"
        aria-label="Reading progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress}
        className={retro ? 'rt-reading-progress' : 'fixed top-0 left-0 w-full h-1 z-40 pointer-events-none'}
      >
        <div className={retro ? 'rt-reading-progress__fill' : 'h-full bg-primary origin-left'} style={{ transform: `scaleX(${progress / 100})` }} />
      </div>
      {ready && <button type="button" className={retro ? 'rt-btn' : 'btn btn-sm btn-outline'} onClick={() => void copy(window.location.href, 'Link copied.')}>
        Copy link
      </button>}
      <span role="status" className={retro ? 'rt-small' : 'text-sm text-base-content/70'}>{message}</span>
    </div>
  );
}

export default ReadingTools;
