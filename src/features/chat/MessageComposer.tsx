import { useState, type FormEvent } from "react";
import { MESSAGE_MAX_LENGTH, validateDraft } from "./logic";

interface Props {
  disabled: boolean;
  disabledReason?: string;
  onSend: (body: string) => Promise<void>;
}

export function MessageComposer({ disabled, disabledReason, onSend }: Props) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (disabled || sending) return;
    const check = validateDraft(value);
    if (!check.ok) {
      setError(
        check.reason === "too_long" ? `Keep it under ${MESSAGE_MAX_LENGTH} characters.` : null,
      );
      return;
    }
    setError(null);
    setSending(true);
    try {
      await onSend(check.trimmed);
      setValue("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send. Try again.");
    } finally {
      setSending(false);
    }
  }

  if (disabled) {
    return (
      <div className="border-t border-app-ink/10 bg-app-canvas p-3 text-center text-sm text-app-warn">
        {disabledReason ?? "This conversation has ended."}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="border-t border-app-ink/10 bg-app-canvas p-3">
      {error ? <p className="mb-2 text-xs text-app-warn">{error}</p> : null}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={value}
          maxLength={MESSAGE_MAX_LENGTH + 50}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Write with intention…"
          className="flex-1 rounded-full border border-app-ink/20 bg-card px-4 py-2 text-sm outline-none focus:border-app-ink"
        />
        <button
          type="submit"
          disabled={sending || !value.trim()}
          className="rounded-full bg-app-primary px-4 py-2 text-sm font-medium text-app-on-primary disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </form>
  );
}
