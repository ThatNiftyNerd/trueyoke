import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { StepShell } from "./StepShell";
import { VOICE_INTRO_MAX_SECONDS } from "@/lib/constants";
import {
  getVoiceIntroSignedUrl,
  updateOwnProfile,
  uploadOwnVoiceIntro,
  type OnboardingProfile,
} from "../api";
import { extensionForAudioMime } from "../logic";

interface Props {
  profile: OnboardingProfile;
  onSaved: (patch: Partial<OnboardingProfile>) => void;
  onNext: () => void;
  onBack: () => void;
  canGoBack: boolean;
}

type RecState = "idle" | "recording" | "recorded";

export function VoiceIntroStep({ profile, onSaved, onNext, onBack, canGoBack }: Props) {
  const [state, setState] = useState<RecState>("idle");
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [localBlob, setLocalBlob] = useState<Blob | null>(null);
  const [localUrl, setLocalUrl] = useState<string | null>(null);
  const [existingUrl, setExistingUrl] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);

  // Load an existing intro (signed URL) for playback.
  useEffect(() => {
    let cancelled = false;
    if (profile.voice_intro_url) {
      getVoiceIntroSignedUrl(profile.voice_intro_url).then((url) => {
        if (!cancelled && url) setExistingUrl(url);
      });
    }
    return () => {
      cancelled = true;
    };
  }, [profile.voice_intro_url]);

  // Cleanup on unmount.
  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (localUrl) URL.revokeObjectURL(localUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stop = () => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  const start = async () => {
    setError(null);
    if (localUrl) {
      URL.revokeObjectURL(localUrl);
      setLocalUrl(null);
    }
    setLocalBlob(null);
    setSeconds(0);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const rec = new MediaRecorder(stream);
      recorderRef.current = rec;
      chunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onstop = () => {
        const type = rec.mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type });
        setLocalBlob(blob);
        setLocalUrl(URL.createObjectURL(blob));
        setState("recorded");
      };
      rec.start();
      setState("recording");
      timerRef.current = window.setInterval(() => {
        setSeconds((s) => {
          const next = s + 1;
          if (next >= VOICE_INTRO_MAX_SECONDS) stop();
          return next;
        });
      }, 1000);
    } catch {
      setError("Microphone permission is required to record your intro.");
      setState("idle");
    }
  };

  const reset = () => {
    if (localUrl) URL.revokeObjectURL(localUrl);
    setLocalBlob(null);
    setLocalUrl(null);
    setSeconds(0);
    setState("idle");
  };

  const save = async () => {
    if (!localBlob) {
      // Existing intro already on file → just advance.
      if (profile.voice_intro_url) {
        onNext();
      } else {
        setError("Record a short intro to continue.");
      }
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const ext = extensionForAudioMime(localBlob.type);
      const path = await uploadOwnVoiceIntro(localBlob, ext);
      await updateOwnProfile({ voice_intro_url: path });
      onSaved({ voice_intro_url: path });
      onNext();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save recording.");
    } finally {
      setSaving(false);
    }
  };

  const submitLabel = localBlob
    ? "Save & continue"
    : profile.voice_intro_url
      ? "Continue"
      : "Continue";
  const disableSubmit = state === "recording" || (!localBlob && !profile.voice_intro_url);

  return (
    <StepShell
      onBack={onBack}
      canGoBack={canGoBack}
      submitting={saving}
      submitType="button"
      onSubmitClick={save}
      submitLabel={submitLabel}
      disableSubmit={disableSubmit}
      error={error}
    >
      <div className="space-y-2">
        <Label className="text-app-ink">Voice intro (up to {VOICE_INTRO_MAX_SECONDS}s)</Label>
        <p className="text-xs text-app-ink/60">
          Say hi, share your name, and a sentence about your walk.
        </p>
      </div>

      <div className="flex flex-col items-center gap-3 rounded-md border border-app-ink/10 bg-card/60 p-4">
        <div className="font-mono text-3xl text-app-ink">
          {String(seconds).padStart(2, "0")}s / {VOICE_INTRO_MAX_SECONDS}s
        </div>
        {state === "recording" ? (
          <Button
            type="button"
            onClick={stop}
            className="bg-app-warn text-app-on-primary hover:bg-app-warn/90"
          >
            Stop
          </Button>
        ) : (
          <Button
            type="button"
            onClick={start}
            className="bg-app-primary text-app-on-primary hover:bg-app-primary/90"
          >
            {state === "recorded" || localUrl || existingUrl ? "Re-record" : "Record"}
          </Button>
        )}
      </div>

      {localUrl ? (
        <div className="space-y-1">
          <Label className="text-app-ink">Preview</Label>
          <audio controls src={localUrl} className="w-full" />
          <button
            type="button"
            onClick={reset}
            className="text-xs text-app-ink/70 underline underline-offset-2"
          >
            Discard recording
          </button>
        </div>
      ) : existingUrl ? (
        <div className="space-y-1">
          <Label className="text-app-ink">Your saved intro</Label>
          <audio controls src={existingUrl} className="w-full" />
        </div>
      ) : null}
    </StepShell>
  );
}
