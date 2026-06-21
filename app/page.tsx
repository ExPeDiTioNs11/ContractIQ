"use client";

import { useContractIQ } from "@/hooks/useContractIQ";
import Sidebar from "@/components/Sidebar";
import AnalysisPanel from "@/components/AnalysisPanel";
import ChatPanel from "@/components/ChatPanel";
import Notice from "@/components/Notice";

export default function Home() {
  const s = useContractIQ();

  return (
    <div className="flex flex-col min-h-screen lg:h-screen lg:overflow-hidden">
      <header className="sticky top-0 z-10 flex items-center justify-between px-6 py-3 bg-white/80 backdrop-blur border-b border-line">
        <div className="flex items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="h-9 w-auto"
            src="/logo.png"
            alt="ContractIQ — AI Contract Analysis"
          />
        </div>
      </header>

      <main className="w-full max-w-[1180px] lg:max-w-[1460px] mx-auto flex-1 flex flex-col gap-4 px-4 pt-4 pb-8 lg:grid lg:grid-cols-[288px_minmax(0,1fr)_480px] lg:gap-5 lg:px-6 lg:py-5 lg:min-h-0 lg:overflow-hidden">
        {/* left: workspace */}
        <Sidebar
          dataset={s.dataset}
          setDataset={s.setDataset}
          busy={s.busy}
          loaded={s.loaded}
          docs={s.docs}
          onIngest={s.ingest}
          onUpload={s.upload}
        />

        {/* center: analysis */}
        <section className="flex flex-col gap-4 min-w-0 lg:overflow-y-auto lg:pr-0.5 scrollbar-soft">
          <Notice error={s.error} onDismiss={() => s.setError(null)} />

          {s.busy && !s.thinking && (
            <div className="flex items-center gap-2.5 text-[13px] text-muted px-1">
              <span className="inline-block w-3.5 h-3.5 border-2 border-line border-t-accent rounded-full animate-spin" />
              {s.busy}
            </div>
          )}

          {!s.loaded && !s.busy && (
            <div className="bg-white border border-dashed border-[#d6dae3] rounded-xl py-[54px] px-[30px] text-center">
              <div className="w-[60px] h-[60px] mx-auto mb-4 rounded-2xl grid place-items-center text-accent bg-accent-wash">
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M4 5a2 2 0 0 1 2-2h6l2 2h4a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                </svg>
              </div>
              <h2 className="text-[17px] font-bold text-navy mb-1.5">
                Load a record family to begin
              </h2>
              <p className="text-muted max-w-[440px] mx-auto text-[13.5px]">
                Pick a contract set on the left and index it. ContractIQ reads
                the agreement together with every amendment, side letter and
                invoice — then resolves what governs <b>today</b>.
              </p>
            </div>
          )}

          {s.loaded && (
            <AnalysisPanel
              truth={s.truth}
              today={s.today}
              busy={s.busy}
              analyzedAt={s.analyzedAt}
              onAnalyze={s.analyze}
            />
          )}
        </section>

        {/* right: chat */}
        <aside className="flex min-w-0 lg:h-full lg:overflow-hidden">
          <ChatPanel
            loaded={s.loaded}
            chat={s.chat}
            thinking={s.thinking}
            question={s.question}
            setQuestion={s.setQuestion}
            onAsk={s.ask}
            suggestions={s.suggestions}
            busy={s.busy}
            chatRef={s.chatRef}
          />
        </aside>
      </main>
    </div>
  );
}
