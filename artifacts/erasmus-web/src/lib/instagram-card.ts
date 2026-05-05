export type StoryCardOptions = {
  kind: "actividad" | "movilidad";
  workPackage?: string | null;
  color: string;
  title: string;
  partnerName?: string | null;
  city?: string | null;
  country?: string | null;
  countryFlag?: string;
  startDate?: string | null;
  endDate?: string | null;
  imageUrl?: string | null;
  url: string;
  filenameSlug?: string;
};

const CARD_WIDTH = 1080;
const CARD_HEIGHT = 1920;
const FONT_STACK =
  '"Inter", system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.decoding = "async";
    let settled = false;
    const finish = (val: HTMLImageElement | null) => {
      if (settled) return;
      settled = true;
      resolve(val);
    };
    img.onload = () => finish(img);
    img.onerror = () => finish(null);
    setTimeout(() => finish(null), 6000);
    img.src = src;
  });
}

function darken(hex: string, amount = 0.55): string {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return "#0a1f4d";
  const r = Math.round(parseInt(m[1], 16) * (1 - amount));
  const g = Math.round(parseInt(m[2], 16) * (1 - amount));
  const b = Math.round(parseInt(m[3], 16) * (1 - amount));
  return `rgb(${r}, ${g}, ${b})`;
}

function wrapLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = word;
      if (lines.length === maxLines - 1) break;
    }
  }
  if (current && lines.length < maxLines) lines.push(current);

  if (lines.length === maxLines) {
    let last = lines[maxLines - 1];
    const remainingWords = words.slice(
      lines.slice(0, -1).reduce((acc, l) => acc + l.split(" ").length, 0) +
        last.split(" ").length,
    );
    if (remainingWords.length > 0) {
      const ellipsis = "…";
      while (
        last.length > 0 &&
        ctx.measureText(`${last}${ellipsis}`).width > maxWidth
      ) {
        last = last.slice(0, -1).trimEnd();
      }
      lines[maxLines - 1] = `${last}${ellipsis}`;
    }
  }

  return lines;
}

