export function NotFoundPage() {
  return (
    <section className="text-center py-20">
      <h1 className="text-6xl font-bold mb-4">404</h1>
      <p className="text-xl mb-8 text-base-content/70">The page you're looking for doesn't exist.</p>
      <a href="/" className="inline-block px-6 py-3 bg-primary text-primary-content rounded hover:opacity-90 transition">
        Go Home
      </a>
    </section>
  );
}
