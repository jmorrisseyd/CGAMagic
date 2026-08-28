import { useEffect, useRef, useState } from "react";
import { getMediaUrl } from "../storage/media";
import type { Side } from "../types";

/** Resolves a mediaId to an object URL, re-resolving if the id changes. */
export function useMediaUrl(mediaId: string | null): string | undefined {
  const [url, setUrl] = useState<string | undefined>();
  useEffect(() => {
    let cancelled = false;
    if (!mediaId) {
      setUrl(undefined);
      return;
    }
    getMediaUrl(mediaId).then((u) => {
      if (!cancelled) setUrl(u);
    });
    return () => {
      cancelled = true;
    };
  }, [mediaId]);
  return url;
}

/**
 * Renders either half of a pair. Audio deliberately renders as a play
 * button rather than autoplaying: on an interactive whiteboard the teacher
 * decides when the class hears it, and browsers block unprompted audio.
 */
export function SideView({
  side,
  className = "",
  imageClassName = "",
  hidden = false,
}: {
  side: Side;
  className?: string;
  imageClassName?: string;
  /** Face-down in Pelmanism etc. — keep layout, show nothing. */
  hidden?: boolean;
}) {
  const mediaId =
    side.kind === "image" || side.kind === "audio" ? side.mediaId : null;
  const url = useMediaUrl(mediaId);

  if (hidden) return <span className={className}>?</span>;

  if (side.kind === "text") {
    return <span className={className}>{side.text}</span>;
  }

  if (side.kind === "image") {
    if (!url) {
      return (
        <span className={`text-slate-400 text-sm ${className}`}>
          {side.alt || "(image missing)"}
        </span>
      );
    }
    return (
      <img
        src={url}
        alt={side.alt ?? ""}
        className={`max-h-full max-w-full object-contain ${imageClassName}`}
      />
    );
  }

  return <AudioButton url={url} label={side.label} className={className} />;
}

function AudioButton({
  url,
  label,
  className = "",
}: {
  url?: string;
  label?: string;
  className?: string;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  function play(e: React.MouseEvent) {
    // Cards are usually clickable themselves; don't trigger their handler.
    e.stopPropagation();
    const el = audioRef.current;
    if (!el) return;
    el.currentTime = 0;
    void el.play();
  }

  if (!url) {
    return (
      <span className={`text-slate-400 text-sm ${className}`}>
        {label || "(sound missing)"}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <button
        type="button"
        onClick={play}
        className={`rounded-full w-12 h-12 flex items-center justify-center text-xl shadow shrink-0 ${
          playing ? "bg-blue-500 text-white" : "bg-white hover:bg-slate-100"
        }`}
        aria-label={label ? `Play ${label}` : "Play sound"}
      >
        {playing ? "🔊" : "▶"}
      </button>
      {label && <span className="text-sm text-slate-500">{label}</span>}
      <audio
        ref={audioRef}
        src={url}
        onPlay={() => setPlaying(true)}
        onEnded={() => setPlaying(false)}
        onPause={() => setPlaying(false)}
      />
    </span>
  );
}
