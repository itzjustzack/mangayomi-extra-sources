# Zack's Personal Mangayomi Extensions

One repository for all five personal extensions.

| Source | Type | Version | Preserved source ID |
|---|---|---|---|
| Asura Scans | Manga | 0.0.15 | 2847619031 |
| Atsumaru Personal | Manga | 0.0.4 | 3971268045 |
| Weeb Central Personal | Manga | 0.0.2 | 2363170537 |
| NovelFire Personal | Novel | 0.0.2 | 3749199444 |
| AnimeParadise Personal | Anime | 0.0.2 | 4182889351 |

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
