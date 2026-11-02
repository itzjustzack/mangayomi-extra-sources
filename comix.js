// Comix Personal for itzjustzack, 2026-11-01.
// Original implementation using Comix's rendered public pages and Mangayomi's WebView bridge.
// Does not use the retired /api/v2 endpoint or automate verification challenges.
const mangayomiSources = [{
  "name": "Comix Personal",
  "id": 3689042176,
  "lang": "en",
  "baseUrl": "https://comix.to",
  "apiUrl": "",
  "iconUrl": "https://www.google.com/s2/favicons?sz=128&domain=https://comix.to",
  "typeSource": "single",
  "itemType": 0,
  "isManga": true,
  "version": "0.0.2",
  "sourceCodeUrl": "https://raw.githubusercontent.com/itzjustzack/mangayomi-extra-sources/main/comix-v0.0.2.js",
  "isNsfw": false,
  "hasCloudflare": true,
  "dateFormat": "",
  "dateFormatLocale": "",
  "isFullData": false,
  "appMinVerReq": "0.5.0",
  "additionalParams": "",
  "sourceCodeLanguage": 1,
  "notes": "Personal Comix 0.0.2 - direct chapter pages; large titles can take several minutes."
}];

class DefaultExtension extends MProvider {
  get supportsLatest() { return true; }
  getHeaders() { return { Referer: this.source.baseUrl + "/" }; }
  async runPage(url, mode, requestedPage = 1) {
    if (typeof evaluateJavascriptViaWebview !== "function")
      throw new Error("This source needs Mangayomi's WebView support. Update Mangayomi first.");
    const script = "(" + comixPageTask.toString() + ")(" + JSON.stringify(mode) + "," + requestedPage + ");";
    let raw = await evaluateJavascriptViaWebview(url, this.getHeaders(), [script], mode === "reader" ? 240 : 65);
    if (!raw) throw new Error("Comix did not finish loading. Open the source in Webview, complete any verification yourself, then retry.");
    let result;
    try { result = JSON.parse(raw); if (typeof result === "string") result = JSON.parse(result); }
    catch (_) { throw new Error("Comix returned unreadable page data."); }
    if (result.error) throw new Error(result.error);
    return result;
  }
  browseUrl(page, sort, query, filters) {
    const pairs = [["page", String(Math.max(1, Number(page) || 1))], ["sort", sort]];
    if (query && query.trim()) { pairs.push(["q", query.trim()]); pairs[1][1] = "relevance:desc"; }
    for (const filter of filters || []) {
      const selected = filter.values && filter.values[filter.state];
      if (!selected || !selected.value) continue;
      if (filter.name === "Sort" && !(query && query.trim())) pairs[1][1] = selected.value;
      if (filter.name === "Type") pairs.push(["types", selected.value]);
      if (filter.name === "Genre") pairs.push(["genres_in", selected.value]);
    }
    return this.source.baseUrl + "/browse?" + pairs.map(p => encodeURIComponent(p[0]) + "=" + encodeURIComponent(p[1])).join("&");
  }
  async getPopular(page) { return this.runPage(this.browseUrl(page, "views_30d:desc"), "browse"); }
  async getLatestUpdates(page) { return this.runPage(this.browseUrl(page, "chapter_updated_at:desc"), "browse"); }
  async search(query, page, filters) { return this.runPage(this.browseUrl(page, "views_30d:desc", query, filters), "browse"); }
  normalizeUrl(value) {
    let path = String(value || "").split(/[?#]/)[0];
    if (/^https?:\/\//i.test(path)) {
      if (!/^https:\/\/(?:www\.)?comix\.(?:to|ws)\//i.test(path)) throw new Error("Not a Comix link.");
      path = path.replace(/^https?:\/\/[^/]+/i, "");
    }
    if (!path.startsWith("/")) path = "/" + path;
    if (!path.startsWith("/title/")) path = "/title" + path;
    if (!/^\/title\/[a-z0-9][a-z0-9-]*(?:\/\d+(?:-chapter-[\d.]+)?)?\/?$/i.test(path))
      throw new Error("Unrecognized Comix link. Search for the title in this source.");
    return this.source.baseUrl + path;
  }
  async getDetail(url) {
    const base = this.normalizeUrl(url);
    const first = await this.runPage(base + "?page=1", "detail", 1);
    const pagination = first.chapterPagination;
    if (!pagination || pagination.page !== 1) throw new Error("Comix did not load chapter page 1.");
    const chapters = new Map(first.chapters.map(c => [c.url, c]));
    for (let page = 2; page <= pagination.lastPage; page++) {
      const next = await this.runPage(base + "?page=" + page, "detail", page);
      if (!next.chapterPagination || next.chapterPagination.page !== page)
        throw new Error("Comix did not load chapter page " + page + ". Open Webview and retry.");
      const before = chapters.size;
      for (const chapter of next.chapters) chapters.set(chapter.url, chapter);
      if (chapters.size === before) throw new Error("Comix repeated a chapter page; retry loading the title.");
    }
    if (chapters.size !== pagination.total) throw new Error("The Comix chapter list changed or is incomplete. Retry the title.");
    first.chapters = [...chapters.values()].sort((a,b) => {
      const number = c => Number((/chapter-([\d.]+)/.exec(c.url) || [0,0])[1]);
      return number(b)-number(a);
    });
    delete first.chapterPagination;
    return first;
  }
  async getPageList(url) { const result = await this.runPage(this.normalizeUrl(url), "reader"); return result.pages; }
  getFilterList() {
    const select = (name, options) => ({type_name:"SelectFilter",name,state:0,values:options.map(p=>({type_name:"SelectOption",name:p[0],value:p[1]}))});
    return [
      select("Sort", [["Popular this month","views_30d:desc"],["Highest rated","score:desc"],["Latest update","chapter_updated_at:desc"],["Recently added","created_at:desc"],["Title A-Z","title:asc"]]),
      select("Type", [["Any",""],["Manga","manga"],["Manhwa","manhwa"],["Manhua","manhua"],["Other","other"]]),
      select("Genre", [["Any",""],["Action","6"],["Adventure","7"],["Comedy","9"],["Drama","11"],["Fantasy","12"],["Historical","14"],["Horror","15"],["Isekai","16"],["Mystery","20"],["Romance","23"],["Sci-Fi","24"],["Slice of Life","25"],["Sports","26"],["Thriller","28"],["Wuxia","30"]])
    ];
  }
  getSourcePreferences() { return []; }
}

// Runs inside the app's own headless WebView, after the website loads.
async function comixPageTask(mode, requestedPage = 1) {
  if (window.__zackComixRunning) return;
  window.__zackComixRunning = true;
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  const started = Date.now();
  const limit = mode === "reader" ? 220000 : 55000;
  let stage = mode === "detail" ? "title metadata" : mode;
  const text = el => (el && el.textContent || "").replace(/\s+/g, " ").trim();
  const send = value => window.flutter_inappwebview.callHandler("setResponse", JSON.stringify(value));
  const deadline = () => {
    if (Date.now() - started >= limit) throw new Error("Comix timed out loading " + stage + ". Open Webview and retry.");
  };
  const check = () => {
    deadline();
    if (/\/@waf\/challenge/.test(location.pathname) ||
        (/verify you.re human|captcha required/i.test(document.body && document.body.innerText || "") && !document.querySelector(".mchap-row,.lrow,.card,.rpage-page")))
      throw new Error("Comix requires verification. Complete it yourself in Webview, then retry.");
  };
  const initial = () => {
    try { return JSON.parse(document.querySelector("#initial-data").textContent); } catch (_) { return null; }
  };
  const readManga = () => {
    const data = initial();
    if (!data) return null;
    return Object.values(data.queries || {}).find(v => v && !Array.isArray(v) && v.hid && v.title && v.synopsis !== undefined) || null;
  };
  const chapterRows = () => [...document.querySelectorAll(".mchap-row")].map(row => {
    const anchor = row.querySelector("a.mchap-row__primary");
    if (!anchor) return null;
    const url = anchor.getAttribute("href");
    const match = /\/(\d+)-chapter-([\d.]+)/.exec(url || "");
    if (!match) return null;
    const chapterTitle = text(row.querySelector(".mchap-row__title"));
    const time = row.querySelector("time[datetime]");
    let dateUpload = "";
    if (time) {
      const parsed = Date.parse(time.getAttribute("datetime"));
      if (Number.isFinite(parsed)) dateUpload = String(parsed);
    }
    return {name:"Chapter " + match[2] + (chapterTitle ? ": " + chapterTitle : ""),url,
      scanlator:text(row.querySelector(".mchap-row__group")),dateUpload,number:Number(match[2])};
  }).filter(Boolean);
  try {
    if (mode === "browse") {
      let previous = "", stable = 0;
      while (true) {
        check();
        const cards = [...document.querySelectorAll("a[href]")].filter(a => /^\/title\/[a-z0-9]+-[^/]+$/i.test(a.getAttribute("href") || ""));
        const seen = new Map();
        for (const a of cards) {
          const path = a.getAttribute("href");
          let card = a;
          for (let i = 0; i < 5 && card && !card.querySelector("img"); i++) card = card.parentElement;
          const img = card && card.querySelector("img");
          const name = a.getAttribute("aria-label") || a.getAttribute("title") || text(a);
          if (!seen.has(path)) seen.set(path, {name:"",link:location.origin + path,imageUrl:""});
          const item = seen.get(path);
          if (name && !item.name) item.name = name;
          if (img && !item.imageUrl) item.imageUrl = img.getAttribute("data-src") || img.getAttribute("src") || "";
        }
        const list = [...seen.values()].filter(v => v.name && v.imageUrl);
        const signature = JSON.stringify(list);
        stable = signature === previous ? stable + 1 : 0; previous = signature;
        if (list.length && stable >= 3) {
          const next = document.querySelector('button[aria-label="Next page"]');
          const data = initial();
          const perPage = data && data.list && data.list.perPage || 28;
          return send({list,hasNextPage:next ? !next.disabled : list.length >= perPage});
        }
        if (!list.length && (document.querySelector(".list-empty") || /no (?:titles|results|items|manga)(?: were)? found|nothing found/i.test(document.body.innerText || ""))) return send({list:[],hasNextPage:false});
        await sleep(350);
      }
    }
    if (mode === "detail") {
      let manga = null;
      while (!(manga = readManga())) { check(); await sleep(300); }
      stage = "chapter-list page " + requestedPage;
      const expectedPath = manga.url;
      let rows = [], total = 0, lastPage = 1;
      while (true) {
        check();
        const section = document.querySelector(".mpage__chapters");
        rows = chapterRows().filter(row => row.url.startsWith(expectedPath + "/"));
        if (manga.hasChapters === false && section && /no chapters/i.test(text(section))) break;
        if (!rows.length || !section) { await sleep(400); continue; }
        const hint = text(section.querySelector(".mchap-foot__hint"));
        const counts = /Showing\s+([\d,]+)\s+to\s+([\d,]+)\s+of\s+([\d,]+)\s+items/i.exec(hint);
        const active = section.querySelector('button[aria-current="page"]');
        const activePage = Number(text(active)) || 1;
        if (activePage !== requestedPage) { await sleep(350); continue; }
        if (counts) {
          const from = Number(counts[1].replace(/,/g,""));
          const to = Number(counts[2].replace(/,/g,""));
          total = Number(counts[3].replace(/,/g,""));
          if (rows.length !== to-from+1) { await sleep(350); continue; }
          lastPage = Math.ceil(total / 20);
          if (from !== (requestedPage-1)*20+1) throw new Error("Unexpected Comix chapter pagination.");
        } else {
          if (section.querySelectorAll(".npager button").length > 1) { await sleep(350); continue; }
          total = rows.length; lastPage = 1;
        }
        break;
      }
      const chapters = rows.sort((a,b)=>b.number-a.number).map(({number,...chapter})=>chapter);
      const labels = list => (list || []).map(v=>v.title || v.name).filter(Boolean);
      const score = Number(manga.ratedAvg);
      return send({
        name:manga.title,link:location.origin + manga.url,
        imageUrl:manga.poster && (manga.poster.large || manga.poster.medium) || "",
        description:(score > 0 ? "Rating: " + score + "/10\n\n" : "") + (manga.synopsis || ""),
        author:labels(manga.authors).join(", "),artist:labels(manga.artists).join(", "),
        genre:[manga.type,...labels(manga.genres),...labels(manga.demographics),...labels(manga.formats)].filter(Boolean),
        status:({releasing:0,finished:1,on_hiatus:2,discontinued:3})[manga.status] ?? 5,chapters,
        chapterPagination:{page:requestedPage,total,lastPage}
      });
    }
    if (mode === "reader") {
      let slots = [];
      while (!(slots = [...document.querySelectorAll(".rpage-page[data-page]")]).length) { check(); await sleep(300); }
      const total = slots.length;
      const pages = new Map();
      const collect = () => {
        for (const slot of document.querySelectorAll(".rpage-page[data-page]")) {
          const img = slot.querySelector("img[src]");
          if (img && img.complete && img.naturalWidth > 0 && /^https?:\/\//i.test(img.src))
            pages.set(Number(slot.getAttribute("data-page")), {url:img.src,headers:{}});
        }
      };
      for (const slot of slots) {
        check(); collect();
        const index = Number(slot.getAttribute("data-page"));
        if (pages.has(index)) continue;
        slot.scrollIntoView({block:"center"});
        for (let attempt=0;attempt<60 && !pages.has(index);attempt++) { check();collect();await sleep(200); }
        if (!pages.has(index)) throw new Error("Comix page " + index + " did not load. Retry the chapter in Webview.");
      }
      collect();
      if (pages.size !== total) throw new Error("Comix returned an incomplete reader.");
      return send({pages:[...pages.entries()].sort((a,b)=>a[0]-b[0]).map(p=>p[1])});
    }
    throw new Error("Unsupported Comix operation.");
  } catch (error) { return send({error:String(error.message || error)}); }
}
