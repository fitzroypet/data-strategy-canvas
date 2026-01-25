import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { StepHeader } from "@/components/step-header";
import { TextAreaBlock } from "@/components/textarea-block";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <AppShell>
      <div className="rounded-2xl border border-zinc-200/70 bg-white/90 p-6 shadow-sm">
        <StepHeader
          title="Business Model Mapping"
          description="Understand how your organisation creates, delivers, and captures value."
        />
        <div className="grid gap-4 lg:grid-cols-3">
          <TextAreaBlock
            label="Customer Segments"
            helperText="Who do you actually serve today?"
          />
          <TextAreaBlock
            label="Value Proposition"
            helperText="What makes your offer valuable?"
          />
          <TextAreaBlock
            label="Channels"
            helperText="How do customers find and reach you?"
          />
          <TextAreaBlock
            label="Customer Relationships"
            helperText="How do you keep customers connected?"
          />
          <TextAreaBlock
            label="Revenue Streams"
            helperText="Where does the money come from?"
          />
          <TextAreaBlock
            label="Key Resources"
            helperText="What assets make delivery possible?"
          />
          <TextAreaBlock
            label="Key Activities"
            helperText="What do you do to create value?"
          />
          <TextAreaBlock
            label="Key Partnerships"
            helperText="Who helps you deliver the offer?"
          />
          <TextAreaBlock
            label="Cost Structure"
            helperText="What are the biggest cost drivers?"
          />
        </div>
        <div className="mt-6 flex flex-col items-start gap-3 rounded-xl border border-dashed border-zinc-200 bg-zinc-50/70 p-4">
          <p className="text-sm text-zinc-600">
            Your business model is becoming clearer. You can refine this later.
            Move forward when ready.
          </p>
          <button className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800">
            Continue to Step 2
          </button>
        </div>
      </div>
    </AppShell>
  );
}
