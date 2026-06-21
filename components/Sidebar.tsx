"use client";

import { DATASETS } from "@/lib/datasets";
import { KICKER, BTN_PRIMARY } from "@/lib/ui";
import type { Doc } from "@/lib/types";

function ext(name: string) {
  return name.split(".").pop()?.toUpperCase() ?? "DOC";
}
function prettyName(name: string) {
  return name
    .replace(/^\d+[_-]?/, "")
    .replace(/\.[^.]+$/, "")
    .replace(/[_-]+/g, " ")
    .trim();
}

export default function Sidebar({
  dataset,
  setDataset,
  busy,
  loaded,
  docs,
  onIngest,
  onUpload,
}: {
  dataset: string;
  setDataset: (id: string) => void;
  busy: string | null;
  loaded: boolean;
  docs: Doc[];
  onIngest: () => void;
  onUpload: (files: FileList | null) => void;
}) {
  const activeMeta = DATASETS.find((d) => d.id === dataset);

  return (
    <aside className="bg-white border border-line rounded-xl p-[18px] lg:overflow-y-auto scrollbar-soft">
      <div className={KICKER}>Workspace</div>

      <label className="block text-[11px] font-semibold tracking-wide uppercase text-muted mt-4 mb-1.5">
        Record family
      </label>
      <select
        className="w-full bg-white text-ink border border-line rounded-[10px] px-3 py-2.5 cursor-pointer focus:outline-none focus:border-accent"
        value={dataset}
        onChange={(e) => setDataset(e.target.value)}
        disabled={!!busy}
      >
        {DATASETS.map((d) => (
          <option key={d.id} value={d.id}>
            {d.label}
          </option>
        ))}
      </select>
      <p className="text-[12.5px] text-muted leading-normal mt-2">
        {activeMeta?.description}
      </p>

      <button className={`${BTN_PRIMARY} w-full mt-4`} onClick={onIngest} disabled={!!busy}>
        Load sample set
      </button>

      <div className="flex items-center gap-2.5 my-3 text-[11px] uppercase tracking-wide font-semibold text-muted">
        <span className="h-px flex-1 bg-line" />
        <span>or use your own</span>
        <span className="h-px flex-1 bg-line" />
      </div>

      <label
        className={`flex flex-col items-center text-center gap-1 p-[18px] cursor-pointer text-accent-ink bg-surface-2 border-[1.5px] border-dashed border-[#cdd6da] rounded-xl hover:border-accent hover:bg-accent-wash transition ${
          busy ? "opacity-50 pointer-events-none" : ""
        }`}
      >
        <input
          type="file"
          accept=".pdf,.txt"
          multiple
          disabled={!!busy}
          className="hidden"
          onChange={(e) => {
            onUpload(e.target.files);
            e.target.value = "";
          }}
        />
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden
          className="text-accent"
        >
          <path
            d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </svg>
        <span className="text-[13px] font-semibold text-ink">
          Upload your own PDF / TXT
        </span>
        <span className="text-[11.5px] text-muted leading-snug">
          A contract plus its amendments — select several at once.
        </span>
      </label>

      {loaded && (
        <div className="mt-5 border-t border-line-2 pt-3.5">
          <div className="flex justify-between items-center text-[11px] font-semibold tracking-wide uppercase text-muted mb-2.5">
            <span>Documents</span>
            <span>{docs.length}</span>
          </div>
          <ol>
            {docs.map((d, i) => {
              const e = ext(d.source).toLowerCase();
              const tag =
                e === "pdf"
                  ? "bg-[#fdeceb] text-[#b03a32]"
                  : e === "txt"
                  ? "bg-[#eaf3ee] text-[#2f7a55]"
                  : "bg-[#eef0f4] text-[#5b6478]";
              return (
                <li key={d.source} className="flex items-start gap-2.5 py-1.5">
                  <span className="flex-none grid place-items-center w-[23px] h-[23px] rounded-full bg-white border-[1.5px] border-line text-[11px] font-semibold text-muted">
                    {i + 1}
                  </span>
                  <span
                    className={`text-[9.5px] font-medium tracking-wide px-1.5 py-0.5 rounded mt-0.5 uppercase ${tag}`}
                  >
                    {ext(d.source)}
                  </span>
                  <span className="flex flex-col min-w-0">
                    <span className="text-[12.5px] font-semibold text-ink-2">
                      {prettyName(d.source)}
                    </span>
                    <span className="font-mono text-[10.5px] text-muted truncate">
                      {d.source}
                    </span>
                  </span>
                </li>
              );
            })}
          </ol>
          <p className="text-[11.5px] text-muted mt-2.5">
            Ordered oldest → newest. Later documents override earlier ones.
          </p>
        </div>
      )}
    </aside>
  );
}
