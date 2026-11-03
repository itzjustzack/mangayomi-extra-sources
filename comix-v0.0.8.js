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
  "version": "0.0.8",
  "sourceCodeUrl": "https://raw.githubusercontent.com/itzjustzack/mangayomi-extra-sources/main/comix-v0.0.8.js",
  "isNsfw": false,
  "hasCloudflare": true,
  "dateFormat": "",
  "dateFormatLocale": "",
  "isFullData": false,
  "appMinVerReq": "0.5.0",
  "additionalParams": "",
  "sourceCodeLanguage": 1,
  "notes": "Personal Comix 0.0.8 - incremental chapter refresh and longer browser reuse; direct reader retained."
}];

class DefaultExtension extends MProvider {
  get supportsLatest() { return true; }
  // Image hosts reject Referer. These headers are also used by native readers.
  getHeaders() { return {}; }
  preference(key,fallback) {
    try { return new SharedPreferences().get(key) || fallback; } catch (_) { return fallback; }
  }
  async cachedCatalogue(base,value,options={}) {
    if (this.preference("comix_catalogue_cache","300") === "0" || typeof SharedPreferences !== "function") return null;
    try {
      const prefs = new SharedPreferences();
      const raw = await prefs.getString("comix_complete_catalogues_v1","[]");
      const saved = JSON.parse(raw);
      if (!Array.isArray(saved)) return null;
      const fullScanAt = item=>Number(item.fullScanAt || item.expires-300000);
      let entries = saved.filter(item=>item && fullScanAt(item)>Date.now()-21600000 && item.data && Array.isArray(item.data.chapters));
      if (!value) {
        const found=entries.find(item=>item.base===base);
        if (!found) return null;
        if (options.allowStale) return {...found,fullScanAt:fullScanAt(found)};
        return found.expires>Date.now() ? found.data : null;
      }
      entries = [{base,expires:Date.now()+300000,fullScanAt:options.fullScanAt || Date.now(),data:value},...entries.filter(item=>item.base!==base)].slice(0,8);
      let json=JSON.stringify(entries);
      while (json.length>1500000 && entries.length>1) { entries.pop();json=JSON.stringify(entries); }
      if (json.length<=1500000) await prefs.setString("comix_complete_catalogues_v1",json);
    } catch (_) { /* Cache failure must not prevent reading. */ }
    return null;
  }
  async runPage(url, mode, requestedPage = 1) {
    const key = mode + ":" + requestedPage + ":" + url;
    this._pageCache = this._pageCache || new Map();
    this._pendingPages = this._pendingPages || new Map();
    const cached = this._pageCache.get(key);
    if (cached && cached.expires > Date.now()) return JSON.parse(cached.json);
    if (cached) this._pageCache.delete(key);
    if (this._pendingPages.has(key)) return JSON.parse(await this._pendingPages.get(key));
    const task = (this._webviewQueue || Promise.resolve()).catch(()=>{}).then(async()=>{
      let result;
      for (let attempt=0;attempt<2;attempt++) {
        try { result = await this.loadPage(url,mode,requestedPage);break; }
        catch (error) {
          if (attempt || mode.startsWith("reader") || !/did not finish|unreadable page data|timed out/i.test(String(error.message))) throw error;
        }
      }
      const json = JSON.stringify(result);
      if (!mode.startsWith("reader")) {
        this._pageCache.set(key,{json,expires:Date.now()+(mode === "browse" ? 30000 : 300000)});
        while (this._pageCache.size > 96) this._pageCache.delete(this._pageCache.keys().next().value);
      }
      return json;
    });
    // Queue only completion, so the queue does not retain the chapter payload.
    this._webviewQueue = task.then(()=>{},()=>{});
    this._pendingPages.set(key,task);
    try { return JSON.parse(await task); }
    finally { this._pendingPages.delete(key); }
  }
  async loadPage(url, mode, requestedPage = 1) {
    if (typeof evaluateJavascriptViaWebview !== "function")
      throw new Error("This source needs Mangayomi's WebView support. Update Mangayomi first.");
    // onLoadStop can run more than once; lexical bindings must be invocation-local.
    const script = "(()=>{const comixImagePages = " + comixImagePages.toString() + ";const comixPageTask = " +
      comixPageTask.toString() + ";return " + (mode === "detailBatch" ?
      "(" + comixDetailBatchTask.toString() + ")(" + requestedPage + ");})();" :
      "comixPageTask(" + JSON.stringify(mode) + "," + requestedPage + ");})();");
    let raw = await evaluateJavascriptViaWebview(url, {}, [script], mode.startsWith("reader") ? 240 : mode === "browse" ? 30 : 65);
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
    const cached = await this.cachedCatalogue(base);
    if (cached) return cached;
    const stale = this.preference("comix_chapter_refresh","smart") === "full" ? null :
      await this.cachedCatalogue(base,undefined,{allowStale:true});
    // Recheck the newest page before reusing any older chapter entries.
    const first = await this.runPage(base + "?page=1",stale ? "detail" : "detailBatch",1);
    const pagination = first.chapterPagination;
    if (!pagination || pagination.page !== 1) throw new Error("Comix did not load chapter page 1.");
    if (stale) {
      const known = new Map(stale.data.chapters.map(chapter=>[chapter.url,chapter]));
      const newChapters = first.chapters.filter(chapter=>!known.has(chapter.url));
      const overlaps = first.chapters.some(chapter=>known.has(chapter.url));
      // A count increase beyond the new entries in the checked page means
      // older additions may exist; collect everything instead of guessing.
      if (overlaps && known.size === stale.data.chapters.length && pagination.total === known.size+newChapters.length) {
        for (const chapter of first.chapters) known.set(chapter.url,chapter);
        first.chapters = [...known.values()].sort((a,b)=>{
          const number=c=>Number((/chapter-([\d.]+)/.exec(c.url)||[0,0])[1]);
          return number(b)-number(a);
        });
        delete first.chapterPagination;
        await this.cachedCatalogue(base,first,{fullScanAt:stale.fullScanAt});
        return first;
      }
    }
    const chapters = new Map(first.chapters.map(c => [c.url, c]));
    let previousEnd = pagination.toPage || 1;
    if (previousEnd < 1 || previousEnd > pagination.lastPage) throw new Error("Invalid Comix chapter batch.");
    for (let page = previousEnd + 1; page <= pagination.lastPage;) {
      const next = await this.runPage(base + "?page=" + page, "detailBatch", page);
      if (!next.chapterPagination || next.chapterPagination.page !== page)
        throw new Error("Comix did not load chapter page " + page + ". Open Webview and retry.");
      if (next.chapterPagination.total !== pagination.total || next.chapterPagination.lastPage !== pagination.lastPage)
        throw new Error("The Comix chapter list changed. Retry the title.");
      const before = chapters.size;
      for (const chapter of next.chapters) chapters.set(chapter.url, chapter);
      if (chapters.size === before) throw new Error("Comix repeated a chapter page; retry loading the title.");
      const end = next.chapterPagination.toPage || page;
      if (end < page || end > pagination.lastPage) throw new Error("Invalid Comix chapter batch.");
      page = end + 1;
    }
    if (chapters.size !== pagination.total) throw new Error("The Comix chapter list changed or is incomplete. Retry the title.");
    first.chapters = [...chapters.values()].sort((a,b) => {
      const number = c => Number((/chapter-([\d.]+)/.exec(c.url) || [0,0])[1]);
      return number(b)-number(a);
    });
    delete first.chapterPagination;
    await this.cachedCatalogue(base,first);
    return first;
  }
  async getPageList(url) {
    const mode = this.preference("comix_reader_mode","direct") === "compatibility" ? "reader" : "readerDirect";
    const result = await this.runPage(this.normalizeUrl(url),mode);return result.pages;
  }
  getFilterList() {
    const select = (name, options) => ({type_name:"SelectFilter",name,state:0,values:options.map(p=>({type_name:"SelectOption",name:p[0],value:p[1]}))});
    return [
      select("Sort", [["Popular this month","views_30d:desc"],["Highest rated","score:desc"],["Latest update","chapter_updated_at:desc"],["Recently added","created_at:desc"],["Title A-Z","title:asc"]]),
      select("Type", [["Any",""],["Manga","manga"],["Manhwa","manhwa"],["Manhua","manhua"],["Other","other"]]),
      select("Genre", [["Any",""],["Action","6"],["Adventure","7"],["Comedy","9"],["Drama","11"],["Fantasy","12"],["Historical","14"],["Horror","15"],["Isekai","16"],["Mystery","20"],["Romance","23"],["Sci-Fi","24"],["Slice of Life","25"],["Sports","26"],["Thriller","28"],["Wuxia","30"]])
    ];
  }
  getSourcePreferences() {
    return [
      {key:"comix_reader_mode",listPreference:{title:"Reader mode",summary:"Direct loads original images. Compatibility prepares JPEG copies before opening.",valueIndex:0,entries:["Direct (faster)","Compatibility (slower)"],entryValues:["direct","compatibility"]}},
      {key:"comix_catalogue_cache",listPreference:{title:"Chapter list cache",summary:"Reuse complete lists for five minutes. Disable for a full collection every opening.",valueIndex:0,entries:["Five minutes","Disabled"],entryValues:["300","0"]}},
      {key:"comix_chapter_refresh",listPreference:{title:"Chapter list refresh",summary:"Faster checks newest entries and reuses known chapters for up to six hours. Full collection catches older edits or replacements sooner.",valueIndex:0,entries:["Faster refresh","Full collection"],entryValues:["smart","full"]}}
    ];
  }
}

