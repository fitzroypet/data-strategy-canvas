import { renderStep } from "@/app/step/step-page";
import { getWorkspaceQueryId, type SearchParamsInput } from "@/lib/workspace-selection";

type Step4PageProps = {
  searchParams?: SearchParamsInput | Promise<SearchParamsInput>;
};

export default async function Step4Page({ searchParams }: Step4PageProps) {
  const resolvedSearchParams = await searchParams;
  return renderStep(4, getWorkspaceQueryId(resolvedSearchParams));
}
