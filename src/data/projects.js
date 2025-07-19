export const projects = [
  {
    slug: 'random-project',
    title: 'Random Project',
    summary: 'A small standalone experiment.',
    description: 'This project demonstrates work that isn\'t hosted on GitHub but still deserves a spotlight.',
    github: null
  },
  {
    slug: 'korikosmos-dev',
    title: 'korikosmos.dev',
    summary: 'My personal website built with Astro.',
    description: 'The source code for this site is open and available to explore.',
    github: 'https://github.com/KoriKosmos/korikosmos.dev'
  }
];

export function getProject(slug) {
  return projects.find(p => p.slug === slug);
}
