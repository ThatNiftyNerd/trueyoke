import type { MessageRow } from "./api";

interface Props {
  message: MessageRow;
  mine: boolean;
}

export function MessageBubble({ message, mine }: Props) {
  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[78%] whitespace-pre-wrap break-words rounded-2xl px-3 py-2 text-sm ${
          mine
            ? "bg-app-primary text-app-on-primary"
            : "border border-app-ink/15 bg-card text-app-ink"
        }`}
      >
        {message.body}
      </div>
    </div>
  );
}
