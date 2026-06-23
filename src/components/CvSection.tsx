import type { ReactNode } from "react";

interface Props {
  title: string;
  children?: ReactNode;
}

export default function CvSection({ title, children }: Props) {
  return (
    <section className="bg-base-200/60 rounded-lg p-6 shadow">
      <h2 className="text-2xl font-semibold mb-2">{title}</h2>
      {children}
    </section>
  );
}
