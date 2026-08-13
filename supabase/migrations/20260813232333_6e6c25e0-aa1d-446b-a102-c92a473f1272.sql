ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS city text;

UPDATE public.profiles
SET
  city = btrim(left(location_label, length(location_label) - strpos(reverse(location_label), ',') )),
  country = btrim(right(location_label, strpos(reverse(location_label), ',') - 1))
WHERE location_label IS NOT NULL
  AND strpos(reverse(location_label), ',') > 1
  AND length(btrim(left(location_label, length(location_label) - strpos(reverse(location_label), ',')))) > 0
  AND length(btrim(right(location_label, strpos(reverse(location_label), ',') - 1))) > 0;