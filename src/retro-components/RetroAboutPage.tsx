// Retro (Web 1.0) dressing of /about. Same three paragraphs and the same two
// links as page-components/AboutPage.tsx — only the wrapping is from 2003.
// Rendered server-side with no client:* directive, so everything here is static
// HTML; all the movement comes from retro.css animations.

export function RetroAboutPage() {
  return (
    <div className="rt-stack">
      <h1 className="rt-heading">
        <span className="rt-wobble">ABOUT ME!!</span>
      </h1>

      <p className="rt-center rt-note" style={{ margin: 0 }}>
        (｡•̀ᴗ-)✧ you found the about page &mdash; grab a drink, it&rsquo;s a long one
      </p>

      <div className="rt-hr rt-hr--hearts"></div>

      {/* ---------------- Who is this person ---------------- */}
      <div className="rt-panel">
        <div className="rt-panel__title">WHO_IS_THIS.TXT</div>
        <div className="rt-panel__body">
          <div className="rt-row" style={{ alignItems: 'flex-start' }}>
            <img
              src="/retro/gfx/mascot.svg"
              alt="A small pink cat waving hello"
              width="72"
              height="72"
              className="rt-pixel"
            />
            <p style={{ margin: 0, flex: '1 1 220px' }}>
              <strong>Hi, I&rsquo;m Maan.</strong>{' '}
              <span className="rt-small rt-soft">
                (the cat is not me. the cat is just here.)
              </span>
            </p>
          </div>

          <div className="rt-inset" style={{ marginTop: '10px' }}>
            <p>
              Hi, I&rsquo;m Maan. I&rsquo;m someone who enjoys thoughtful storytelling, whether it comes from comics,
              manga, films, or games. I&rsquo;ve always been drawn to creative worlds and the ideas behind them &mdash;
              not just how they&rsquo;re made, but why they resonate with people.
            </p>

            <p>
              I&rsquo;ve lived in several countries, and that experience has shaped my perspective &mdash; I adapt
              quickly, stay curious, and value open-minded conversations. In my free time, I enjoy reading, watching
              character-driven dramas or animation, and diving into games that offer more than just action &mdash; ones
              that tell a story or challenge the way you think.
            </p>

            <p style={{ marginBottom: 0 }}>
              Outside of entertainment, I like to organise and improve things. Whether that&rsquo;s setting up my home
              server, building tools, or just refining a small personal project, I find satisfaction in making systems
              work better. I enjoy learning new skills, but I also value quiet time to reflect or explore new ideas at
              my own pace.
            </p>
          </div>

          <p className="rt-note" style={{ marginTop: '8px', marginBottom: 0 }}>
            &raquo; That&rsquo;s the whole bio. No, there is no &ldquo;read more&rdquo; button. This is 2003.
          </p>
        </div>
      </div>

      {/* ---------------- The obligatory stats table ---------------- */}
      <div className="rt-panel">
        <div className="rt-panel__title">My Stats!</div>
        <div className="rt-panel__body">
          <h2 className="rt-subhead" style={{ marginTop: 0 }}>
            The vital statistics
          </h2>

          <table className="rt-table">
            <caption className="rt-sr-only">Basic facts about Maan</caption>
            <tbody>
              <tr>
                <th scope="row">Name</th>
                <td>Maan &mdash; online as KoriKosmos</td>
              </tr>
              <tr>
                <th scope="row">Location</th>
                <td>Has lived in several countries. Currently: on the internet.</td>
              </tr>
              <tr>
                <th scope="row">Status</th>
                <td>
                  Curious, adapting quickly{' '}
                  <img
                    src="/retro/gfx/new.svg"
                    alt="(new!)"
                    width="36"
                    height="16"
                    className="rt-pixel"
                  />
                </td>
              </tr>
              <tr>
                <th scope="row">Favourite thing</th>
                <td>Thoughtful storytelling &mdash; comics, manga, films, games</td>
              </tr>
              <tr>
                <th scope="row">Free time</th>
                <td>Reading, character-driven dramas and animation, story-first games</td>
              </tr>
              <tr>
                <th scope="row">Also does</th>
                <td>Home server tinkering, building tools, refining small personal projects</td>
              </tr>
              <tr>
                <th scope="row">Values</th>
                <td>Open-minded conversation, and quiet time to think at my own pace</td>
              </tr>
              <tr>
                <th scope="row">Homepage</th>
                <td>
                  <span className="rt-mono">korikosmos.dev</span> (you are here)
                </td>
              </tr>
            </tbody>
          </table>

          <p className="rt-note" style={{ marginTop: '8px', marginBottom: 0 }}>
            Table last verified by a human. Percentages not included because percentages of what.
          </p>
        </div>
      </div>

      <div className="rt-hr"></div>

      {/* ---------------- Contact ---------------- */}
      <div className="rt-panel">
        <div className="rt-panel__title rt-panel__title--plain">Contact Me!!</div>
        <div className="rt-panel__body rt-center">
          <img
            className="rt-blinkie"
            src="/retro/blinkies/email.svg"
            alt="Email me"
            width="150"
            height="20"
          />
          <p className="rt-row" style={{ justifyContent: 'center', margin: '8px 0 0' }}>
            <a className="rt-btn" href="mailto:kori@korikosmos.dev">
              <img src="/retro/gfx/mail.svg" alt="" width="32" height="24" /> Email
            </a>
            <a
              className="rt-btn"
              href="https://linkedin.com/in/maan-meher-449094a0"
              target="_blank"
              rel="noopener noreferrer"
            >
              LinkedIn
            </a>
          </p>
          <p className="rt-note" style={{ margin: '10px 0 0' }}>
            Replies may take 1&ndash;3 business dial-up sessions. <span className="rt-blink">*beep boop*</span>
          </p>
        </div>
      </div>

      <div className="rt-marquee">
        <div className="rt-marquee__track">
          ★彡 thanks for reading my about page 彡★ &nbsp;&nbsp;&nbsp; tell a friend &nbsp;&nbsp;&nbsp; sign the
          guestbook &nbsp;&nbsp;&nbsp; (｡◕‿◕｡) &nbsp;&nbsp;&nbsp;
        </div>
      </div>

      <p className="rt-center rt-small" style={{ margin: 0 }}>
        <a href="/guestbook">Sign my guestbook</a> <span aria-hidden="true">&bull;</span>{' '}
        <a href="/now">What I&rsquo;m up to now</a> <span aria-hidden="true">&bull;</span>{' '}
        <a href="/uses">What I use</a>
      </p>
    </div>
  );
}

export default RetroAboutPage;
