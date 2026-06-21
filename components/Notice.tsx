"use client";

type Tone = "limit" | "busy" | "config" | "input" | "generic";

/** Turn any raw error into a friendly, designed message — never show raw output. */
function friendlyError(raw: string): { tone: Tone; title: string; detail: string } {
  const m = raw.toLowerCase();
  if (/429|quota|too many requests|resource_exhausted|rate limit|exceeded your current/.test(m)) {
    return {
      tone: "limit",
      title: "Daily AI limit reached",
      detail:
        "Today's free AI usage has run out. The allowance resets each day — please try again later.",
    };
  }
  if (/503|overloaded|high demand|unavailable|try again later|500/.test(m)) {
    return {
      tone: "busy",
      title: "The AI service is briefly busy",
      detail:
        "This is temporary and on the provider's side. Give it a few seconds and try again.",
    };
  }
  if (/api key|gemini_api_key|not configured|missing key/.test(m)) {
    return {
      tone: "config",
      title: "AI isn't configured yet",
      detail: "An API key needs to be added before documents can be analysed.",
    };
  }
  if (/scanned|unsupported|could not read|no files|image-only|invalid upload/.test(m)) {
    return {
      tone: "input",
      title: "Couldn't read those files",
      detail:
        "Please use text-based PDF or TXT files. Scanned, image-only PDFs aren't supported.",
    };
  }
  return {
    tone: "generic",
    title: "Something went wrong",
    detail: "We couldn't finish that just now. Please try again in a moment.",
  };
}

const TONE_STYLES: Record<Tone, { box: string; icon: string }> = {
  limit: { box: "bg-[#fff6ec] border-[#f1d9b6] text-[#8a531a]", icon: "bg-[#fae5cb] text-[#b9701f]" },
  busy: { box: "bg-[#eef4fb] border-[#cfe0f1] text-[#2b5479]", icon: "bg-[#dce9f7] text-[#2f6aa3]" },
  config: { box: "bg-[#f4f1fb] border-[#ddd3f0] text-[#574785]", icon: "bg-[#e7defa] text-[#6c54a8]" },
  input: { box: "bg-[#fdf3ec] border-[#f1d8c2] text-[#8a4f22]", icon: "bg-[#fbe3d2] text-[#b56630]" },
  generic: { box: "bg-[#fdeef0] border-[#f4d0d4] text-[#9a3640]", icon: "bg-[#f8dde0] text-[#b94652]" },
};

function NoticeIcon({ tone }: { tone: Tone }) {
  const common = {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  if (tone === "limit")
    return (
      <svg {...common}>
        <path d="M12 8v5l3 2" />
        <circle cx="12" cy="12" r="9" />
      </svg>
    );
  if (tone === "busy")
    return (
      <svg {...common}>
        <path d="M12 3a9 9 0 1 0 9 9" />
        <path d="M12 7v5l3 2" />
      </svg>
    );
  if (tone === "config")
    return (
      <svg {...common}>
        <circle cx="8" cy="15" r="4" />
        <path d="M10.8 12.2 20 3m-3 0 2 2m-5 2 2 2" />
      </svg>
    );
  if (tone === "input")
    return (
      <svg {...common}>
        <path d="M7 3h7l4 4v14H7z" />
        <path d="M9.5 13l5 5m0-5-5 5" />
      </svg>
    );
  return (
    <svg {...common}>
      <path d="M12 3l9 16H3z" />
      <path d="M12 10v4m0 2.5v.5" />
    </svg>
  );
}

export default function Notice({
  error,
  onDismiss,
}: {
  error: string | null;
  onDismiss: () => void;
}) {
  if (!error) return null;
  const e = friendlyError(error);
  const t = TONE_STYLES[e.tone];
  return (
    <div
      className={`flex items-start gap-3 relative pr-9 pl-3.5 py-3.5 rounded-xl border ${t.box}`}
      role="alert"
    >
      <span
        className={`flex-none w-[34px] h-[34px] rounded-[9px] grid place-items-center ${t.icon}`}
      >
        <NoticeIcon tone={e.tone} />
      </span>
      <div className="flex flex-col gap-0.5">
        <strong className="text-[13.5px] font-semibold">{e.title}</strong>
        <span className="text-[12.5px] leading-snug opacity-90">{e.detail}</span>
      </div>
      <button
        className="absolute top-2 right-2.5 text-[19px] leading-none opacity-50 hover:opacity-90 px-1.5"
        onClick={onDismiss}
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
}