function formatDate(d?: string | null): string | null {
  if (!d) return null;
  try {
    return new Date(d).toLocaleDateString("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return null;
  }
}

function formatDateRange(start?: string | null, end?: string | null): string | null {
  const s = formatDate(start);
  const e = formatDate(end);
  if (s && e) return `${s} — ${e}`;
  return s ?? e ?? null;
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function shortenUrl(url: string): string {
  try {
    const u = new URL(url);
    const path = u.pathname.replace(/\/$/, "");
    const display = `${u.host}${path}`;
    return display.length > 48 ? `${display.slice(0, 47)}…` : display;
  } catch {
    return url.length > 48 ? `${url.slice(0, 47)}…` : url;
  }
}

export async function generateStoryCardBlob(
  opts: StoryCardOptions,
): Promise<Blob | null> {
  const canvas = document.createElement("canvas");
  canvas.width = CARD_WIDTH;
  canvas.height = CARD_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const baseColor = opts.color || "#003399";
  const deep = darken(baseColor, 0.6);

  const bg = ctx.createLinearGradient(0, 0, 0, CARD_HEIGHT);
  bg.addColorStop(0, baseColor);
  bg.addColorStop(1, deep);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  const IMG_AREA_TOP = 0;
  const IMG_AREA_HEIGHT = 1100;
  const IMG_AREA_BOTTOM = IMG_AREA_TOP + IMG_AREA_HEIGHT;

  let imageDrawn = false;
  if (opts.imageUrl) {
    const img = await loadImage(opts.imageUrl);
    if (img && img.width > 0 && img.height > 0) {
      const scale = Math.max(
        CARD_WIDTH / img.width,
        IMG_AREA_HEIGHT / img.height,
      );
      const dw = img.width * scale;
      const dh = img.height * scale;
      const dx = (CARD_WIDTH - dw) / 2;
      const dy = IMG_AREA_TOP + (IMG_AREA_HEIGHT - dh) / 2;
      try {
        ctx.drawImage(img, dx, dy, dw, dh);
        imageDrawn = true;
      } catch {
        imageDrawn = false;
      }
    }
  }

  if (!imageDrawn) {
    const placeholder = ctx.createLinearGradient(0, 0, CARD_WIDTH, IMG_AREA_BOTTOM);
    placeholder.addColorStop(0, baseColor);
    placeholder.addColorStop(1, deep);
    ctx.fillStyle = placeholder;
    ctx.fillRect(0, IMG_AREA_TOP, CARD_WIDTH, IMG_AREA_HEIGHT);

    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = "#ffffff";
    ctx.font = `900 360px ${FONT_STACK}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("✦", CARD_WIDTH / 2, IMG_AREA_TOP + IMG_AREA_HEIGHT / 2);
    ctx.restore();
  }

  const fade = ctx.createLinearGradient(0, IMG_AREA_BOTTOM - 380, 0, IMG_AREA_BOTTOM + 40);
  fade.addColorStop(0, "rgba(0, 0, 0, 0)");
  fade.addColorStop(0.6, `${hexToRgba(deep, 0.85)}`);
  fade.addColorStop(1, deep);
  ctx.fillStyle = fade;
  ctx.fillRect(0, IMG_AREA_BOTTOM - 380, CARD_WIDTH, 420);

  ctx.fillStyle = deep;
  ctx.fillRect(0, IMG_AREA_BOTTOM, CARD_WIDTH, CARD_HEIGHT - IMG_AREA_BOTTOM);

  const accent = ctx.createLinearGradient(0, 0, CARD_WIDTH, 0);
  accent.addColorStop(0, baseColor);
  accent.addColorStop(1, hexToRgba(baseColor, 0.6));
  ctx.fillStyle = accent;
  ctx.fillRect(0, 0, CARD_WIDTH, 14);

  const PAD = 80;
  let cursorY = IMG_AREA_BOTTOM - 360;

  const badgeText = opts.kind === "actividad" ? "ACTIVIDAD" : "MOVILIDAD";
  const wp = opts.workPackage?.trim();
  const fullBadge = wp ? `${badgeText}  ·  ${wp}` : badgeText;

  ctx.font = `800 30px ${FONT_STACK}`;
  const badgeMetrics = ctx.measureText(fullBadge);
  const badgePadX = 28;
  const badgePadY = 16;
  const badgeW = badgeMetrics.width + badgePadX * 2;
  const badgeH = 60;
  ctx.fillStyle = "rgba(255, 255, 255, 0.18)";
  drawRoundedRect(ctx, PAD, cursorY, badgeW, badgeH, 30);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(fullBadge, PAD + badgePadX, cursorY + badgeH / 2 + 1);
  cursorY += badgeH + 36;

  const titleMaxWidth = CARD_WIDTH - PAD * 2;
  let titleSize = 92;
  let titleLines: string[] = [];
  while (titleSize >= 56) {
    ctx.font = `900 ${titleSize}px ${FONT_STACK}`;
    titleLines = wrapLines(ctx, opts.title, titleMaxWidth, 4);
    if (titleLines.length <= 3) break;
    titleSize -= 6;
  }
  ctx.font = `900 ${titleSize}px ${FONT_STACK}`;
  if (titleLines.length === 0) {
    titleLines = wrapLines(ctx, opts.title, titleMaxWidth, 4);
  }
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.shadowColor = "rgba(0, 0, 0, 0.35)";
  ctx.shadowBlur = 18;
  const lineHeight = Math.round(titleSize * 1.08);
  titleLines.forEach((line, i) => {
    ctx.fillText(line, PAD, cursorY + lineHeight * (i + 1));
  });
  ctx.shadowBlur = 0;
  cursorY += lineHeight * titleLines.length + 50;

  ctx.font = `600 38px ${FONT_STACK}`;
  ctx.fillStyle = "rgba(255, 255, 255, 0.92)";

  const locationParts: string[] = [];
  if (opts.countryFlag) locationParts.push(opts.countryFlag);
  const place = [opts.city, opts.country].filter(Boolean).join(", ");
  if (place) locationParts.push(place);

  if (opts.partnerName) {
    const partnerLine = wrapLines(ctx, `📍  ${opts.partnerName}`, titleMaxWidth, 2);
    partnerLine.forEach((line, i) => {
      ctx.fillText(line, PAD, cursorY + 44 * (i + 1));
    });
    cursorY += 44 * partnerLine.length + 18;
  }

  if (locationParts.length > 0) {
    const locationLine = wrapLines(
      ctx,
      `   ${locationParts.join("  ")}`,
      titleMaxWidth,
      1,
    );
    ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
    ctx.font = `500 34px ${FONT_STACK}`;
    locationLine.forEach((line, i) => {
      ctx.fillText(line, PAD, cursorY + 40 * (i + 1));
    });
    cursorY += 40 * locationLine.length + 18;
  }

  const dateRange = formatDateRange(opts.startDate, opts.endDate);
  if (dateRange) {
    ctx.fillStyle = "rgba(255, 255, 255, 0.92)";
    ctx.font = `600 36px ${FONT_STACK}`;
    ctx.fillText(`🗓  ${dateRange}`, PAD, cursorY + 42);
    cursorY += 42 + 18;
  }

  const FOOTER_Y = CARD_HEIGHT - 120;
  ctx.fillStyle = "rgba(255, 255, 255, 0.16)";
  ctx.fillRect(PAD, FOOTER_Y - 24, CARD_WIDTH - PAD * 2, 2);

  ctx.fillStyle = "#ffffff";
  ctx.font = `800 36px ${FONT_STACK}`;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("Erasmus+ Platform", PAD, FOOTER_Y + 10);

  ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
  ctx.font = `500 26px ${FONT_STACK}`;
  ctx.fillText(shortenUrl(opts.url), PAD, FOOTER_Y + 50);

  return new Promise<Blob | null>((resolve) => {
    try {
      canvas.toBlob(
        (blob) => resolve(blob),
        "image/jpeg",
        0.92,
      );
    } catch {
      resolve(null);
    }
  });
}

function hexToRgba(hex: string, alpha: number): string {
  if (hex.startsWith("rgb")) {
    return hex.replace(/rgb\(([^)]+)\)/, (_, vals) => `rgba(${vals}, ${alpha})`);
  }
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return `rgba(0, 26, 78, ${alpha})`;
  return `rgba(${parseInt(m[1], 16)}, ${parseInt(m[2], 16)}, ${parseInt(m[3], 16)}, ${alpha})`;
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "erasmus";
}

export function canShareStoryFile(file: File): boolean {
  if (typeof navigator === "undefined") return false;
  if (!navigator.share) return false;
  if (typeof navigator.canShare !== "function") return false;
  try {
    return navigator.canShare({ files: [file] });
  } catch {
    return false;
  }
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}
