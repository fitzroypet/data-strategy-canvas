import { renderStep } from "@/app/step/step-page";
import {
  getOnboardingNoticeStep,
  getWorkspaceQueryId,
  type SearchParamsInput,
} from "@/lib/workspace-selection";

type Step3PageProps = {
  searchParams?: SearchParamsInput | Promise<SearchParamsInput>;
};

export default async function Step3Page({ searchParams }: Step3PageProps) {
  const resolvedSearchParams = await searchParams;
  return renderStep(
    3,
    getWorkspaceQueryId(resolvedSearchParams),
    getOnboardingNoticeStep(resolvedSearchParams)
  );
}
