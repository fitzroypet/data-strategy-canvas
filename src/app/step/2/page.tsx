import { renderStep } from "@/app/step/step-page";
import { getWorkspaceQueryId, type SearchParamsInput } from "@/lib/workspace-selection";

type Step2PageProps = {
  searchParams?: SearchParamsInput | Promise<SearchParamsInput>;
};

export default async function Step2Page({ searchParams }: Step2PageProps) {
  const resolvedSearchParams = await searchParams;
  return renderStep(2, getWorkspaceQueryId(resolvedSearchParams));
}
