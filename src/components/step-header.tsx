type StepHeaderProps = {
  title: string;
  description: string;
};

export function StepHeader({ title, description }: StepHeaderProps) {
  return (
    <header className="mb-6">
      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">
        Step
      </div>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900">
        {title}
      </h1>
      <p className="mt-2 text-base text-zinc-600">{description}</p>
    </header>
  );
}
