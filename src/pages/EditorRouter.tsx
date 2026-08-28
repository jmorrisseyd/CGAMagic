import { Navigate, useParams } from "react-router-dom";
import { getSet } from "../storage/sets";
import { Editor } from "./Editor";
import { GridEditor } from "./GridEditor";
import { MultiChoiceEditor } from "./MultiChoiceEditor";

/** Sends /edit/:setId to whichever authoring screen the set kind needs. */
export function EditorRouter() {
  const { setId } = useParams<{ setId: string }>();
  const set = setId ? getSet(setId) : undefined;
  if (!set) return <Navigate to="/" replace />;

  switch (set.kind) {
    case "match":
      return <Editor />;
    case "grid":
      return <GridEditor />;
    case "multichoice":
      return <MultiChoiceEditor />;
    default:
      return <Navigate to="/" replace />;
  }
}
