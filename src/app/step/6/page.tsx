import { renderStep } from "@/app/step/step-page";
import {
  getOnboardingNoticeStep,
  getWorkspaceQueryId,
  type SearchParamsInput,
} from "@/lib/workspace-selection";

type Step6PageProps = {
  searchParams?: SearchParamsInput | Promise<SearchParamsInput>;
};

export default async function Step6Page({ searchParams }: Step6PageProps) {
  const resolvedSearchParams = await searchParams;
  return renderStep(
    6,
    getWorkspaceQueryId(resolvedSearchParams),
    getOnboardingNoticeStep(resolvedSearchParams)
  );
}
