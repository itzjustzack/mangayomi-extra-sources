# Zack's Personal Mangayomi Extensions

One repository for all six personal extensions.

| Source | Type | Version | Preserved source ID |
|---|---|---|---|
| Asura Scans | Manga | 0.0.17 | 2847619031 |
| Atsumaru Personal | Manga | 0.0.4 | 3971268045 |
| Weeb Central Personal | Manga | 0.0.2 | 2363170537 |
| NovelFire Personal | Novel | 0.0.2 | 3749199444 |
| AnimeParadise Personal | Anime | 0.0.2 | 4182889351 |
| Comix Personal | Manga | 0.0.8 | 3689042176 |

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

## Comix Personal 0.0.5: request lifecycle and reader cleanup

The user reported smoother but still jittery reading, slow opening and intermittent browsing stalls on 0.0.4. This release serializes WebView work per extension instance and shares identical in-flight requests. Successful browse responses are cached for 30 seconds and detail pages for five minutes, with at most 96 entries; returned values are copied so callers cannot corrupt cached pagination. Reader payloads are not cached. Empty, malformed or timed-out non-reader loads get one fresh-WebView retry. Verification errors are not retried automatically. Browse polling now stops after 20 seconds, with a 30-second bridge limit per attempt.

Injected scripts now keep lexical declarations inside an invocation scope, so repeated onLoadStop events cannot fail with global const redeclaration. Completed browse/detail responses can be delivered again safely. Reader conversion now removes original image src/srcset references after each successful conversion, allowing the hidden WebView to release the site's decoded copies. Actual memory reclamation depends on WebView implementation; this does not measure an iPhone memory reduction.

Tests passed for serialization, deduplication, cache expiry and isolation, timeout recovery, queue recovery after errors, verification handling and repeated script execution. A real browser fixture converted two public chapter samples into three valid JPEG tiles and confirmed no original img[src] references remained. Captured-page and crop-coverage tests still pass. This does not prove that the intermittent phone stall or frame-rate issue is eliminated. Full-chapter preparation, large payload transfer and native data-URI handling remain limitations; first chapter opening can still be slow. Image dimensions/quality and tile boundaries are unchanged from 0.0.4.

## Comix Personal 0.0.6: reduce chapter-list and reader startup work

The user confirmed 0.0.5 is much better, but both chapter lists and reader startup remain slow across tested titles. Title requests now reuse each loaded WebView for up to three adjacent chapter-list pages using the site's normal pagination buttons. Each page must match its requested number, total and expected item count; duplicates are rejected. If navigation does not settle within eight seconds, only verified pages are returned to the extension, which continues from the next missing page in a fresh WebView. The final full catalogue must still match the reported total. This reduces browser startups without opening multiple WebViews or discarding scanlator entries.

Reader image downloading/conversion now runs as a bounded two-image pipeline instead of serially. Converted tiles stay in source order even when the later image finishes first; original image references are removed after conversion, as in 0.0.5. Image resolution, JPEG quality and tile boundaries are unchanged. Reader payloads remain uncached to avoid retaining large chapter strings. The full chapter still has to be prepared before returning its page list.

Tests passed for three-page fixture navigation, stalled-navigation fallback, unique entries and full simulated 1,370-entry catalogue collection in 23 WebView calls versus 69 previously. Reader tests verify two overlapping conversions, out-of-order completion with correct final order, and original-image cleanup. A browser test decoded three valid JPEG tiles from two real public chapter samples. Existing crop, request lifecycle, browse and chapter tests passed. Live Comix displayed a security verification prompt during this run, so complete live catalogue batching and iPhone timing/frame rate remain unverified; no challenge was automated. Fewer startups and overlapping transfers do not guarantee a specific speedup on the phone.

## Comix Personal 0.0.7: direct images and persistent complete lists

Investigation reproduced an image request failure tied to the previous source-wide Referer header. The same public image on pq4.gentlelivingnotes.site returned HTTP 403 with Referer: https://comix.to/ and HTTP 200 with a valid WebP without it. Three additional hosts were tested using a Dart-style User-Agent and the reader's image Accept header: pureandsimpleshop.site and simplelivingshop.site also rejected Referer; kkplayer.wtf accepted both. All four hosts returned valid WebP without Referer. This also matches the community Comix implementation's explicit removal of image Referer, reviewed as a primary reference; no upstream solver or capture implementation was copied.

