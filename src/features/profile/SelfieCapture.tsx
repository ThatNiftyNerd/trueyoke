import { useEffect, useState } from "react";
import { hasAnyActiveMatch } from "@/features/matches/api";
import {
  getPhotoSignedUrl,
  listOwnPhotos,
  replaceOwnSelfie,
  type PhotoRow,
} from "@/features/profile/api";
import { PHOTO_MAX_BYTES, extensionForImage } from "@/features/profile/logic";

/**
 * Live selfie capture for "match" accounts. Renders nothing until the member
 * has at least one active match — before that there is no camera UI at all.
 * A match keeps exactly one current photo (see `replaceOwnSelfie`).
 */
export function SelfieCapture() {
  const [loading, setLoading] = useState(true);
  const [eligible, setEligible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photo, setPhoto] = useState<PhotoRow | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const ok = await hasAnyActiveMatch();
        if (!alive) return;
        setEligible(ok);
        if (!ok) return;
        const rows = await listOwnPhotos();
        if (!alive) return;
        const primary = rows.find((p) => p.position === 0) ?? null;
        setPhoto(primary);
        if (primary) {
          const url = await getPhotoSignedUrl(primary.storage_path);
          if (alive) setPreviewUrl(url);
        }
      } catch (err) {
        if (alive) setError(err instanceof Error ? err.message : "Could not load your photo.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    const ext = extensionForImage(file);
    if (!ext) {
      setError("Photos must be JPG, PNG, or WEBP.");
      return;
    }
    if (file.size > PHOTO_MAX_BYTES) {
      setError("Your photo must be under 5 MB.");
      return;
    }
    setSubmitting(true);
    try {
      const row = await replaceOwnSelfie(file, ext);
      setPhoto(row);
      setPreviewUrl(await getPhotoSignedUrl(row.storage_path));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your photo.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return null;
  if (!eligible) return null;

  return (
    <div className="rounded-md border border-app-ink/20 px-4 py-3 text-left">
      <h2 className="text-sm font-medium text-app-ink">Your photo</h2>

      <div className="mt-2 h-28 w-28 overflow-hidden rounded-md border border-app-ink/10 bg-app-primary/5">
        {previewUrl ? (
          <img
            src={previewUrl}
            alt="Your current profile photo"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center px-2 text-center text-xs text-app-ink/60">
            {photo ? "Loading…" : "No photo yet"}
          </div>
        )}
      </div>

      <label className="mt-3 block text-sm text-app-ink">
        <span className="block pb-1">Take a new photo</span>
        <input
          type="file"
          accept="image/*"
          capture="user"
          disabled={submitting}
          onChange={handleFile}
          className="block w-full text-sm text-app-ink file:mr-3 file:rounded-md file:border-0 file:bg-app-primary file:px-3 file:py-2 file:text-app-on-primary"
        />
      </label>
      {submitting ? <p className="mt-2 text-sm text-app-ink/60">Saving…</p> : null}

      {error ? (
        <p
          role="alert"
          className="mt-2 rounded-md border border-app-warn/40 bg-app-warn/10 px-3 py-2 text-sm text-app-warn"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
