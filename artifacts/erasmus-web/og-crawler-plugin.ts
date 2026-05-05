import type { Plugin, ViteDevServer, PreviewServer } from "vite";
import http from "http";
import https from "https";

const CRAWLER_PATTERNS = [
  /facebookexternalhit/i,
  /Twitterbot/i,
  /LinkedInBot/i,
  /WhatsApp/i,
  /TelegramBot/i,
  /Slackbot/i,
  /Googlebot/i,
  /bingbot/i,
  /Discordbot/i,
  /Applebot/i,
  /ia_archiver/i,
  /crawler/i,
  /spider/i,
];

function isCrawler(userAgent: string): boolean {
  return CRAWLER_PATTERNS.some((p) => p.test(userAgent));
}

function fetchJson(url: string): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith("https") ? https : http;
    const req = client.get(url, (res) => {
      let data = "";
      res.on("data", (chunk: Buffer) => (data += chunk));
      res.on("end", () => {
        if (res.statusCode === 200) {
          try {
            resolve(JSON.parse(data) as Record<string, unknown>);
          } catch {
            reject(new Error("Invalid JSON response"));
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}`));
        }
      });
    });
    req.on("error", reject);
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error("Request timed out"));
    });
  });
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

interface MobilityData {
  theme?: string;
  description?: string | null;
  headerImageUrl?: string | null;
  partner?: { name?: string } | null;
}

interface ActivityData {
  title?: string;
  description?: string | null;
  imageUrl?: string | null;
}

interface PartnerData {
  name?: string;
  city?: string;
  country?: string;
  logoUrl?: string | null;
  photoUrl?: string | null;
  isCoordinator?: boolean;
}

function toAbsoluteUrl(url: string | null | undefined, siteUrl: string): string {
  if (!url) return `${siteUrl}/opengraph.jpg`;
  if (/^https?:\/\//i.test(url)) return url;
  return `${siteUrl}${url.startsWith("/") ? "" : "/"}${url}`;
}

function buildPartnerOgHtml(partner: PartnerData, id: string, siteUrl: string): string {
  const title = `${partner.name ?? "Socio Erasmus+"} — Erasmus+ Platform`;
  const role = partner.isCoordinator ? "Centro coordinador" : "Centro socio";
  const location =
    partner.city && partner.country
      ? `${partner.city}, ${partner.country}`
      : (partner.country ?? "Europa");
  const description = `${role} Erasmus+ en ${location}.`;
  const image = toAbsoluteUrl(partner.logoUrl ?? partner.photoUrl, siteUrl);
  const url = `${siteUrl}/socios?partner=${id}`;

  return `<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <title>${escapeHtml(title)}</title>
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Erasmus+ Platform" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:url" content="${escapeHtml(url)}" />
    <meta property="og:image" content="${escapeHtml(image)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:image" content="${escapeHtml(image)}" />
    <meta http-equiv="refresh" content="0; url=${escapeHtml(url)}" />
  </head>
  <body>
    <p>Redirigiendo a <a href="${escapeHtml(url)}">${escapeHtml(title)}</a>...</p>
  </body>
</html>`;
}

function buildActivityOgHtml(activity: ActivityData, id: string, siteUrl: string): string {
  const title = `${activity.title ?? "Actividad Erasmus+"} — Erasmus+ Platform`;
  const description = activity.description
    ? activity.description.slice(0, 160)
    : "Actividad Erasmus+";
  const image = toAbsoluteUrl(activity.imageUrl, siteUrl);
  const url = `${siteUrl}/actividades/${id}`;

  return `<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <title>${escapeHtml(title)}</title>
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Erasmus+ Platform" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:url" content="${escapeHtml(url)}" />
    <meta property="og:image" content="${escapeHtml(image)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:image" content="${escapeHtml(image)}" />
    <meta http-equiv="refresh" content="0; url=${escapeHtml(url)}" />
  </head>
  <body>
    <p>Redirigiendo a <a href="${escapeHtml(url)}">${escapeHtml(title)}</a>...</p>
  </body>
</html>`;
}

function buildOgHtml(mobility: MobilityData, id: string, siteUrl: string): string {
  const title = `${mobility.theme ?? "Movilidad Erasmus+"} — Erasmus+ Platform`;
  const description = mobility.description
    ? mobility.description.slice(0, 160)
    : `Movilidad Erasmus+ en ${mobility.partner?.name ?? "destino internacional"}`;
  const image = toAbsoluteUrl(mobility.headerImageUrl as string | null | undefined, siteUrl);
  const url = `${siteUrl}/movilidades/${id}`;

  return `<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <title>${escapeHtml(title)}</title>
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Erasmus+ Platform" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:url" content="${escapeHtml(url)}" />
    <meta property="og:image" content="${escapeHtml(image)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:image" content="${escapeHtml(image)}" />
    <meta http-equiv="refresh" content="0; url=${escapeHtml(url)}" />
  </head>
  <body>
    <p>Redirigiendo a <a href="${escapeHtml(url)}">${escapeHtml(title)}</a>...</p>
  </body>
</html>`;
}

type ConnectMiddleware = (
  req: http.IncomingMessage,
  res: http.ServerResponse,
  next: () => void
) => void;

function createCrawlerMiddleware(apiPort: string): ConnectMiddleware {
  return async (req, res, next) => {
    const ua = (req.headers["user-agent"] as string) ?? "";
    const rawUrl = req.url ?? "";
    const [urlPath, queryString = ""] = rawUrl.split("?");

    if (!isCrawler(ua)) {
      return next();
    }

    const mobilityMatch = urlPath.match(/^\/movilidades\/(\d+)$/);
    const activityMatch = urlPath.match(/^\/actividades\/(\d+)$/);
    const partnerPathMatch = urlPath.match(/^\/socios\/(\d+)$/);
    const partnerQueryParam =
      urlPath === "/socios"
        ? new URLSearchParams(queryString).get("partner")
        : null;
    const partnerQueryId =
      partnerQueryParam && /^\d+$/.test(partnerQueryParam)
        ? partnerQueryParam
        : null;
    const partnerId = partnerPathMatch
      ? partnerPathMatch[1]
      : partnerQueryId;

    if (!mobilityMatch && !activityMatch && !partnerId) {
      return next();
    }

    const host = (req.headers["x-forwarded-host"] as string) || req.headers.host || "localhost";
    const proto = (req.headers["x-forwarded-proto"] as string) || "https";
    const siteUrl = `${proto}://${host}`;

    try {
      let html: string;

      if (mobilityMatch) {
        const id = mobilityMatch[1];
        const mobility = await fetchJson(
          `http://localhost:${apiPort}/api/mobilities/${id}`
        );
        html = buildOgHtml(mobility as MobilityData, id, siteUrl);
      } else if (activityMatch) {
        const id = activityMatch[1];
        const activity = await fetchJson(
          `http://localhost:${apiPort}/api/activities/${id}`
        );
        html = buildActivityOgHtml(activity as ActivityData, id, siteUrl);
      } else {
        const id = partnerId!;
        const partner = await fetchJson(
          `http://localhost:${apiPort}/api/partners/${id}`
        );
        html = buildPartnerOgHtml(partner as PartnerData, id, siteUrl);
      }

      res.statusCode = 200;
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("Cache-Control", "public, max-age=300, s-maxage=300");
      res.end(html);
    } catch {
      next();
    }
  };
}

export function ogCrawlerPlugin(options?: { apiPort?: string }): Plugin {
  const apiPort = options?.apiPort ?? process.env.API_PORT ?? "8080";

  const applyMiddleware = (server: ViteDevServer | PreviewServer) => {
    server.middlewares.use(createCrawlerMiddleware(apiPort));
  };

  return {
    name: "vite-plugin-og-crawler",
    configureServer: applyMiddleware,
    configurePreviewServer: applyMiddleware,
  };
}
