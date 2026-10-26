# Personal Mangayomi extra sources

Weeb Central Personal and NovelFire Personal, based on the Apache-2.0 community sources maintained by Mallyd11.

## Add to Mangayomi

Add the manga repository in Settings > Browse:

https://raw.githubusercontent.com/itzjustzack/mangayomi-extra-sources/main/manga_index.json

Add the novel repository separately:

https://raw.githubusercontent.com/itzjustzack/mangayomi-extra-sources/main/novel_index.json

Install the Personal extension from each catalogue. These have separate source IDs and do not replace other installed extensions. Test browsing and reading before adding favorites; no library migration is required for trying them.

## Fixes

Weeb Central: safe searches when no pagination button exists; URL-encoded search text; default filters when none are supplied. Existing status, type, translation, sort, and tag filters retained.

NovelFire: search returns the primary result list rather than unrelated popular suggestions; missing chapter content produces an error rather than displaying a whole error/challenge page. Existing genre, sort, status, and long-catalogue behavior retained.

## Validation, 2026-10-26

Weeb Central live checks passed: popular, latest, page 2, title search, empty results, Manhwa + Martial Arts filters, chapter URLs, page list and first image (Solo Leveling, 201 chapters).

NovelFire live checks passed: popular, latest, page 2, title search, empty search after the fix, genre filter and chapter-list generation. Reader requests encountered rate limiting and inconsistent responses. A separately fetched live chapter was successfully parsed into 96 paragraphs; end-to-end reader reliability and on-device behavior remain unverified. Long chapter catalogues retain upstream URL synthesis when its fetch budget is exhausted; 3225 returned rows are not 3225 individually verified chapter links.

Focused regression checks passed for empty results, encoded punctuation, excluding suggestions, chapter cleanup and rejecting non-chapter pages.

Both extensions still need verification inside Mangayomi on the iPhone.
