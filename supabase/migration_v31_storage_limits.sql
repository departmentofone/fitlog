-- FitLog schema v31: size and type limits on photo uploads. Safe to run more than once.
--
-- Both photo buckets (progress-photos from v3, meal-photos from v17) were already private, with
-- each account limited to its own folder, but anything of any size could be uploaded there. The
-- app uploads photos straight from the camera, which are usually 3 to 12 MB, so the cap is 15 MB.
-- HEIC/HEIF are included for iPhones. Storage rejects anything else before it's saved.
update storage.buckets
set file_size_limit = 15 * 1024 * 1024,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
where id in ('progress-photos', 'meal-photos');

-- Check: both rows should show 15728640 and the five image types.
select id, public, file_size_limit, allowed_mime_types from storage.buckets where id in ('progress-photos', 'meal-photos');
