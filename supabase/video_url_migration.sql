alter table public.listings add column if not exists video_url text;

comment on column public.listings.video_url is 'Optional public video URL for the listing, such as YouTube, Instagram, TikTok or Drive.';
