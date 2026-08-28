import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MATCH_TEMPLATE_KINDS,
  createGridSet,
  createMatchSet,
  createMixGapSet,
  createMultiChoiceSet,
  deleteSet,
  exportSet,
  importMdl3Files,
  importSet,
  listSets,
  loadEdexcelUnit1Sets,
  loadExampleSets,
} from "../storage/sets";
import type { AnySet, MatchTemplate } from "../types";

const MATCH_TEMPLATES = Object.keys(MATCH_TEMPLATE_KINDS) as MatchTemplate[];

/** Templates that aren't match sets and so have their own authoring screens. */
type OtherTemplate = "grid" | "multichoice" | "mixgap";
type TemplateChoice = MatchTemplate | OtherTemplate;

const OTHER_TEMPLATES: Record<OtherTemplate, { name: string; blurb: string }> = {
  grid: {
    name: "Grid Match",
    blurb:
      "Row and column headers combine to prompt each answer — built for verb conjugation.",
  },
  multichoice: {
    name: "Multi-Choice",
    blurb: "Straight questions with several answers. Good for comprehension.",
  },
  mixgap: {
    name: "Mix & Gap",
    blurb:
      "One passage, rebuilt and gapped a dozen ways — tiles, jumbles, gap-fill and comprehension.",
  },
};

function isMatchTemplate(t: TemplateChoice): t is MatchTemplate {
  return t in MATCH_TEMPLATE_KINDS;
}

/** One-line description of a set for the list on the home screen. */
function summarise(set: AnySet): string {
  switch (set.kind) {
    case "match": {
      const n = set.pairs.length;
      return `${MATCH_TEMPLATE_KINDS[set.template].name} · ${n} pair${
        n === 1 ? "" : "s"
      } · ${set.leftLabel} ↔ ${set.rightLabel}`;
    }
    case "grid":
      return `Grid Match · ${set.rowHeaders.length} × ${set.colHeaders.length}`;
    case "multichoice": {
      const n = set.questions.length;
      return `Multi-Choice · ${n} question${n === 1 ? "" : "s"}`;
    }
    case "mixgap": {
      const n = set.text.trim() ? set.text.trim().split(/\s+/).length : 0;
      return `Mix & Gap · ${n} word${n === 1 ? "" : "s"} · ${set.gaps.length} gap${
        set.gaps.length === 1 ? "" : "s"
      }`;
    }
    default:
      return "";
  }
}

function TemplateCard({
  name,
  blurb,
  selected,
  onSelect,
}: {
  name: string;
  blurb: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`text-left rounded-lg border-2 p-3 ${
        selected
          ? "border-cga-600 bg-cga-50"
          : "border-slate-200 hover:border-slate-300"
      }`}
    >
      <div className="font-semibold">{name}</div>
      <div className="text-xs text-slate-500 mt-0.5">{blurb}</div>
    </button>
  );
}

/** Sensible starting labels per template, so the form isn't blank. */
const DEFAULT_LABELS: Record<MatchTemplate, [string, string]> = {
  "text-match": ["French", "English"],
  "picture-match": ["Picture", "French"],
  "sound-match": ["Sound", "French"],
  "pic-sound": ["Sound", "Picture"],
};

