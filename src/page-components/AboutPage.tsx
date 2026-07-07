export function AboutPage() {
  return (
    <section className="bg-gradient-to-r from-primary to-secondary rounded-xl p-8 shadow-lg my-8 text-primary-content">
      <h1 className="text-5xl font-extrabold mb-6 text-center">About Me</h1>
      <div className="space-y-4 text-lg leading-relaxed">
        <p>
          Hi, I'm Maan. I'm someone who enjoys thoughtful storytelling, whether it comes from comics, manga, films, or
          games. I've always been drawn to creative worlds and the ideas behind them — not just how they're made, but
          why they resonate with people.
        </p>

        <p>
          I've lived in several countries, and that experience has shaped my perspective — I adapt quickly, stay
          curious, and value open-minded conversations. In my free time, I enjoy reading, watching character-driven
          dramas or animation, and diving into games that offer more than just action — ones that tell a story or
          challenge the way you think.
        </p>

        <p>
          Outside of entertainment, I like to organise and improve things. Whether that's setting up my home server,
          building tools, or just refining a small personal project, I find satisfaction in making systems work
          better. I enjoy learning new skills, but I also value quiet time to reflect or explore new ideas at my own
          pace.
        </p>
      </div>
      <p className="mt-6 text-center">
        <a href="mailto:kori@korikosmos.dev" className="underline hover:opacity-80">
          Email
        </a>
        <span className="mx-2">&bull;</span>
        <a
          href="https://linkedin.com/in/maan-meher-449094a0"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:opacity-80"
        >
          LinkedIn
        </a>
      </p>
    </section>
  );
}
