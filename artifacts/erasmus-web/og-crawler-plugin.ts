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

function toAbsoluteUrl(url: string | null | undefined, siteUrl: string): string {
  if (!url) return `${siteUrl}/opengraph.jpg`;
  if (/^https?:\/\//i.test(url)) return url;
  return `${siteUrl}${url.startsWith("/") ? "" : "/"}${url}`;
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
    const urlPath = (req.url ?? "").split("?")[0];
    const match = urlPath.match(/^\/movilidades\/(\d+)$/);

    if (!match || !isCrawler(ua)) {
      return next();
    }

    const id = match[1];

    try {
      const mobility = await fetchJson(
        `http://localhost:${apiPort}/api/mobilities/${id}`
      );
      const host = (req.headers["x-forwarded-host"] as string) || req.headers.host || "localhost";
      const proto = (req.headers["x-forwarded-proto"] as string) || "https";
      const siteUrl = `${proto}://${host}`;
      const html = buildOgHtml(mobility as MobilityData, id, siteUrl);

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
