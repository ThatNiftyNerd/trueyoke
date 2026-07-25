import { MoreVertical } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Candidate } from "./api";
import { bioExcerpt, cardSubtitle, initialsOf } from "./logic";

interface Props {
  candidate: Candidate;
  onLike: () => void;
  onPass: () => void;
  onReport: () => void;
  onBlock: () => void;
  busy: boolean;
}

export function CandidateCard({ candidate, onLike, onPass, onReport, onBlock, busy }: Props) {

  return (
    <Card className="w-full max-w-sm overflow-hidden border-brand-burgundy/20 bg-white">
      <div className="relative aspect-[4/5] w-full bg-brand-linen">
        {candidate.photoSignedUrl ? (
          <img
            src={candidate.photoSignedUrl}
            alt={candidate.display_name ?? "Candidate"}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-brand-sage/20">
            <span className="font-serif text-6xl text-brand-burgundy/60">
              {initialsOf(candidate.display_name)}
            </span>
          </div>
        )}
      </div>

      <div className="space-y-2 p-4">
        <div>
          <h2 className="font-serif text-xl text-brand-burgundy">
            {candidate.display_name ?? "Member"}
          </h2>
          <p className="text-sm text-brand-burgundy/60">{cardSubtitle(candidate)}</p>
        </div>
        {candidate.bio ? (
          <p className="text-sm text-brand-burgundy/80">{bioExcerpt(candidate.bio)}</p>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-2 border-t border-brand-burgundy/10 p-3">
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          onClick={onPass}
          className="border-brand-burgundy/30 text-brand-burgundy"
        >
          Pass
        </Button>
        <Button
          type="button"
          disabled={busy}
          onClick={onLike}
          className="bg-brand-burgundy text-brand-linen hover:bg-brand-burgundy/90"
        >
          Like
        </Button>
      </div>
    </Card>
  );
}
