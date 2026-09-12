import type { CollectionEntry } from "astro:content";
import { ProjectCard } from "../components/ProjectCard.tsx";
import { ContentFilters, type ContentFiltersProps } from './ContentFilters';

interface Props {
  projects: CollectionEntry<"projects">[];
  filters?: ContentFiltersProps;
}

export function PortfolioPage({ projects, filters }: Props) {
  return (
    <>
      <h1 className="text-3xl font-bold my-6">Portfolio</h1>
      {filters && <ContentFilters {...filters} />}
      <div className="grid gap-6 sm:grid-cols-2">
        {projects.map((p) => (
          <ProjectCard key={p.slug} project={p} />
        ))}
      </div>
    </>
  );
}
