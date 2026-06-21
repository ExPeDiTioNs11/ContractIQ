"use client";

import { KICKER, PANEL, PANEL_HEAD, BTN_GHOST } from "@/lib/ui";
import type { Truth } from "@/lib/types";

export default function AnalysisPanel({
  truth,
  today,
  busy,
  analyzedAt,
  onAnalyze,
}: {
  truth: Truth | null;
  today: string;
  busy: string | null;
  analyzedAt: string | null;
  onAnalyze: () => void;
}) {
  return (
    <article className={PANEL}>
      <div
        className={`${PANEL_HEAD} lg:sticky lg:top-0 lg:z-[4] lg:bg-white lg:rounded-t-xl`}
      >
        <div>
          <div className={KICKER}>Current position</div>
          <h2 className="text-[16px] font-bold text-navy mt-0.5">
            What governs today
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11.5px] text-muted font-mono">as of {today}</span>
          <button className={BTN_GHOST} onClick={onAnalyze} disabled={!!busy}>
            {truth ? "Re-analyze" : "Analyze"}
          </button>
        </div>
      </div>

      {!truth && (
        <p className="text-[12.5px] text-muted px-[18px] py-3">
          Run the analysis to resolve conflicting and superseded terms into a
          single current view, each with its source document.
        </p>
      )}

      {truth && (
        <>
          <p className="mx-[18px] mt-4 mb-1 px-4 py-3.5 text-[14px] font-medium text-accent-ink bg-accent-wash border border-[#cfe6ef] rounded-[10px]">
            {truth.summary}
          </p>

          <dl className="px-[18px] pt-2 pb-1">
            {truth.fields.map((f) => (
              <div
                className="grid grid-cols-[200px_1fr] max-[620px]:grid-cols-1 gap-3 py-3.5 border-b border-line-2 last:border-0"
                key={f.label}
              >
                <dt className="text-[12px] font-semibold text-muted uppercase tracking-wide pt-0.5">
                  {f.label}
                </dt>
                <dd className="flex flex-col gap-1.5">
                  <span className="text-[15px] font-semibold text-ink">
                    {f.value}
                  </span>
                  <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-muted">
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden
                      className="text-accent flex-none"
                    >
                      <path
                        d="M7 3h7l4 4v14H7V3Z"
                        stroke="currentColor"
                        strokeWidth="1.6"
                      />
                    </svg>
                    {f.evidence}
                  </span>
                </dd>
              </div>
            ))}
          </dl>

          {truth.risks?.length > 0 && (
            <div className="mx-[18px] mb-[18px] border border-[#f0e3c8] rounded-[10px] overflow-hidden">
              <div className="bg-amber-wash text-amber text-[11.5px] font-semibold tracking-wide uppercase px-3.5 py-2 border-b border-[#f0e3c8]">
                Open items &amp; deadlines
              </div>
              {truth.risks.map((r, i) => (
                <div
                  className="flex gap-2.5 px-3.5 py-2.5 text-[13px] text-ink-2 border-b border-line-2 last:border-0"
                  key={i}
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden
                    className="text-amber flex-none mt-0.5"
                  >
                    <path
                      d="M12 3l9 16H3L12 3Z"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M12 10v4M12 16.5v.5"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </svg>
                  <span>{r}</span>
                </div>
              ))}
            </div>
          )}

          {analyzedAt && (
            <div className="px-[18px] py-2.5 border-t border-line-2 text-[11.5px] text-muted">
              Analyzed at {analyzedAt} · sources shown are the governing documents
            </div>
          )}
        </>
      )}
    </article>
  );
}
