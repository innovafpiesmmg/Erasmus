import type { Request, Response, NextFunction } from "express";
import { eq } from "drizzle-orm";
import { db, mobilitiesTable, partnersTable } from "@workspace/db";

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

function buildOgHtml(
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

function getSiteUrl(req: Request): string {
  const proto = (req.headers["x-forwarded-proto"] as string) || req.protocol || "https";
  const host = (req.headers["x-forwarded-host"] as string) || req.headers.host || "localhost";
  return `${proto}://${host}`;
}

export async function ogCrawlerMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const ua = req.headers["user-agent"] ?? "";
  const urlPath = req.path;
  const match = urlPath.match(/^\/movilidades\/(\d+)$/);

  if (!match || !isCrawler(ua)) {
    return next();
  }

  const id = Number(match[1]);

  try {
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

    const siteUrl = getSiteUrl(req);
    const html = buildOgHtml(
      {
        theme: mobility[0].theme,
        description: mobility[0].description ?? null,
        headerImageUrl: mobility[0].headerImageUrl ?? null,
        partner: partner[0] ? { name: partner[0].name } : null,
      },
      id,
      siteUrl
    );

    res.status(200)
      .set("Content-Type", "text/html; charset=utf-8")
      .set("Cache-Control", "public, max-age=300, s-maxage=300")
      .end(html);
  } catch {
    next();
  }
}
