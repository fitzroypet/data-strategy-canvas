import { renderStep } from "@/app/step/step-page";

type StepPageProps = {
  params: { stepId: string };
};

export default async function StepPage({ params }: StepPageProps) {
  return renderStep(Number(params.stepId));
}
