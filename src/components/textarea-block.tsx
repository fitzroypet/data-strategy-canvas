type TextAreaBlockProps = {
  label: string;
  helperText: string;
  fieldKey?: string;
  highlighted?: boolean;
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
};

export function TextAreaBlock({
  label,
  helperText,
  highlighted = false,
  value,
  onChange,
  onBlur,
  onFocus,
}: TextAreaBlockProps) {
  return (
    <label className="flex flex-col gap-2 text-sm text-zinc-700">
      <span className="text-sm font-semibold text-zinc-800">{label}</span>
      <span className="text-xs text-zinc-500">{helperText}</span>
      <textarea
        className={`min-h-[120px] rounded-xl border bg-white px-3 py-2 text-sm text-zinc-700 shadow-sm outline-none transition focus:border-zinc-400 ${
          highlighted ? "border-zinc-400 ring-2 ring-zinc-200" : "border-zinc-200"
        }`}
        placeholder="Write your thinking here..."
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        onBlur={onBlur}
        onFocus={onFocus}
      />
    </label>
  );
}
