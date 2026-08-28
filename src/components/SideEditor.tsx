import { useRef } from "react";
import { makeId } from "../lib/id";
import { deleteMedia, putMedia } from "../storage/media";
import type { Side, SideKind } from "../types";
import { useMediaUrl } from "./SideView";

/**
 * Edits one half of a pair. Text is a plain input; pictures and sounds are
 * file pickers that stash the blob in IndexedDB and keep only the id.
 */
export function SideEditor({
  side,
  kind,
  onChange,
  placeholder,
}: {
  side: Side;
  kind: SideKind;
  onChange: (side: Side) => void;
  placeholder?: string;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const mediaId =
    side.kind === "image" || side.kind === "audio" ? side.mediaId : null;
  const url = useMediaUrl(mediaId);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const id = makeId();
    await putMedia(id, file);
    // Replacing a picture or sound leaves the previous blob unreferenced.
    if (mediaId) await deleteMedia(mediaId);
    onChange(
      kind === "image"
        ? { kind: "image", mediaId: id, alt: file.name.replace(/\.[^.]+$/, "") }
        : { kind: "audio", mediaId: id, label: file.name.replace(/\.[^.]+$/, "") },
    );
    if (fileInput.current) fileInput.current.value = "";
  }

  if (kind === "text") {
    return (
      <input
        value={side.kind === "text" ? side.text : ""}
        onChange={(e) => onChange({ kind: "text", text: e.target.value })}
        className="rounded border border-slate-300 px-3 py-2 w-full"
        placeholder={placeholder}
      />
    );
  }

  const label =
    side.kind === "image" ? side.alt : side.kind === "audio" ? side.label : "";

  return (
    <div className="flex items-center gap-2 border border-slate-300 rounded px-2 py-1.5 bg-white">
      {kind === "image" ? (
        url ? (
          <img src={url} alt="" className="h-12 w-12 object-cover rounded shrink-0" />
        ) : (
          <div className="h-12 w-12 rounded bg-slate-100 grid place-items-center text-slate-400 text-xl shrink-0">
            🖼
          </div>
        )
      ) : url ? (
        <audio src={url} controls className="h-8 max-w-40" />
      ) : (
        <div className="h-12 w-12 rounded bg-slate-100 grid place-items-center text-slate-400 text-xl shrink-0">
          🔊
        </div>
      )}

      <input
        value={label ?? ""}
        onChange={(e) =>
          onChange(
            side.kind === "image"
              ? { ...side, alt: e.target.value }
              : side.kind === "audio"
                ? { ...side, label: e.target.value }
                : side,
          )
        }
        disabled={!mediaId}
        className="flex-1 min-w-0 text-sm px-2 py-1 rounded border border-transparent hover:border-slate-200 focus:border-slate-300 outline-none disabled:bg-transparent"
        placeholder={kind === "image" ? "Description" : "Label"}
      />

      <button
        type="button"
        onClick={() => fileInput.current?.click()}
        className="shrink-0 text-xs rounded bg-slate-100 hover:bg-slate-200 px-2 py-1 font-medium"
      >
        {mediaId ? "Replace" : "Choose"}
      </button>
      <input
        ref={fileInput}
        type="file"
        accept={kind === "image" ? "image/*" : "audio/*"}
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
}

export function emptySide(kind: SideKind): Side {
  if (kind === "text") return { kind: "text", text: "" };
  if (kind === "image") return { kind: "image", mediaId: "", alt: "" };
  return { kind: "audio", mediaId: "", label: "" };
}
