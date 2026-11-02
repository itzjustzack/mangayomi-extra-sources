# Zack's Personal Mangayomi Extensions

One repository for all six personal extensions.

| Source | Type | Version | Preserved source ID |
|---|---|---|---|
| Asura Scans | Manga | 0.0.17 | 2847619031 |
| Atsumaru Personal | Manga | 0.0.4 | 3971268045 |
| Weeb Central Personal | Manga | 0.0.2 | 2363170537 |
| NovelFire Personal | Novel | 0.0.2 | 3749199444 |
| AnimeParadise Personal | Anime | 0.0.2 | 4182889351 |
| Comix Personal | Manga | 0.0.4 | 3689042176 |

## One catalogue link

https://raw.githubusercontent.com/itzjustzack/mangayomi-extra-sources/main/index.json

In Mangayomi, add this same URL under Manga, Anime, and Novel repositories in Settings > Browse. Mangayomi filters the list by item type. Other community extensions keep their existing repositories.

Already using the manga_index.json and novel_index.json links from this repository? Those remain supported and now list all personal sources for that type.

Refresh Extensions and update installed personal extensions. Names, IDs, types, base URLs, and source implementations are preserved; this is a metadata relocation, not a source migration. Do not uninstall the extensions or migrate the library.

Older Asura/Atsumaru repository index links are retained as compatibility catalogues pointing to these unified source files. Their old source files are preserved. Once updates work through the new catalogue, the older repository entries can be removed from Mangayomi's repository settings.

## What changed

Asura and Atsumaru source files now live here alongside Weeb Central and NovelFire. Version numbers were bumped so installed extensions can pick up the new URLs. index.json contains all five, manga_index.json contains the three manga sources, novel_index.json contains NovelFire, and anime_index.json contains AnimeParadise Personal.

## Validation and limits

Consolidation checks passed for unique source IDs, matching manifest/embedded metadata, valid JavaScript, filter initialization, and byte-identical implementation bodies after the metadata declaration. No live-library records were changed. On-device update/repository reassignment still needs verification.

Weeb Central previously passed live browsing, pagination, latest, search, empty results, filters, chapter lists, and first-image loading. NovelFire search fixes passed; reader requests encountered rate limiting and inconsistent responses. A fetched live chapter parsed into 96 paragraphs, but end-to-end reader reliability remains unverified. Upstream NovelFire long-catalogue URL synthesis is retained; generated links are not individually verified.

## Credits

Weeb Central and NovelFire derive from Mallyd11/mangayomi-anime-extensions under Apache-2.0; see LICENSE and NOTICE. Original source comments and attribution are retained.

## AnimeParadise Personal

Add the same index.json link under Anime repositories, refresh Anime Extensions and install AnimeParadise Personal. The separate anime_index.json alias is also available.

Fixed upstream search pagination and URL encoding; added explicit app headers and latest support, title metadata, subtitles on every quality, and preferred-resolution ordering. Filters include genre, season, and year.

Live checks on 2026-10-26 passed for catalogue/search pagination, latest, empty search, genre filtering, Naruto (220 episodes) and Solo Leveling / Ore Dake Level Up na Ken (12 episodes). Both sample episode streams returned HLS playlists and more than 64 KB of MPEG-TS segment bytes; subtitle tracks were present. This verifies network/media reachability, not decoded audiovisual playback in the iPhone player. CDN responses label TS data as image/jpeg; packet signatures confirmed the actual media format. Provider or proxy availability can change.

## AnimeParadise 0.0.2 fixes

Popular now uses the site's POPULARITY sort; Recently added anime uses POST_DATE. The older JSON sort parameter was ignored by the API, causing identical lists. Recently added episode mode remains available in source preferences.

Episode dates now use the source airDate when supplied and explicitly return an empty string when missing or invalid. This prevents Mangayomi from filling missing dates with the current time for newly loaded episodes. The tested Naruto episode-list API provides no dates for all 220 episodes, so their correct representation is unknown/blank. No dates are invented from episode numbers or database IDs.

Existing episode rows may retain dates already cached by Mangayomi; the inspected client updater preserves existing dateUpload values when refreshing rows. This extension release cannot by itself guarantee removal of those old cached dates. Do not delete series or reading progress to clear dates.

Validation passed for distinct live Popular/Latest lists, popular pagination, ISO/seconds/milliseconds conversion, unknown/invalid dates, and date mapping. Playback implementation is unchanged from the user-confirmed working 0.0.1 version.

