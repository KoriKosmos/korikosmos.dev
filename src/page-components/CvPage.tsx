import { CvSection } from "../components/CvSection.tsx";

interface CvItem {
  main: string;
  subItems?: string[];
  description?: string;
}

interface CvSectionData {
  title: string;
  content?: string[];
  items?: CvItem[];
}

interface CvData {
  personal: {
    name: string;
    title: string;
    location: string;
    email: string;
    website: string;
    linkedin: string;
  };
  sections: CvSectionData[];
}

function renderMain(main: string) {
  const colonIndex = main.indexOf(":");
  if (colonIndex > -1 && colonIndex < 50) {
    const key = main.substring(0, colonIndex + 1);
    const rest = main.substring(colonIndex + 1);
    const linkMatch = rest.match(/\[(.*?)\]\((.*?)\)/);
    if (linkMatch) {
      const [, text, url] = linkMatch;
      const pre = rest.substring(0, linkMatch.index);
      const post = rest.substring((linkMatch.index ?? 0) + linkMatch[0].length);
      return (
        <span>
          <strong>{key}</strong>
          {pre}
          <a href={url} className="text-blue-400 hover:underline">
            {text}
          </a>
          {post}
        </span>
      );
    }
    return (
      <span>
        <strong>{key}</strong>
        {rest}
      </span>
    );
  }
  return <span>{main}</span>;
}

export function CvPage({ personal, sections }: CvData) {
  return (
    <>
      <section className="my-8 text-center">
        <div className="bg-gradient-to-r from-primary to-secondary rounded-xl p-8 shadow-lg text-primary-content">
          <h1 className="text-5xl font-extrabold mb-2">{personal.name}</h1>
          <p className="text-xl mb-2">{personal.title}</p>
          <p>{personal.location}</p>
          <p className="mt-4 flex flex-wrap justify-center gap-4">
            <a href={`mailto:${personal.email}`} className="underline hover:opacity-80">
              {personal.email}
            </a>
            <span>&bull;</span>
            <a href={personal.website} className="underline hover:opacity-80">
              korikosmos.dev
            </a>
            <span>&bull;</span>
            <a href={personal.linkedin} className="underline hover:opacity-80">
              LinkedIn
            </a>
          </p>
        </div>
      </section>

      <div className="space-y-8">
        {sections.map((section) => (
          <CvSection key={section.title} title={section.title}>
            {section.content && (
              <div className="space-y-2">
                {section.content.map((p, i) => (
                  <p className="mb-2" key={i}>
                    {p}
                  </p>
                ))}
              </div>
            )}

            {section.items && (
              <ul className="list-disc pl-5 space-y-2">
                {section.items.map((item, i) => (
                  <li key={i}>
                    {renderMain(item.main)}

                    {item.subItems && (
                      <ul className="list-disc pl-5 mt-1">
                        {item.subItems.map((sub, j) => (
                          <li key={j}>{sub}</li>
                        ))}
                      </ul>
                    )}
                    {item.description && <p className="mt-1 text-sm text-base-content/60">{item.description}</p>}
                  </li>
                ))}
              </ul>
            )}
          </CvSection>
        ))}
      </div>
    </>
  );
}