// Reuse a loaded title page for up to ten adjacent chapter pages. If the
// site's navigation does not settle quickly, return only the verified batch;
// getDetail continues from the next page in a fresh WebView.
async function comixDetailBatchTask(requestedPage) {
  if (window.__zackComixResult) return window.flutter_inappwebview.callHandler("setResponse",window.__zackComixResult);
  if (window.__zackComixRunning) return;
  window.__zackComixRunning = true;
  const send = value => {
    window.__zackComixResult = JSON.stringify(value);
    return window.flutter_inappwebview.callHandler("setResponse",window.__zackComixResult);
  };
  const sleep = ms=>new Promise(resolve=>setTimeout(resolve,ms));
  const started = Date.now();
  try {
    const first = await comixPageTask("detail",requestedPage,value=>value);
    if (first.error) return send(first);
    const pagination = first.chapterPagination;
    const chapters = new Map();
    const add = (result,page) => {
      if (result.error) throw new Error(result.error);
      const p = result.chapterPagination;
      if (!p || p.page !== page || p.total !== pagination.total || p.lastPage !== pagination.lastPage ||
          result.chapters.length !== Math.min(20,p.total-(page-1)*20))
        throw new Error("Comix returned an incomplete chapter page.");
      for (const chapter of result.chapters) {
        if (chapters.has(chapter.url)) throw new Error("Comix repeated a chapter page.");
        chapters.set(chapter.url,chapter);
      }
    };
    add(first,requestedPage);
    let end = requestedPage;
    while (end < pagination.lastPage && end < requestedPage+9 && Date.now()-started < 35000) {
      const section = document.querySelector(".mpage__chapters");
      const next = section && ([...section.querySelectorAll(".npager button")].find(button=>Number(button.textContent.trim())===end+1) ||
        section.querySelector('button[aria-label="Next page"]'));
      if (!next || next.disabled) break;
      const previous = section.querySelector("a.mchap-row__primary");
      const previousUrl = previous && previous.getAttribute("href");
      next.click();
      const navigationStarted = Date.now();
      let ready = false;
      while (Date.now()-navigationStarted < 8000 && Date.now()-started < 45000) {
        // React may replace the section while switching pages.
        const current = document.querySelector(".mpage__chapters");
        const active = current && current.querySelector('.npager button[aria-current="page"]');
        const anchor = current && current.querySelector("a.mchap-row__primary");
        if (active && Number(active.textContent.trim()) === end+1 && anchor && anchor.getAttribute("href") !== previousUrl) { ready=true;break; }
        await sleep(150);
      }
      if (!ready) break;
      const result = await comixPageTask("detail",end+1,value=>value);
      add(result,end+1);end++;
    }
    first.chapters = [...chapters.values()];
    first.chapterPagination = {...pagination,toPage:end};
    return send(first);
  } catch (error) { return send({error:String(error.message || error)}); }
}

