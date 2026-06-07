/** A consistent page header: a hairline index number and a tracked title. */
export function PageHeading({ index, title }: { index: string; title: string }) {
  return (
    <header className="flex items-baseline gap-4">
      <span className="font-serif text-2xl font-light text-ink/30">{index}</span>
      <span className="h-px flex-1 translate-y-[-3px] bg-ink/10" />
      <h2 className="font-sans text-[11px] uppercase tracking-archive text-ink">
        {title}
      </h2>
    </header>
  );
}
