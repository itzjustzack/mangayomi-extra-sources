# Zack's Personal Mangayomi Extensions

One repository for all four personal extensions.

| Source | Type | Version | Preserved source ID |
|---|---|---|---|
| Asura Scans | Manga | 0.0.15 | 2847619031 |
| Atsumaru Personal | Manga | 0.0.4 | 3971268045 |
| Weeb Central Personal | Manga | 0.0.2 | 2363170537 |
| NovelFire Personal | Novel | 0.0.2 | 3749199444 |

## One catalogue link

https://raw.githubusercontent.com/itzjustzack/mangayomi-extra-sources/main/index.json

In Mangayomi, add this same URL under both Manga repositories and Novel repositories in Settings > Browse. Mangayomi filters the list by item type. No anime extensions are included in this personal catalogue; other community extensions keep their existing repositories.

Already using the manga_index.json and novel_index.json links from this repository? Those remain supported and now list all personal sources for that type.

Refresh Extensions and update installed personal extensions. Names, IDs, types, base URLs, and source implementations are preserved; this is a metadata relocation, not a source migration. Do not uninstall the extensions or migrate the library.

Older Asura/Atsumaru repository index links are retained as compatibility catalogues pointing to these unified source files. Their old source files are preserved. Once updates work through the new catalogue, the older repository entries can be removed from Mangayomi's repository settings.

## What changed

Asura and Atsumaru source files now live here alongside Weeb Central and NovelFire. Version numbers were bumped so installed extensions can pick up the new URLs. index.json contains all four, manga_index.json contains the three manga sources, and novel_index.json contains NovelFire.

## Validation and limits

Consolidation checks passed for unique source IDs, matching manifest/embedded metadata, valid JavaScript, filter initialization, and byte-identical implementation bodies after the metadata declaration. No live-library records were changed. On-device update/repository reassignment still needs verification.

Weeb Central previously passed live browsing, pagination, latest, search, empty results, filters, chapter lists, and first-image loading. NovelFire search fixes passed; reader requests encountered rate limiting and inconsistent responses. A fetched live chapter parsed into 96 paragraphs, but end-to-end reader reliability remains unverified. Upstream NovelFire long-catalogue URL synthesis is retained; generated links are not individually verified.

## Credits

Weeb Central and NovelFire derive from Mallyd11/mangayomi-anime-extensions under Apache-2.0; see LICENSE and NOTICE. Original source comments and attribution are retained.