// Runs inside the app's own headless WebView, after the website loads.
async function comixPageTask(mode, requestedPage = 1, reply) {
  if (!reply && window.__zackComixResult) return window.flutter_inappwebview.callHandler("setResponse",window.__zackComixResult);
  if (!reply && window.__zackComixRunning) return;
  if (!reply) window.__zackComixRunning = true;
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  const started = Date.now();
  const limit = mode.startsWith("reader") ? 220000 : mode === "browse" ? 20000 : 55000;
  let stage = mode === "detail" ? "title metadata" : mode;
  const text = el => (el && el.textContent || "").replace(/\s+/g, " ").trim();
  const send = value => {
    if (reply) return reply(value);
    const json = JSON.stringify(value);
    // Do not retain a second full encoded chapter on the page's global object.
    if (!mode.startsWith("reader")) window.__zackComixResult = json;
    return window.flutter_inappwebview.callHandler("setResponse", json);
  };
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
    if (mode === "reader" || mode === "readerDirect") {
      let slots = [];
      while (!(slots = [...document.querySelectorAll(".rpage-page[data-page]")]).length) { check(); await sleep(300); }
      const total = slots.length;
      const pages = new Map();
      const imageUrls = new Map();
      const pending = [];
      const finish = async task => {
        const result = await task;
        if (result.error) throw result.error;
        pages.set(result.index,result.images.map(url=>({url,headers:{}})));
      };
      const collect = () => {
        for (const slot of document.querySelectorAll(".rpage-page[data-page]")) {
          const img = slot.querySelector("img[src]");
          if (img && (mode === "readerDirect" || (img.complete && img.naturalWidth > 0)) && /^https:\/\//i.test(img.src))
            imageUrls.set(Number(slot.getAttribute("data-page")), img.src);
        }
      };
      for (const slot of slots) {
        check(); collect();
        const index = Number(slot.getAttribute("data-page"));
        slot.scrollIntoView({block:"center"});
        for (let attempt=0;attempt<120 && !imageUrls.has(index);attempt++) { check();collect();if (!imageUrls.has(index)) await sleep(100); }
        if (!imageUrls.has(index)) throw new Error("Comix page " + index + " did not load. Retry the chapter in Webview.");
        stage = "reader image " + index + " of " + total;
        if (mode === "readerDirect") {
          pages.set(index,[{url:imageUrls.get(index),headers:{}}]);
          continue;
        }
        // At most two conversions run together. Each rejection is captured
        // immediately so a slow earlier page cannot leave it unhandled.
        pending.push(comixImagePages(imageUrls.get(index)).then(images=>{
          for (const img of slot.querySelectorAll("img")) {
            img.removeAttribute("srcset");img.removeAttribute("src");
          }
          return {index,images};
        },error=>({error})));
        if (pending.length >= 2) await finish(pending.shift());
      }
      for (const task of pending) await finish(task);
      collect();
      if (pages.size !== total) throw new Error("Comix returned an incomplete reader.");
      return send({pages:[...pages.entries()].sort((a,b)=>a[0]-b[0]).flatMap(p=>p[1])});
    }
    throw new Error("Unsupported Comix operation.");
  } catch (error) { return send({error:String(error.message || error)}); }
}