Source-wide headers are now empty, so Mangayomi's native reader does not inherit the rejected Referer. The new default Direct reader captures ordered HTTPS image URLs as soon as the website supplies them, without waiting for image decode, downloading image blobs, JPEG conversion, resizing, tiling or a full encoded-image payload. The app can download/cache those original images itself. Collecting the complete URL list still requires the Comix reader WebView and lazy scrolling, so startup is not necessarily as fast as Asura. Individual image hosts or image formats may still behave differently on-device.

Source preferences include Reader mode: Direct (faster) and Compatibility (slower). Compatibility retains the previously working JPEG pipeline and its tile sizes. If direct images fail on the phone, choose Compatibility and reopen the chapter. No automatic native-image fallback is possible through the extension's current page-list interface. Direct mode returns original page counts, so saved positions based on compatibility tiles can land at a different place within the same chapter; no library records are modified.

Complete title/chapter results are cached in extension-local preferences for five minutes, across extension instances. Only fully collected and count-validated catalogues are written. The cache holds at most eight titles and 1.5 million serialized characters, excludes expired entries, and ignores storage failures. It contains source metadata only. Chapter list cache can be disabled in source preferences for a fresh check each time. Updates can otherwise remain unseen until that five-minute cache expires. First-time catalogue collection retains 0.0.6's paged/batched behavior and can still be slow.

Tests passed for direct links returned before image completion, correct ordering and empty image headers, absence of conversion calls, mode selection, persistent complete-list reuse, expiry, copy isolation and cache disable. A real browser test loaded three original WebPs from hosts that reject Referer and returned a 352-character URL payload; its prepared three-slot fixture collected links in 8 ms, which is not a whole-chapter or iPhone timing claim. Existing compatibility, crop, request lifecycle and chapter-batch tests passed. Native iPhone playback and first-time full live catalogue speed remain to be confirmed.

## Comix Personal 0.0.8: faster repeat chapter-list refreshes

The user confirmed the 0.0.7 direct reader is fixed. Reader functions, direct image headers, dimensions and compatibility mode are byte-identical to that working version. This release targets title/chapter-list loading.

Complete cached lists still return immediately for five minutes. After that, Faster refresh checks the newest 20 entries in one title-page load and reuses the previously complete list only when the reported total matches the known unique entries plus newly observed uploads, with at least one known overlapping entry. Fresh metadata and checked chapter rows replace old values. An unexplained increase, deletion, absence of overlap or expired full scan triggers full collection. Reuse does not reset the full-scan timestamp: a full scan is required after six hours. This improves repeat visits, not first-ever catalogue loading.

Limit: an older edit or a deletion replaced by an older addition with unchanged total and newest page can be missed until the next full scan. Choose Chapter list refresh > Full collection to avoid incremental reuse after the ordinary five-minute cache; disable Chapter list cache for a full collection on every opening. No partial list is written as a completed cache, and cache/storage failure does not overwrite a complete list.

Full collection now reuses each WebView for up to ten chapter-list pages within the existing bounded time budget, rather than up to three. A slow or stalled navigation returns its verified progress and resumes in another WebView. Navigation checks reacquire the chapter section each poll because React can replace the DOM element; waiting on the old detached element could waste eight seconds before fallback. Total count and duplicate checks remain enforced. This does not reduce Comix's number of 20-entry pages, but can reduce browser startups.

Checks passed for unchanged-list refresh, exact new-upload merging, fallback for older additions/deletions, six-hour expiry, full-collection preference and cache preservation after network errors. A captured-page fixture with synthetic continuation walked six pages despite replacing the chapter section each time. A simulated 1,370-entry catalogue needed seven ideal ten-page WebView batches versus the previous 23 three-page batches; this is not a live timing or guaranteed on-device batch count. All previous reader, request lifecycle, browse and image tests passed, and a source comparison verified the working reader functions are unchanged. Live full-catalogue speed and iPhone timings remain unverified.
