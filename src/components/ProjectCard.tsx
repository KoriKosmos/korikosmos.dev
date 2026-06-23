import type { CollectionEntry } from "astro:content";

interface Props {
  project: CollectionEntry<"projects">;
}

export function ProjectCard({ project }: Props) {
  return (
    <a
      href={`/portfolio/${project.slug}/`}
      className="block bg-base-200/60 rounded-lg p-4 hover:bg-base-200 transition"
    >
      <h2 className="text-xl font-semibold mb-2">{project.data.title}</h2>
      <p className="text-base-content/60">{project.data.summary}</p>
    </a>
  );
}

export default ProjectCard;