export function Home() {
  const navigate = useNavigate();
  const [sets, setSets] = useState<AnySet[]>(() => listSets());
  const [showCreate, setShowCreate] = useState(false);
  const [template, setTemplate] = useState<TemplateChoice>("text-match");
  const [title, setTitle] = useState("");
  const [leftLabel, setLeftLabel] = useState(DEFAULT_LABELS["text-match"][0]);
  const [rightLabel, setRightLabel] = useState(DEFAULT_LABELS["text-match"][1]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  function refresh() {
    setSets(listSets());
  }

  function pickTemplate(next: TemplateChoice) {
    setTemplate(next);
    if (isMatchTemplate(next)) {
      const [l, r] = DEFAULT_LABELS[next];
      setLeftLabel(l);
      setRightLabel(r);
    }
  }

  function loadCollection(
    loader: () => { added: number; skipped: number },
    label: string,
  ) {
    const { added, skipped } = loader();
    refresh();
    setError(null);
    if (added === 0) setMessage(`${label} are already loaded.`);
    else if (skipped === 0) setMessage(`Added ${added} ${label}.`);
    else setMessage(`Added ${added} new ${label} — ${skipped} were already loaded.`);
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const name = title || "Untitled set";
    const set = isMatchTemplate(template)
      ? createMatchSet(name, template, leftLabel, rightLabel)
      : template === "grid"
        ? createGridSet(name)
        : template === "mixgap"
          ? createMixGapSet(name)
          : createMultiChoiceSet(name);
    navigate(`/edit/${set.id}`);
  }

  function handleDelete(id: string, setTitle: string) {
    if (confirm(`Delete "${setTitle}"? This can't be undone.`)) {
      deleteSet(id);
      refresh();
    }
  }

  async function handleExport(set: AnySet) {
    const json = await exportSet(set);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${set.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "set"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const chosen = [...(e.target.files ?? [])];
    if (chosen.length === 0) return;

    const mdl3 = chosen.filter((f) => f.name.toLowerCase().endsWith(".mdl3"));
    const json = chosen.filter((f) => !f.name.toLowerCase().endsWith(".mdl3"));
    const problems: string[] = [];
    let added = 0;

    try {
      if (mdl3.length > 0) {
        const loaded = await Promise.all(
          mdl3.map(async (f) => ({ name: f.name, buffer: await f.arrayBuffer() })),
        );
        const { imported, failures } = importMdl3Files(loaded);
        added += imported.length;
        problems.push(...failures.map((f) => `${f.name} (${f.reason})`));
      }
      for (const f of json) {
        try {
          await importSet(await f.text());
          added++;
        } catch {
          problems.push(f.name);
        }
      }

      refresh();
      setError(problems.length > 0 ? `Couldn't read: ${problems.join(", ")}` : null);
      setMessage(
        added > 0
          ? `Imported ${added} set${added === 1 ? "" : "s"}.`
          : null,
      );
    } finally {
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-cga-900 text-white px-6 py-5">
        <h1 className="text-2xl font-bold">CGAMagic</h1>
        <p className="text-slate-300 text-sm">MFL classroom activities</p>
      </header>

      <main className="max-w-3xl mx-auto p-6 flex flex-col gap-6">
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => setShowCreate(true)}
            className="rounded-lg bg-cga-600 hover:bg-cga-700 text-white font-semibold px-5 py-2.5"
          >
            + New set
          </button>
          <button
            onClick={() => fileInput.current?.click()}
            className="rounded-lg bg-white hover:bg-slate-50 border border-slate-300 font-medium px-5 py-2.5"
          >
            Import files
          </button>
          <button
            onClick={() =>
              loadCollection(
                loadExampleSets,
                "example sets (Year 7/9/11 × French/Italian/Spanish)",
              )
            }
            className="rounded-lg bg-white hover:bg-slate-50 border border-slate-300 font-medium px-5 py-2.5"
          >
            Load example sets
          </button>
          <button
            onClick={() =>
              loadCollection(loadEdexcelUnit1Sets, "A Level Spanish sets (Edexcel Unit 1)")
            }
            className="rounded-lg bg-white hover:bg-slate-50 border border-slate-300 font-medium px-5 py-2.5"
          >
            Load A Level Spanish (Edexcel Unit 1)
          </button>
          <input
            ref={fileInput}
            type="file"
            multiple
            accept=".json,.mdl3,application/json"
            className="hidden"
            onChange={handleImportFile}
          />
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}
        {message && <p className="text-slate-500 text-sm">{message}</p>}

        {showCreate && (
          <form
            onSubmit={handleCreate}
            className="bg-white rounded-xl shadow p-5 flex flex-col gap-4"
          >
            <h2 className="font-semibold text-lg">New set</h2>

            <div className="grid sm:grid-cols-2 gap-3">
              {MATCH_TEMPLATES.map((t) => {
                const meta = MATCH_TEMPLATE_KINDS[t];
                return (
                  <TemplateCard
                    key={t}
                    name={meta.name}
                    blurb={meta.blurb}
                    selected={template === t}
                    onSelect={() => pickTemplate(t)}
                  />
                );
              })}
              {(Object.keys(OTHER_TEMPLATES) as OtherTemplate[]).map((t) => (
                <TemplateCard
                  key={t}
                  name={OTHER_TEMPLATES[t].name}
                  blurb={OTHER_TEMPLATES[t].blurb}
                  selected={template === t}
                  onSelect={() => pickTemplate(t)}
                />
              ))}
            </div>

            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-slate-600">Title</span>
              <input
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="rounded border border-slate-300 px-3 py-2"
                placeholder="e.g. French Household Vocabulary"
              />
            </label>
            {isMatchTemplate(template) && (
              <div className="grid grid-cols-2 gap-4">
                <label className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-slate-600">
                    Left label ({MATCH_TEMPLATE_KINDS[template].left})
                  </span>
                  <input
                    value={leftLabel}
                    onChange={(e) => setLeftLabel(e.target.value)}
                    className="rounded border border-slate-300 px-3 py-2"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-slate-600">
                    Right label ({MATCH_TEMPLATE_KINDS[template].right})
                  </span>
                  <input
                    value={rightLabel}
                    onChange={(e) => setRightLabel(e.target.value)}
                    className="rounded border border-slate-300 px-3 py-2"
                  />
                </label>
              </div>
            )}
            <div className="flex gap-3">
              <button
                type="submit"
                className="rounded-lg bg-cga-600 hover:bg-cga-700 text-white font-semibold px-5 py-2"
              >
                Create &amp; edit →
              </button>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="rounded-lg bg-slate-100 hover:bg-slate-200 px-5 py-2 font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="flex flex-col gap-3">
          {sets.length === 0 && !showCreate && (
            <p className="text-slate-400 text-center py-12">
              No sets yet — create your first set to get started.
            </p>
          )}
          {sets.map((set) => (
            <div
              key={set.id}
              className="bg-white rounded-xl shadow p-4 flex items-center justify-between gap-4"
            >
              <div className="min-w-0">
                <h3 className="font-semibold truncate">{set.title}</h3>
                <p className="text-sm text-slate-500">{summarise(set)}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => navigate(`/play/${set.id}`)}
                  className="rounded bg-cga-600 hover:bg-cga-700 text-white text-sm font-medium px-3 py-2"
                >
                  Play
                </button>
                <button
                  onClick={() => navigate(`/edit/${set.id}`)}
                  className="rounded bg-slate-100 hover:bg-slate-200 text-sm font-medium px-3 py-2"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleExport(set)}
                  className="rounded bg-slate-100 hover:bg-slate-200 text-sm font-medium px-3 py-2"
                >
                  Export
                </button>
                <button
                  onClick={() => handleDelete(set.id, set.title)}
                  className="rounded bg-red-50 hover:bg-red-100 text-red-600 text-sm font-medium px-3 py-2"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
