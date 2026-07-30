import { Sun, Moon } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useTheme } from "@/theme/ThemeProvider";

/**
 * Segmented Light/Dark toggle. Self-contained — drop it anywhere (currently
 * mounted on the Profile screen, see Step 2.6) with no props required.
 */
export function DisplaySettingsPanel() {
  const { theme, setTheme } = useTheme();

  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <h2 className="text-base font-semibold text-card-foreground">Display</h2>
      <p className="mt-1 text-sm text-muted-foreground">Choose how TrueYoke looks on this device.</p>

      <ToggleGroup
        type="single"
        value={theme}
        onValueChange={(v) => v && setTheme(v as "light" | "dark")}
        className="mt-3 justify-start"
      >
        <ToggleGroupItem value="light" aria-label="Light theme">
          <Sun className="mr-2 h-4 w-4" />
          Light
        </ToggleGroupItem>
        <ToggleGroupItem value="dark" aria-label="Dark theme">
          <Moon className="mr-2 h-4 w-4" />
          Dark
        </ToggleGroupItem>
      </ToggleGroup>
    </section>
  );
}
