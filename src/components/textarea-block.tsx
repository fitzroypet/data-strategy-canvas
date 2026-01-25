type TextAreaBlockProps = {
  label: string;
  helperText: string;
};

export function TextAreaBlock({ label, helperText }: TextAreaBlockProps) {
  return (
    <label className="flex flex-col gap-2 text-sm text-zinc-700">
      <span className="text-sm font-semibold text-zinc-800">{label}</span>
      <span className="text-xs text-zinc-500">{helperText}</span>
      <textarea
        className="min-h-[120px] rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 shadow-sm outline-none transition focus:border-zinc-400"
        placeholder="Write your thinking here..."
      />
    </label>
  );
}
