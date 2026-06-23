import type { CollectionEntry } from "astro:content";
import { ProjectCard } from "../components/ProjectCard.tsx";

interface Props {
  projects: CollectionEntry<"projects">[];
}

export function PortfolioPage({ projects }: Props) {
  return (
    <>
      <h1 className="text-3xl font-bold my-6">Portfolio</h1>
      <div className="grid gap-6 sm:grid-cols-2">
        {projects.map((p) => (
          <ProjectCard key={p.slug} project={p} />
        ))}
      </div>
    </>
  );
}
