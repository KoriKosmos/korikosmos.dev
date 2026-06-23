import { ProjectCard } from 'korikosmos-dev';

const project = {
  slug: 'korikosmos-dev',
  data: {
    title: 'korikosmos.dev',
    summary: 'Personal portfolio, blog, and games hub built with Astro.',
    description: 'The site you are looking at right now.',
  },
};

const longSummaryProject = {
  slug: 'ioq3-sgx-fyp',
  data: {
    title: 'ioquake3 + Intel SGX',
    summary:
      'Final year project exploring secure enclave execution for a real-time multiplayer game server, isolating untrusted game logic from the host kernel.',
    description: 'Research project.',
  },
};

export const Default = () => <ProjectCard project={project} />;

export const LongSummary = () => <ProjectCard project={longSummaryProject} />;
