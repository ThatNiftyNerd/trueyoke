import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { redirectIfSignedIn } from "@/features/auth/guards";
import { ACCOUNT_TYPES } from "@/lib/constants";

export const Route = createFileRoute("/choose-type")({
  head: () => ({
    meta: [
      { title: "Choose your account type — TrueYoke" },
      {
        name: "description",
        content: "Join TrueYoke as a Match or as a Mentor.",
      },
      { property: "og:title", content: "Choose your account type — TrueYoke" },
      { property: "og:description", content: "Join TrueYoke as a Match or as a Mentor." },
    ],
  }),
  // Public entry point; signed-in users go straight to the app.
  beforeLoad: () => redirectIfSignedIn(),
  component: ChooseType,
});

function ChooseType() {
  const navigate = useNavigate();

  return (
    <main className="flex min-h-[100dvh] flex-col justify-center bg-app-canvas px-6 py-10">
      <div className="mx-auto w-full max-w-sm">
        <header className="mb-8 text-center">
          <p className="text-sm uppercase tracking-widest text-app-on-accent">TrueYoke</p>
          <h1 className="mt-2 font-serif text-2xl text-app-ink">I am joining as</h1>
        </header>

        <div className="flex flex-col gap-3">
          {ACCOUNT_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => navigate({ to: "/auth", search: { type } })}
              className="w-full rounded-md border border-app-ink/30 bg-transparent px-4 py-4 text-base text-app-ink"
            >
              {type === "match" ? "Match" : "Mentor"}
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}
