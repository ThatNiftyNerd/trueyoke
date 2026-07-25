import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { StepShell } from "./StepShell";
import {
  getPhotoSignedUrl,
  listOwnPhotos,
  uploadOwnPhoto,
  type PhotoRow,
} from "../api";
import {
  PHOTO_MAX_BYTES,
  PHOTO_MAX_COUNT,
  extensionForImage,
} from "../logic";

interface Props {
  onNext: () => void;
  onBack: () => void;
  canGoBack: boolean;
}

export function PhotosStep({ onNext, onBack, canGoBack }: Props) {
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
      let position = photos.length;
      const added: PhotoRow[] = [];
      const addedUrls: Record<string, string> = {};
      for (const file of files) {
        if (position >= PHOTO_MAX_COUNT) {
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
        const row = await uploadOwnPhoto(file, ext, position);
        added.push(row);
        const url = await getPhotoSignedUrl(row.storage_path);
        if (url) addedUrls[row.id] = url;
        position += 1;
      }
      if (added.length) {
        setPhotos((p) => [...p, ...added]);
        setPreviews((p) => ({ ...p, ...addedUrls }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  };

  const atCap = photos.length >= PHOTO_MAX_COUNT;

  return (
    <StepShell
      onBack={onBack}
      canGoBack={canGoBack}
      submitting={busy}
      submitType="button"
      onSubmitClick={onNext}
      submitLabel={photos.length ? "Continue" : "Skip for now"}
      error={error}
    >
      <div className="space-y-2">
        <Label className="text-brand-burgundy">
          Photos ({photos.length}/{PHOTO_MAX_COUNT})
        </Label>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          disabled={busy || atCap}
          onChange={onFileChange}
          className="block w-full text-sm text-brand-burgundy file:mr-3 file:rounded-md file:border-0 file:bg-brand-burgundy file:px-3 file:py-2 file:text-brand-linen"
        />
        <p className="text-xs text-brand-burgundy/60">JPG, PNG, or WEBP. Up to 5 MB each.</p>
      </div>

      {photos.length > 0 ? (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((p) => (
            <div
              key={p.id}
              className="aspect-square overflow-hidden rounded-md border border-brand-burgundy/10 bg-white/60"
            >
              {previews[p.id] ? (
                <img src={previews[p.id]} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full animate-pulse bg-brand-burgundy/5" />
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-brand-burgundy/60">No photos yet. This step is optional.</p>
      )}
    </StepShell>
  );
}
