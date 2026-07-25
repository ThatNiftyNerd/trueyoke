import { Button } from "@/components/ui/button";

interface Props {
  displayName: string | null;
  onClose: () => void;
}

export function MatchDialog({ displayName, onClose }: Props) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-brand-burgundy/60 px-6"
    >
      <div className="w-full max-w-sm rounded-2xl border border-brand-sage bg-brand-linen p-6 text-center">
        <p className="font-serif text-2xl text-brand-burgundy">It's a match!</p>
        <p className="mt-2 text-sm text-brand-burgundy/70">
          You and {displayName ?? "your match"} both liked each other.
        </p>
        <Button
          type="button"
          onClick={onClose}
          className="mt-5 w-full bg-brand-sage text-brand-burgundy hover:bg-brand-sage/90"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
