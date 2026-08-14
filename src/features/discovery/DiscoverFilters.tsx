/**
 * Discover filter sheet for Match accounts. Selections live in route state
 * (session-scoped) — nothing is persisted to the database.
 */
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { CHURCH_AFFILIATIONS } from "@/features/profile/constants";
import type { DeckFilters, LocationScope } from "./api";
import { EMPTY_FILTERS } from "./logic";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: DeckFilters;
  onApply: (next: DeckFilters) => void;
}

const ANY = "__any__";

export function DiscoverFilters({ open, onOpenChange, value, onApply }: Props) {
  const [draft, setDraft] = useState<DeckFilters>(value);

  function toNum(raw: string): number | undefined {
    const n = Number.parseInt(raw, 10);
    return Number.isFinite(n) ? n : undefined;
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        if (o) setDraft(value);
        onOpenChange(o);
      }}
    >
      <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto bg-card">
        <SheetHeader>
          <SheetTitle className="text-app-ink">Filters</SheetTitle>
          <SheetDescription className="text-app-ink/70">
            Narrow who shows up in your deck.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-5">
          <div className="space-y-2">
            <Label className="text-app-ink">Age range</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                inputMode="numeric"
                min={18}
                max={99}
                aria-label="Minimum age"
                placeholder="Min"
                value={draft.ageMin ?? ""}
                onChange={(e) => setDraft({ ...draft, ageMin: toNum(e.target.value) })}
              />
              <span className="text-sm text-app-ink/60">to</span>
              <Input
                type="number"
                inputMode="numeric"
                min={18}
                max={99}
                aria-label="Maximum age"
                placeholder="Max"
                value={draft.ageMax ?? ""}
                onChange={(e) => setDraft({ ...draft, ageMax: toNum(e.target.value) })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-app-ink">Location</Label>
            <Select
              value={draft.location ?? "any"}
              onValueChange={(v) => setDraft({ ...draft, location: v as LocationScope })}
            >
              <SelectTrigger aria-label="Location">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Anywhere</SelectItem>
                <SelectItem value="country">Same country as me</SelectItem>
                <SelectItem value="city">Same country and city as me</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-app-ink">Church affiliation</Label>
            <Select
              value={draft.churchAffiliation ?? ANY}
              onValueChange={(v) =>
                setDraft({ ...draft, churchAffiliation: v === ANY ? undefined : v })
              }
            >
              <SelectTrigger aria-label="Church affiliation">
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                <SelectItem value={ANY}>Any</SelectItem>
                {CHURCH_AFFILIATIONS.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              className="flex-1 bg-app-primary text-app-on-primary hover:bg-app-primary/90"
              onClick={() => {
                onApply(draft);
                onOpenChange(false);
              }}
            >
              Apply
            </Button>
            <Button
              type="button"
              variant="outline"
              className="border-app-ink/30 text-app-ink"
              onClick={() => {
                setDraft(EMPTY_FILTERS);
                onApply(EMPTY_FILTERS);
                onOpenChange(false);
              }}
            >
              Clear
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
