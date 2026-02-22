import { renderStep } from "@/app/step/step-page";
import {
  getOnboardingNoticeStep,
  getWorkspaceQueryId,
  type SearchParamsInput,
} from "@/lib/workspace-selection";

type Step5PageProps = {
  searchParams?: SearchParamsInput | Promise<SearchParamsInput>;
};

export default async function Step5Page({ searchParams }: Step5PageProps) {
  const resolvedSearchParams = await searchParams;
  return renderStep(
    5,
    getWorkspaceQueryId(resolvedSearchParams),
    getOnboardingNoticeStep(resolvedSearchParams)
  );
}
