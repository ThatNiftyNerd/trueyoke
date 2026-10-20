import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Label } from "@/components/ui/label";
import { StepShell } from "./StepShell";
import {
  deleteOwnPhoto,
  getPhotoSignedUrl,
  listOwnPhotos,
  uploadOwnPhoto,
  type PhotoRow,
} from "../api";
import { PHOTO_MAX_BYTES, PHOTO_MAX_COUNT, extensionForImage } from "../logic";

interface Props {
  onNext: () => void;
  onBack: () => void;
  canGoBack: boolean;
  /** Mentors must upload at least one photo — the step can't be skipped. */
  required?: boolean;
}

export function PhotosStep({ onNext, onBack, canGoBack, required = false }: Props) {
  const [photos, setPhotos] = useState<PhotoRow[]>([]);
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = await listOwnPhotos();
        if (cancelled) return;
        setPhotos(rows);
        const urls: Record<string, string> = {};
        await Promise.all(
          rows.map(async (p) => {
            const url = await getPhotoSignedUrl(p.storage_path);
            if (url) urls[p.id] = url;
          }),
        );
        if (!cancelled) setPreviews(urls);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load photos.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!files.length) return;
    setError(null);
    setBusy(true);
    try {
      const usedPositions = new Set(photos.map((p) => p.position));
      let count = photos.length;
      const added: PhotoRow[] = [];
      const addedUrls: Record<string, string> = {};
      for (const file of files) {
        if (count >= PHOTO_MAX_COUNT) {
          setError(`You can add up to ${PHOTO_MAX_COUNT} photos.`);
          break;
        }
        const ext = extensionForImage(file);
        if (!ext) {
          setError("Photos must be JPG, PNG, or WEBP.");
          continue;
        }
        if (file.size > PHOTO_MAX_BYTES) {
          setError("Each photo must be under 5 MB.");
          continue;
        }
        let position = 0;
        while (usedPositions.has(position)) {
          position += 1;
        }
        const row = await uploadOwnPhoto(file, ext, position);
        usedPositions.add(position);
        added.push(row);
        const url = await getPhotoSignedUrl(row.storage_path);
        if (url) addedUrls[row.id] = url;
        count += 1;
      }
      if (added.length) {
        setPhotos((p) => [...p, ...added].sort((a, b) => a.position - b.position));
        setPreviews((p) => ({ ...p, ...addedUrls }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async (photo: PhotoRow) => {
    if (busy) return;
    setError(null);
    setBusy(true);
    try {
      await deleteOwnPhoto(photo.id, photo.storage_path);
      setPhotos((prev) => prev.filter((item) => item.id !== photo.id));
      setPreviews((prev) => {
        const next = { ...prev };
        delete next[photo.id];
        return next;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove photo.");
    } finally {
      setBusy(false);
    }
  };

  const atCap = photos.length >= PHOTO_MAX_COUNT;
  const blocked = required && photos.length === 0;

  return (
    <StepShell
      onBack={onBack}
      canGoBack={canGoBack}
      submitting={busy}
      submitType="button"
      onSubmitClick={blocked ? undefined : onNext}
      disableSubmit={blocked}
      submitLabel={photos.length || required ? "Continue" : "Skip for now"}
      error={error}
    >
      <div className="space-y-2">
        <Label className="text-app-ink">
          Photos ({photos.length}/{PHOTO_MAX_COUNT})
        </Label>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          disabled={busy || atCap}
          onChange={onFileChange}
          className="block w-full text-sm text-app-ink file:mr-3 file:rounded-md file:border-0 file:bg-app-primary file:px-3 file:py-2 file:text-app-on-primary"
        />
        <p className="text-xs text-app-ink/60">JPG, PNG, or WEBP. Up to 5 MB each.</p>
      </div>

      {photos.length > 0 ? (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((p) => (
            <div
              key={p.id}
              className="relative aspect-square overflow-hidden rounded-md border border-app-ink/10 bg-card/60"
            >
              {previews[p.id] ? (
                <img
                  src={previews[p.id]}
                  alt="Your uploaded profile photo"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full animate-pulse bg-app-primary/5" />
              )}
              <button
                type="button"
                aria-label="Remove photo"
                disabled={busy}
                onClick={() => handleRemove(p)}
                className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-app-primary/80 text-app-on-primary shadow-sm hover:bg-app-primary disabled:opacity-50"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-app-ink/60">
          {required
            ? "Required — add at least one photo."
            : "No photos yet. This step is optional."}
        </p>
      )}
    </StepShell>
  );
}
