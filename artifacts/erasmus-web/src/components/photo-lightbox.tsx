import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { getVideoEmbedInfo } from "@/lib/video-embed";

export type LightboxPhoto = {
  id: string | number;
  url: string;
  caption?: string | null;
  mediaType?: "image" | "video" | string;
};

type Props = {
  photos: LightboxPhoto[];
  index: number | null;
  onClose: () => void;
  onIndexChange: (i: number) => void;
};

const SWIPE_THRESHOLD = 50;

export default function PhotoLightbox({
  photos,
  index,
  onClose,
  onIndexChange,
}: Props) {
  const isOpen = index !== null && photos.length > 0;
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const [imgLoaded, setImgLoaded] = useState(false);

  const goPrev = () => {
    if (index === null) return;
    onIndexChange((index - 1 + photos.length) % photos.length);
  };
  const goNext = () => {
    if (index === null) return;
    onIndexChange((index + 1) % photos.length);
  };

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", onKey);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, index, photos.length]);

  useEffect(() => {
    setImgLoaded(false);
  }, [index]);

  if (!isOpen || index === null) return null;

  const photo = photos[index];
  if (!photo) return null;

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = null;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const dx = touchEndX.current - touchStartX.current;
    if (Math.abs(dx) > SWIPE_THRESHOLD) {
      if (dx > 0) goPrev();
      else goNext();
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  const hasMultiple = photos.length > 1;

  return createPortal(
    <AnimatePresence>
      <motion.div
        key="lightbox"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center"
        onClick={onClose}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        role="dialog"
        aria-modal="true"
        aria-label="Visor de fotografía"
        data-testid="photo-lightbox"
      >
        {/* Close button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="absolute top-4 right-4 sm:top-6 sm:right-6 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors z-10"
          aria-label="Cerrar"
          data-testid="lightbox-close"
        >
          <X size={22} />
        </button>

        {/* Counter */}
        {hasMultiple && (
          <div
            className="absolute top-4 left-1/2 -translate-x-1/2 sm:top-6 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-medium z-10"
            data-testid="lightbox-counter"
          >
            {index + 1} / {photos.length}
          </div>
        )}

        {/* Prev button */}
        {hasMultiple && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              goPrev();
            }}
            className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors z-10"
            aria-label="Foto anterior"
            data-testid="lightbox-prev"
          >
            <ChevronLeft size={26} />
          </button>
        )}

        {/* Next button */}
        {hasMultiple && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              goNext();
            }}
            className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors z-10"
            aria-label="Foto siguiente"
            data-testid="lightbox-next"
          >
            <ChevronRight size={26} />
          </button>
        )}

        {/* Image + caption (stop propagation so clicking it doesn't close) */}
        <motion.div
          key={photo.id}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
          className="relative max-w-[95vw] max-h-[90vh] flex flex-col items-center justify-center"
          onClick={(e) => e.stopPropagation()}
        >
          {!imgLoaded && photo.mediaType !== "video" && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-10 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
          )}
          {photo.mediaType === "video" ? (
            (() => {
              const info = getVideoEmbedInfo(photo.url);
              if (info.provider === "youtube" || info.provider === "vimeo") {
                return (
                  <div
                    key={photo.url}
                    className="relative w-[95vw] max-w-[1280px] aspect-video max-h-[80vh] rounded-lg overflow-hidden shadow-2xl bg-black"
                  >
                    <iframe
                      src={info.embedUrl}
                      title={photo.caption ?? "Vídeo"}
                      className="absolute inset-0 w-full h-full"
                      frameBorder={0}
                      allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                      allowFullScreen
                      data-testid="lightbox-iframe"
                    />
                  </div>
                );
              }
              return (
                <video
                  key={photo.url}
                  src={photo.url}
                  controls
                  autoPlay
                  playsInline
                  className="max-w-[95vw] max-h-[80vh] rounded-lg shadow-2xl bg-black"
                  data-testid="lightbox-video"
                />
              );
            })()
          ) : (
            <img
              src={photo.url}
              alt={photo.caption ?? "Erasmus+"}
              onLoad={() => setImgLoaded(true)}
              className="max-w-[95vw] max-h-[80vh] object-contain rounded-lg shadow-2xl"
              data-testid="lightbox-image"
            />
          )}
          {photo.caption && (
            <div
              className="mt-3 max-w-[95vw] sm:max-w-[80vw] px-4 py-2 rounded-lg bg-black/50 text-white text-sm leading-snug text-center"
              data-testid="lightbox-caption"
            >
              {photo.caption}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
}
