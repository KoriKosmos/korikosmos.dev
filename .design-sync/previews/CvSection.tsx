import { CvSection } from 'korikosmos-dev';

export const TextContent = () => (
  <CvSection title="Experience">
    <div className="space-y-2">
      <p className="mb-2">Senior Software Engineer at Acme Corp, building developer tooling.</p>
      <p className="mb-2">Previously: backend platform work at a fintech startup.</p>
    </div>
  </CvSection>
);

export const ListContent = () => (
  <CvSection title="Skills">
    <ul className="list-disc pl-5 space-y-2">
      <li>TypeScript, React, Astro</li>
      <li>Node.js, PostgreSQL</li>
      <li>CI/CD, Docker</li>
    </ul>
  </CvSection>
);
