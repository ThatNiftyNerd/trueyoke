-- The `public-releases` bucket holds published, signed release APKs.
-- NOTE: this workspace blocks `public = true` buckets, so the bucket is private
-- and readability is granted explicitly below. Read-only: there is deliberately
-- NO insert/update/delete policy for anon or authenticated on this bucket --
-- the only writer is the service-role key used inside the
-- `request-apk-upload` edge function, matching the trust model of
-- `publish-release-manifest`. Unauthenticated browsers download through the
-- `download-apk` edge function, which redirects to a short-lived signed URL.
CREATE POLICY "public_releases_read_anon"
ON storage.objects FOR SELECT TO anon
USING (bucket_id = 'public-releases');

CREATE POLICY "public_releases_read_authenticated"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'public-releases');