// Runs in the same WebView as the reader. JPEG data URIs avoid a second native
// image download and normalize image formats for the app's image decoder.
async function comixImagePages(url) {
  if (!/^https:\/\//i.test(url)) throw new Error("Comix returned an invalid image URL.");
  const controller = new AbortController();
  const abort = setTimeout(() => controller.abort(), 20000);
  let response;
  try {
    response = await fetch(url, {
      credentials:"omit",referrerPolicy:"no-referrer",cache:"force-cache",signal:controller.signal
    });
    if (!response.ok) throw new Error("Comix image returned HTTP " + response.status);
    const blob = await response.blob();
    if (!blob.size) throw new Error("Comix image was empty.");
    const objectUrl = URL.createObjectURL(blob);
    const img = new Image();
    try {
      await new Promise((resolve,reject) => {
        const timeout = setTimeout(() => reject(new Error("Comix image decoding timed out.")),15000);
        img.onload = () => { clearTimeout(timeout);resolve(); };
        img.onerror = () => { clearTimeout(timeout);reject(new Error("Comix delivered an unreadable image.")); };
        img.src = objectUrl;
      });
      if (!img.naturalWidth || !img.naturalHeight) throw new Error("Comix image has no dimensions.");
      // Bound decoded memory per reader tile instead of decoding long strips
      // into a single large texture while scrolling on a phone.
      const scale = Math.min(1,900/img.naturalWidth);
      const width = Math.max(1,Math.floor(img.naturalWidth*scale));
      const height = Math.max(1,Math.floor(img.naturalHeight*scale));
      const canvas = document.createElement("canvas");
      const tiles = [];
      try {
        for (let top=0;top<height;top+=1600) {
          canvas.width = width;canvas.height = Math.min(1600,height-top);
          const ctx = canvas.getContext("2d");
          if (!ctx) throw new Error("Image conversion is unavailable in this WebView.");
          ctx.fillStyle = "#ffffff";ctx.fillRect(0,0,canvas.width,canvas.height);
          // Adjacent crops share the same boundaries in the original image.
          const sourceTop = top*img.naturalHeight/height;
          const sourceHeight = canvas.height*img.naturalHeight/height;
          ctx.drawImage(img,0,sourceTop,img.naturalWidth,sourceHeight,0,0,width,canvas.height);
          const encoded = canvas.toDataURL("image/jpeg",0.82);
          if (!encoded.startsWith("data:image/jpeg;base64,")) throw new Error("Comix image conversion failed.");
          tiles.push(encoded);
        }
        return tiles;
      } finally { canvas.width=1;canvas.height=1; }
    } finally { img.src="";URL.revokeObjectURL(objectUrl); }
  } catch (error) {
    if (error && error.name === "AbortError") throw new Error("Comix image request timed out.");
    throw error;
  } finally { clearTimeout(abort); }
}


