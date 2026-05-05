export function SocialShareIcons() {
  const url = encodeURIComponent(window.location.href);
  const title = encodeURIComponent(document.title);

  return (
    <div className="flex items-center gap-2">
      <a
        href={`https://wa.me/?text=${title}%20${url}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Compartir en WhatsApp"
        data-testid="share-whatsapp"
        className="w-8 h-8 rounded-full flex items-center justify-center transition-opacity hover:opacity-80"
        style={{ background: "#25D366" }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
          <path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.554 4.12 1.523 5.851L.057 23.868l6.168-1.476A11.954 11.954 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.925 0-3.727-.504-5.287-1.386l-.379-.224-3.659.875.905-3.561-.247-.394A9.956 9.956 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
        </svg>
      </a>
      <a
        href={`https://twitter.com/intent/tweet?text=${title}&url=${url}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Compartir en Twitter/X"
        data-testid="share-twitter"
        className="w-8 h-8 rounded-full flex items-center justify-center transition-opacity hover:opacity-80"
        style={{ background: "#000" }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="white">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.742l7.733-8.835L2.25 2.25h6.918l4.259 5.633L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
        </svg>
      </a>
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${title}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Compartir en Facebook"
        data-testid="share-facebook"
        className="w-8 h-8 rounded-full flex items-center justify-center transition-opacity hover:opacity-80"
        style={{ background: "#1877F2" }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
          <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073c0 6.026 4.388 11.02 10.125 11.927v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.093 24 18.099 24 12.073z" />
        </svg>
      </a>
    </div>
  );
}
