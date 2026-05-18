import * as cheerio from "cheerio";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

const FETCH_TIMEOUT = 5000;

const REJECT_PATTERNS = [
  /no lyrics found/i,
  /lyrics not available/i,
  /we do not have the lyrics/i,
  /submit lyrics/i,
  /paroles introuvables/i,
  /n[ãa]o possui letra/i
];

function levenshtein(a: string, b: string) {
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) => [i]);
  for (let j = 0; j <= n; j++) dp[0]![j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i]![j] =
        a[i - 1] === b[j - 1] ? dp[i - 1]![j - 1]! : 1 + Math.min(dp[i - 1]![j]!, dp[i]![j - 1]!, dp[i - 1]![j - 1]!);
    }
  }
  return dp[m]![n]!;
}

function deburr(str: string) {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function titleMatches(requested: string, found: string) {
  const normalize = (s: string) =>
    deburr(s)
      .toLowerCase()
      .replace(/\(.*?\)/g, "")
      .replace(/\[.*?\]/g, "")
      .replace(/[^a-z0-9]/g, "");
  const a = normalize(requested);
  const b = normalize(found);
  if (!a || !b) return false;
  if (a === b) return true;
  if (a.includes(b) || b.includes(a)) return true;
  const dist = levenshtein(a, b);
  const maxLen = Math.max(a.length, b.length);
  return dist / maxLen <= 0.3;
}

function stripSectionTags(text: string) {
  return text
    .split("\n")
    .map((line) => line.replace(/^\s*\[.*?\]\s*/, "").trimEnd())
    .filter((line) => !/^\[.*?\]$/.test(line.trim()))
    .filter((line) => line.trim() !== "")
    .join("\n");
}

function cleanLyrics(text: string) {
  text = stripSectionTags(text.trim());
  text = text.replace(/\n{3,}/g, "\n\n");
  text = text.replace(/ +\n/g, "\n");
  if (text.length < 20) throw new Error("No lyrics found");
  if (text.length < 80 && REJECT_PATTERNS.some((re) => re.test(text))) {
    throw new Error("Scraped error message, not lyrics");
  }
  return text;
}

async function fetchHtml(url: string) {
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
    redirect: "follow",
    signal: AbortSignal.timeout(FETCH_TIMEOUT)
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const body = await res.text();
  return cheerio.load(body);
}

/**
 * Fetch lyrics from Genius for the given title and artist.
 */
export async function getGeniusLyrics(title: string, artistName: string): Promise<string> {
  const searchRes = await fetch(
    "https://genius.com/api/search/multi?q=" + encodeURIComponent(artistName + " " + title),
    {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(FETCH_TIMEOUT)
    }
  );
  if (!searchRes.ok) throw new Error(`HTTP ${searchRes.status}`);

  const data = (await searchRes.json()) as {
    response?: {
      sections?: {
        type: string;
        hits?: { result?: { title?: string; url?: string; primary_artist?: { name?: string } } }[];
      }[];
    };
  };

  const sections = data.response?.sections ?? [];
  const songSection = sections.find((s) => s.type === "song");
  const hits = songSection?.hits ?? [];
  if (hits.length === 0) throw new Error("No results");

  const matchingHits = hits.filter((hit) => titleMatches(title, hit.result?.title ?? ""));
  if (matchingHits.length === 0) throw new Error("No matching title");

  let bestHit = matchingHits[0]!;
  let bestScore = Infinity;
  for (const hit of matchingHits) {
    const score = levenshtein(artistName.toLowerCase(), (hit.result?.primary_artist?.name ?? "").toLowerCase());
    if (score < bestScore) {
      bestScore = score;
      bestHit = hit;
    }
  }

  const url = bestHit.result?.url;
  if (!url) throw new Error("No song URL");

  const $ = await fetchHtml(url);
  const containers = $('[data-lyrics-container="true"]');
  if (containers.length === 0) throw new Error("No lyrics container");

  let lyrics = "";
  containers.each((_, el) => {
    const $el = $(el).clone();
    $el.find('[data-exclude-from-selection="true"]').remove();
    $el.find("br").replaceWith("\n");
    lyrics += $el.text() + "\n";
  });

  return cleanLyrics(lyrics.trim());
}
