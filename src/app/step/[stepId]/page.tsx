import { renderStep } from "@/app/step/step-page";
import { getWorkspaceQueryId, type SearchParamsInput } from "@/lib/workspace-selection";

type StepPageProps = {
  params: { stepId: string };
  searchParams?: SearchParamsInput | Promise<SearchParamsInput>;
};

export default async function StepPage({ params, searchParams }: StepPageProps) {
  const resolvedSearchParams = await searchParams;
  return renderStep(Number(params.stepId), getWorkspaceQueryId(resolvedSearchParams));
}
