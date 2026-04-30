import type { ReactNode } from "react";

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  action?: ReactNode;
};

export function PageHeader({ action, eyebrow, title }: PageHeaderProps) {
  return (
    <header className="mb-5 flex items-start justify-between gap-4">
      <div>
        {eyebrow ? <p className="text-xs font-black uppercase text-sky">{eyebrow}</p> : null}
        <h1 className="mt-1 text-3xl font-black leading-tight text-white">{title}</h1>
      </div>
      {action}
    </header>
  );
}
