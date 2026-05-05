import type { Request, Response, NextFunction } from "express";
import { eq } from "drizzle-orm";
import { LRUCache } from "lru-cache";
import { db, mobilitiesTable, partnersTable, activitiesTable } from "@workspace/db";

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

const OG_CACHE_TTL_MS = 5 * 60 * 1000;
const OG_CACHE_MAX_ENTRIES = 500;

const ogHtmlCache = new LRUCache<string, string>({
  max: OG_CACHE_MAX_ENTRIES,
  ttl: OG_CACHE_TTL_MS,
});

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function toAbsoluteUrl(url: string | null | undefined, siteUrl: string): string {
  if (!url) return `${siteUrl}/opengraph.jpg`;
  if (/^https?:\/\//i.test(url)) return url;
  return `${siteUrl}${url.startsWith("/") ? "" : "/"}${url}`;
}

function buildMobilityOgHtml(
  mobility: { theme: string; description: string | null; headerImageUrl: string | null; partner: { name: string } | null },
  id: number,
  siteUrl: string
): string {
  const title = `${mobility.theme} — Erasmus+ Platform`;
  const description = mobility.description
    ? mobility.description.slice(0, 160)
    : `Movilidad Erasmus+ en ${mobility.partner?.name ?? "destino internacional"}`;
  const image = toAbsoluteUrl(mobility.headerImageUrl, siteUrl);
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

function buildActivityOgHtml(
  activity: { title: string; description: string | null; imageUrl: string | null },
  id: number,
  siteUrl: string
): string {
  const title = `${activity.title} — Erasmus+ Platform`;
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

function getSiteUrl(req: Request): string {
  const proto = (req.headers["x-forwarded-proto"] as string) || req.protocol || "https";
  const host = (req.headers["x-forwarded-host"] as string) || req.headers.host || "localhost";
  return `${proto}://${host}`;
}

function sendCachedHtml(res: Response, html: string): void {
  res
    .status(200)
    .set("Content-Type", "text/html; charset=utf-8")
    .set("Cache-Control", "public, max-age=300, s-maxage=300")
    .end(html);
}

export function clearOgCache(): void {
  ogHtmlCache.clear();
}

export async function ogCrawlerMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const ua = req.headers["user-agent"] ?? "";
  const urlPath = req.path;

  if (!isCrawler(ua)) {
    return next();
  }

  const mobilityMatch = urlPath.match(/^\/movilidades\/(\d+)$/);
  const activityMatch = urlPath.match(/^\/actividades\/(\d+)$/);

  if (!mobilityMatch && !activityMatch) {
    return next();
  }

  const siteUrl = getSiteUrl(req);

  try {
    if (mobilityMatch) {
      const id = Number(mobilityMatch[1]);
      const cacheKey = `mobility:${id}:${siteUrl}`;

      const cached = ogHtmlCache.get(cacheKey);
      if (cached) {
        return sendCachedHtml(res, cached);
      }

      const mobility = await db
        .select()
        .from(mobilitiesTable)
        .where(eq(mobilitiesTable.id, id))
        .limit(1);

      if (!mobility.length) {
        return next();
      }

      const partner = await db
        .select()
        .from(partnersTable)
        .where(eq(partnersTable.id, mobility[0].partnerId))
        .limit(1);

      const html = buildMobilityOgHtml(
        {
          theme: mobility[0].theme,
          description: mobility[0].description ?? null,
          headerImageUrl: mobility[0].headerImageUrl ?? null,
          partner: partner[0] ? { name: partner[0].name } : null,
        },
        id,
        siteUrl
      );

      ogHtmlCache.set(cacheKey, html);
      sendCachedHtml(res, html);
    } else {
      const id = Number(activityMatch![1]);
      const cacheKey = `activity:${id}:${siteUrl}`;

      const cached = ogHtmlCache.get(cacheKey);
      if (cached) {
        return sendCachedHtml(res, cached);
      }

      const activity = await db
        .select()
        .from(activitiesTable)
        .where(eq(activitiesTable.id, id))
        .limit(1);

      if (!activity.length) {
        return next();
      }

      const html = buildActivityOgHtml(
        {
          title: activity[0].title,
          description: activity[0].description ?? null,
          imageUrl: activity[0].imageUrl ?? null,
        },
        id,
        siteUrl
      );

      ogHtmlCache.set(cacheKey, html);
      sendCachedHtml(res, html);
    }
  } catch {
    next();
  }
}
