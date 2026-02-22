"use client";

type UploadDropzoneProps = {
  files: File[];
  onFilesChange: (files: File[]) => void;
};

export function UploadDropzone({ files, onFilesChange }: UploadDropzoneProps) {
  return (
    <div className="rounded-2xl border border-zinc-200/80 bg-white/80 p-4">
      <div className="mb-2 text-sm font-medium text-zinc-800">
        Optional documents (DOCX/PDF)
      </div>
      <input
        type="file"
        multiple
        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="block w-full text-sm text-zinc-600 file:mr-3 file:rounded-full file:border file:border-zinc-200 file:bg-white file:px-3 file:py-1.5 file:text-sm file:text-zinc-700"
        onChange={(event) => {
          const nextFiles = Array.from(event.target.files ?? []);
          onFilesChange(nextFiles);
        }}
      />
      {files.length > 0 && (
        <div className="mt-3 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-600">
          {files.length} file{files.length === 1 ? "" : "s"} selected:{" "}
          {files.map((file) => file.name).join(", ")}
        </div>
      )}
    </div>
  );
}
