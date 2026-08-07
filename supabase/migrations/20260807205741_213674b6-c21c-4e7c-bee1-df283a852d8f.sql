CREATE TABLE public.bundle_releases (
  id uuid primary key default gen_random_uuid(),
  version_code integer not null,
  version_name text not null,
  platform text not null check (platform in ('android','web')),
  sha256_hash text not null,
  signature text not null,
  signing_pubkey_id text not null,
  release_notes text,
  published_at timestamptz not null default now()
);

GRANT SELECT ON public.bundle_releases TO authenticated;
GRANT ALL ON public.bundle_releases TO service_role;

ALTER TABLE public.bundle_releases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bundle_releases_authenticated_read"
ON public.bundle_releases
FOR SELECT
TO authenticated
USING (true);

CREATE INDEX bundle_releases_platform_version_idx
  ON public.bundle_releases (platform, version_code DESC);