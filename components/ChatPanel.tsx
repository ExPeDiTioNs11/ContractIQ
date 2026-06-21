"use client";

import type { RefObject } from "react";
import { KICKER, PANEL, PANEL_HEAD, BTN_PRIMARY } from "@/lib/ui";
import type { ChatMsg } from "@/lib/types";

const FALLBACK_EXAMPLES = [
  "What currently applies and why?",
  "Has anything been superseded or expired?",
  "What is the next deadline I should act on?",
];

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center gap-2.5 px-[22px] py-[34px] text-muted lg:flex-1">
      <svg
        width="26"
        height="26"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden
        className="text-[#c4cdd6]"
      >
        <path
          d="M4 5h16v11H8l-4 4V5Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
      <p className="text-[13px] max-w-[250px] leading-normal">{text}</p>
    </div>
  );
}

export default function ChatPanel({
  loaded,
  chat,
  thinking,
  question,
  setQuestion,
  onAsk,
  suggestions,
  busy,
  chatRef,
}: {
  loaded: boolean;
  chat: ChatMsg[];
  thinking: boolean;
  question: string;
  setQuestion: (v: string) => void;
  onAsk: (q: string) => void;
  suggestions: string[];
  busy: string | null;
  chatRef: RefObject<HTMLDivElement>;
}) {
  return (
    <article className={`${PANEL} flex flex-col w-full lg:h-full`}>
      <div className={PANEL_HEAD}>
        <div>
          <div className={KICKER}>Ask</div>
          <h2 className="text-[16px] font-bold text-navy mt-0.5">
            Question the record
          </h2>
        </div>
      </div>

      {!loaded && (
        <EmptyState text="Load or upload a record family to start asking questions." />
      )}

      {loaded && (
        <>
          {chat.length === 0 && !thinking && (
            <EmptyState text="Ask anything about the loaded documents — every answer cites its source." />
          )}

          {(chat.length > 0 || thinking) && (
            <div
              className="flex flex-col gap-3 px-[18px] pt-4 pb-1 overflow-y-auto max-h-[50vh] lg:max-h-none lg:flex-1 lg:min-h-0 scroll-smooth scrollbar-soft"
              ref={chatRef}
            >
              {chat.map((m, i) => (
                <div
                  key={i}
                  className={`max-w-[86%] ${
                    m.role === "user" ? "self-end" : "self-start"
                  }`}
                >
                  <div
                    className={`px-3.5 py-2.5 rounded-xl text-[13.5px] whitespace-pre-wrap ${
                      m.role === "user"
                        ? "bg-accent text-white rounded-br-[4px]"
                        : "bg-surface-2 border border-line rounded-bl-[4px]"
                    }${m.streaming ? " streaming-text" : ""}`}
                  >
                    {m.text}
                  </div>
                  {m.sources && m.sources.length > 0 && !m.streaming && (
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {m.sources.map((s) => (
                        <span
                          key={s}
                          className="font-mono text-[10px] text-muted bg-surface-2 border border-line rounded-[5px] px-1.5 py-0.5"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {thinking && (
                <div className="self-start">
                  <div
                    className="typing bg-surface-2 border border-line rounded-xl rounded-bl-[4px]"
                    aria-label="Assistant is typing"
                  >
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2 px-[18px] pt-3.5 pb-1 border-t border-line-2 mt-1">
            <input
              type="text"
              placeholder="e.g. what is the current fee, and what changed?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onAsk(question)}
              disabled={!!busy}
              className="flex-1 bg-white text-ink border border-line rounded-[11px] px-3.5 py-2.5 focus:outline-none focus:border-accent placeholder:text-[#9aa1b0]"
            />
            <button
              className={BTN_PRIMARY}
              onClick={() => onAsk(question)}
              disabled={!!busy}
            >
              Ask
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 px-[18px] pt-3 pb-[18px]">
            <span className="w-full text-[11px] font-semibold tracking-wide uppercase text-muted mb-0.5">
              {suggestions.length > 0
                ? "Suggested for these documents"
                : "Try"}
            </span>
            {(suggestions.length > 0 ? suggestions : FALLBACK_EXAMPLES).map((ex) => (
              <button
                key={ex}
                className="text-[12.5px] cursor-pointer text-ink-2 bg-surface-2 border border-line rounded-full px-3 py-1.5 hover:border-[#c3caf3] hover:text-accent-ink hover:bg-accent-wash disabled:opacity-50 transition"
                onClick={() => onAsk(ex)}
                disabled={!!busy}
              >
                {ex}
              </button>
            ))}
          </div>
        </>
      )}
    </article>
  );
}
