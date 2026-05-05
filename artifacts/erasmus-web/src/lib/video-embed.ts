export type VideoProvider = "youtube" | "vimeo" | "file";

export type VideoEmbedInfo = {
  provider: VideoProvider;
  id?: string;
  embedUrl?: string;
  posterUrl?: string | null;
};

const YT_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
  "youtu.be",
]);

const VIMEO_HOSTS = new Set([
  "vimeo.com",
  "www.vimeo.com",
  "player.vimeo.com",
]);

const DIRECT_FILE_RE = /\.(mp4|webm|mov|m4v|ogg|ogv)(\?.*)?$/i;

export function getVideoEmbedInfo(url: string | null | undefined): VideoEmbedInfo {
  if (!url) return { provider: "file" };
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { provider: "file" };
  }
  const host = parsed.hostname.toLowerCase();

  if (YT_HOSTS.has(host)) {
    let id: string | null = null;
    if (host === "youtu.be") {
      id = parsed.pathname.split("/").filter(Boolean)[0] ?? null;
    } else if (parsed.pathname === "/watch") {
      id = parsed.searchParams.get("v");
    } else {
      const segs = parsed.pathname.split("/").filter(Boolean);
      if (segs[0] === "embed" || segs[0] === "shorts" || segs[0] === "v" || segs[0] === "live") {
        id = segs[1] ?? null;
      }
    }
    if (id && /^[\w-]{6,}$/.test(id)) {
      return {
        provider: "youtube",
        id,
        embedUrl: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`,
        posterUrl: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
      };
    }
    return { provider: "file" };
  }

  if (VIMEO_HOSTS.has(host)) {
    let id: string | null = null;
    if (host === "player.vimeo.com") {
      const segs = parsed.pathname.split("/").filter(Boolean);
      if (segs[0] === "video" && segs[1]) id = segs[1];
    } else {
      const segs = parsed.pathname.split("/").filter(Boolean);
      const last = segs[segs.length - 1];
      if (last && /^\d+$/.test(last)) id = last;
    }
    if (id && /^\d+$/.test(id)) {
      return {
        provider: "vimeo",
        id,
        embedUrl: `https://player.vimeo.com/video/${id}?autoplay=1`,
        posterUrl: null,
      };
    }
    return { provider: "file" };
  }

  return { provider: "file" };
}

export function isDirectVideoFile(url: string | null | undefined): boolean {
  if (!url) return false;
  return DIRECT_FILE_RE.test(url);
}

export function isSupportedVideoUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const info = getVideoEmbedInfo(url);
  if (info.provider === "youtube" || info.provider === "vimeo") return true;
  return isDirectVideoFile(url);
}
