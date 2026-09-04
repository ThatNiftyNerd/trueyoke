import { useState } from "react";
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
  const [hasPlayedVoice, setHasPlayedVoice] = useState(false);
  const canLike = !candidate.voiceIntroSignedUrl || hasPlayedVoice;

  return (
    <Card className="w-full max-w-sm overflow-hidden border-app-ink/20 bg-card">
      <div className="relative aspect-[4/5] w-full bg-app-canvas">
        <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-app-accent/20">
          <span className="font-serif text-6xl text-app-ink/60">
            {initialsOf(candidate.display_name)}
          </span>
          <span className="text-sm text-app-ink/50">Photos are shared once you match.</span>
        </div>
        <div className="absolute right-2 top-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="More options"
                className="rounded-full bg-app-primary/60 p-2 text-app-on-primary backdrop-blur"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={onReport}>Report</DropdownMenuItem>
              <DropdownMenuItem onSelect={onBlock} className="text-app-warn">
                Block
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="space-y-2 p-4">
        <div>
          <h2 className="font-serif text-xl text-app-ink">{candidate.display_name ?? "Member"}</h2>
          <p className="text-sm font-mono tabular-nums text-app-ink/60">
            {cardSubtitle(candidate)}
          </p>
        </div>

        <figure className="rounded-md border border-app-accent/40 bg-app-accent/10 px-3 py-2">
          <figcaption className="text-xs font-medium uppercase tracking-wide text-app-ink/60">
            Life Verse
          </figcaption>
          <blockquote className="mt-1 text-sm italic text-app-ink/80">
            {candidate.life_verse}
          </blockquote>
        </figure>

        {candidate.voiceIntroSignedUrl ? (
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-app-ink/60">
              Voice Intro
            </p>
            <audio
              controls
              src={candidate.voiceIntroSignedUrl}
              className="mt-1 w-full"
              onPlay={() => setHasPlayedVoice(true)}
            />
          </div>
        ) : null}

        {candidate.bio ? (
          <p className="text-sm text-app-ink/80">{bioExcerpt(candidate.bio)}</p>
        ) : null}
        {candidate.endorsement ? (
          <figure className="rounded-md border border-app-ink/15 bg-app-primary/5 px-3 py-2">
            <figcaption className="text-xs font-medium uppercase tracking-wide text-app-ink/60">
              Mentor-endorsed
            </figcaption>
            <blockquote className="mt-1 text-sm italic text-app-ink/80">
              {candidate.endorsement}
            </blockquote>
          </figure>
        ) : null}
      </div>

      <div className="border-t border-app-ink/10 p-3">
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={onPass}
            className="border-app-ink/30 text-app-ink"
          >
            Pass
          </Button>
          <Button
            type="button"
            disabled={busy || !canLike}
            onClick={onLike}
            className="bg-app-primary text-app-on-primary hover:bg-app-primary/90"
          >
            Like
          </Button>
        </div>
        {!canLike ? (
          <p className="mt-2 text-center text-xs text-app-ink/50">
            Play the voice intro to like this profile.
          </p>
        ) : null}
      </div>
    </Card>
  );
}