## Comix Personal 0.0.1

Refresh Manga Extensions and install **Comix Personal** from this repository. No new repository URL is needed. This is a separate source; existing Comix library entries are not migrated or renamed.

Uses the current rendered Comix browse, title, chapter and reader pages through Mangayomi's built-in WebView bridge. The retired /api/v2 source is not used. Popular, Latest, search, sorting, type and genre filters are included. Scanlator uploads are kept separately. Unknown upload dates stay blank. Incomplete chapter or image loading returns an error instead of a shortened list. Large chapter catalogues may take several minutes. Version 0.0.2 loads chapter-list pages individually; a failed page stops with an error rather than returning a partial list.

If Comix requests verification, open Webview and complete it yourself. The source does not solve challenges automatically. No Comix account is required for public titles.

Validation on 2026-11-01: live browser browse and title search; empty search; title details; a four-entry chapter list; Midwood pagination (20 entries per page); old and newly uploaded reader chapters (43 and 36 page slots, first three images loaded in each); direct sample image request (HTTP 200, image/webp). JavaScript tests against captured live page fixtures passed for browse extraction, empty results, small complete chapters, refusal of incomplete lists, URL validation, query/filter encoding, reader order and verification errors.

**Limit:** the complete extension has not yet been tested inside Mangayomi on iPhone. Headless WebView behavior, full-chapter lazy image collection, very large chapter lists, and all image hosts remain to be verified there. Treat this first release as experimental. Do not migrate an existing library until reading is confirmed on-device.

## Comix Personal 0.0.2: large chapter lists

Replaces the single-session, scripted-click chapter walk with direct page-by-page WebView loads. Each title page has its own 55-second script timeout (65-second bridge limit), and the final result must match the website's reported total. Repeated, missing or unexpected pages abort with an error. A versioned source-file URL avoids downloading a cached 0.0.1 implementation. The source name and ID are unchanged.

Live inspection found Eleceed has 1,370 scanlator chapter entries (69 pages) and God-level Assassin, I'm the Shadow has 315 (16 pages). A first full load can take several minutes; keep Mangayomi open. Original source 0.0.1 had an overall four-minute limit, which was too short for large lists. Reader implementation is unchanged.

Tests passed against captured live pages for both reported titles and direct chapter page 2. A simulated full 69-page run collected all 1,370 entries, while repeated/wrong pages were rejected. Native iPhone loading still needs confirmation; these tests do not claim a live 69-page on-device run.

## Comix Personal 0.0.3: reader image compatibility

Reader pages now download images in the reader WebView and convert them to JPEG data URIs before passing them to Mangayomi. This avoids a second image-host request by the native reader and normalizes the image format. Very large individual images are proportionally reduced to at most 12 million pixels. Source identity and chapter-list handling are preserved.

The user confirmed 0.0.2 chapter lists load, but God-level Assassin chapters 1 and 2 showed image errors after loading. Sample original images returned valid WebP files outside the app, so the precise native failure has not been reproduced. Browser tests verify actual JPEG conversion and decoding for samples from both reported chapters; captured-page tests verify reader ordering and the existing browse/chapter behavior. The iPhone reader and full-chapter bridge payload still need on-device confirmation. This release is a compatibility workaround, not a claim that the phone failure is conclusively fixed.

## Comix Personal 0.0.4: reader memory use

The user confirmed 0.0.3 displays images, but reported slow, choppy reading. The JPEG compatibility path is retained. Images are now resized to at most 900 pixels wide without upscaling, encoded at quality 0.82, and tall strips are divided into consecutive tiles at most 1,600 pixels high. This bounds each decoded tile to 1.44 million pixels (about 5.8 MB of RGBA data), compared with the previous 12-million-pixel ceiling. The tradeoff is modestly reduced image resolution and JPEG quality. Tall-strip splits change reader page counts, so a saved page position may land at a different place within a chapter; no library records are edited.

Four live image samples from God-level Assassin chapters 1 and 2 converted and decoded successfully in browser tests, using about 25% less encoded data in total than 0.0.3. Tests of tall and irregular image sizes verified continuous crop coverage, tile dimensions, original order and no upscaling. Existing captured-page browse and chapter tests passed. These checks measure image sizes and correctness, not iPhone frame rate. The full chapter is still collected before opening, so this release does not eliminate the initial chapter wait. On-device smoothness remains to be confirmed.
