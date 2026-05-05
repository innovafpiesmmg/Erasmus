import { useQuery } from "@tanstack/react-query";
import { getVideoEmbedInfo } from "@/lib/video-embed";

type Props = {
  url: string;
  caption?: string | null;
  className?: string;
};

export default function VideoThumbnail({ url, caption, className }: Props) {
  const info = getVideoEmbedInfo(url);

  if (info.provider === "youtube" && info.posterUrl) {
    return (
      <img
        src={info.posterUrl}
        alt={caption ?? ""}
        className={className}
        loading="lazy"
        data-testid="video-thumb-youtube"
      />
    );
  }

  if (info.provider === "vimeo" && info.id) {
    return <VimeoThumbnail id={info.id} caption={caption} className={className} />;
  }

  return (
    <video
      src={url}
      className={className}
      preload="metadata"
      muted
      playsInline
      data-testid="video-thumb-file"
    />
  );
}

function VimeoThumbnail({
  id,
  caption,
  className,
}: {
  id: string;
  caption?: string | null;
  className?: string;
}) {
  const { data } = useQuery({
    queryKey: ["vimeo-thumbnail", id],
    queryFn: async () => {
      const res = await fetch(
        `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(`https://vimeo.com/${id}`)}`,
      );
      if (!res.ok) return null;
      const json = (await res.json()) as { thumbnail_url?: string };
      return json?.thumbnail_url ?? null;
    },
    staleTime: 24 * 60 * 60 * 1000,
    retry: 1,
  });

  if (!data) {
    return (
      <div
        className={`${className ?? ""} bg-gradient-to-br from-slate-700 to-slate-900`}
        data-testid="video-thumb-vimeo-placeholder"
      />
    );
  }

  return (
    <img
      src={data}
      alt={caption ?? ""}
      className={className}
      loading="lazy"
      data-testid="video-thumb-vimeo"
    />
  );
}
