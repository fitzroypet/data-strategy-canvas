import { fileExtension } from "@/lib/import-config";

type MammothModule = {
  extractRawText: (input: { buffer: ArrayBuffer }) => Promise<{ value: string }>;
};

type PdfParseFn = (buffer: Buffer) => Promise<{ text?: string }>;

async function loadMammoth(): Promise<MammothModule> {
  const loader = new Function("return import('mammoth')");
  const imported = (await loader()) as { default?: MammothModule } & MammothModule;
  return imported.default ?? imported;
}

async function loadPdfParse(): Promise<PdfParseFn> {
  const loader = new Function("return import('pdf-parse')");
  const imported = (await loader()) as { default?: PdfParseFn } & PdfParseFn;
  return imported.default ?? imported;
}

function normalizeExtractedText(text: string) {
  return text.replace(/\r/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

export async function extractTextFromDocument(file: File) {
  const extension = fileExtension(file.name);
  const mimeType = file.type.toLowerCase();
  const arrayBuffer = await file.arrayBuffer();

  if (
    extension === "docx" ||
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    try {
      const mammoth = await loadMammoth();
      const result = await mammoth.extractRawText({ buffer: arrayBuffer });
      return normalizeExtractedText(result.value ?? "");
    } catch {
      throw new Error(
        "DOCX parsing is unavailable. Install the `mammoth` package and redeploy."
      );
    }
  }

  if (extension === "pdf" || mimeType === "application/pdf") {
    try {
      const pdfParse = await loadPdfParse();
      const result = await pdfParse(Buffer.from(arrayBuffer));
      return normalizeExtractedText(result.text ?? "");
    } catch {
      throw new Error(
        "PDF parsing is unavailable. Install the `pdf-parse` package and redeploy."
      );
    }
  }

  throw new Error("Unsupported file type. Please upload a DOCX or PDF document.");
}

