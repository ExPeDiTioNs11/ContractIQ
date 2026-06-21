"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { DATASETS } from "@/lib/datasets";
import type { Doc, Truth, ChatMsg } from "@/lib/types";

/**
 * All of ContractIQ's UI state and the actions that change it.
 * The page and its components stay presentational; the logic lives here.
 */
export function useContractIQ() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [truth, setTruth] = useState<Truth | null>(null);
  const [chat, setChat] = useState<ChatMsg[]>([]);
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [dataset, setDataset] = useState<string>(DATASETS[0].id);
  const [analyzedAt, setAnalyzedAt] = useState<string | null>(null);
  const [thinking, setThinking] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  // Keep the chat scrolled to the latest message (incl. while it types out).
  useEffect(() => {
    const el = chatRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [chat, thinking]);

  const today = useMemo(
    () =>
      new Date().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    []
  );

  async function call(path: string, body?: object) {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Request failed");
    return data;
  }

  // Shared post-ingest step: reset views and fetch document-specific suggestions.
  async function afterDocuments(documents: Doc[]) {
    setDocs(documents);
    setTruth(null);
    setChat([]);
    setSuggestions([]);
    setAnalyzedAt(null);
    setBusy("Drafting questions for these documents…");
    try {
      const sug = await call("/api/suggest");
      if (Array.isArray(sug.questions) && sug.questions.length > 0)
        setSuggestions(sug.questions);
    } catch {
      /* non-fatal */
    }
  }

  async function ingest() {
    setError(null);
    setBusy("Reading and indexing the record family…");
    try {
      const data = await call("/api/ingest", { dataset });
      await afterDocuments(data.documents);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function upload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    setBusy("Reading and indexing your documents…");
    try {
      const fd = new FormData();
      Array.from(files).forEach((f) => fd.append("files", f));
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      await afterDocuments(data.documents);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function analyze() {
    setError(null);
    setBusy("Reasoning across the record family…");
    try {
      const data = await call("/api/extract");
      setTruth(data.result);
      setAnalyzedAt(
        new Date().toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function ask(q: string) {
    const text = q.trim();
    if (!text) return;
    setError(null);
    setQuestion("");
    setChat((c) => [...c, { role: "user", text }]);
    setThinking(true);
    setBusy("Searching the documents…");
    try {
      const data = await call("/api/chat", { question: text });
      setThinking(false);
      await typeOut(data.answer as string, data.sources as string[]);
    } catch (e) {
      setError((e as Error).message);
      setThinking(false);
    } finally {
      setBusy(null);
    }
  }

  /** Reveal the bot answer word-by-word for readability. */
  function typeOut(full: string, sources: string[]): Promise<void> {
    setChat((c) => [...c, { role: "bot", text: "", sources, streaming: true }]);
    const tokens = full.split(/(\s+)/);
    return new Promise((resolve) => {
      let i = 0;
      const step = full.length > 320 ? 4 : 2;
      const id = setInterval(() => {
        i += step;
        const shown = tokens.slice(0, i).join("");
        const done = i >= tokens.length;
        setChat((c) => {
          const copy = [...c];
          const last = copy[copy.length - 1];
          if (last && last.role === "bot") {
            copy[copy.length - 1] = {
              ...last,
              text: done ? full : shown,
              streaming: !done,
            };
          }
          return copy;
        });
        if (done) {
          clearInterval(id);
          resolve();
        }
      }, 26);
    });
  }

  const loaded = docs.length > 0;

  return {
    docs,
    truth,
    chat,
    question,
    setQuestion,
    busy,
    error,
    setError,
    suggestions,
    dataset,
    setDataset,
    analyzedAt,
    thinking,
    chatRef,
    today,
    loaded,
    ingest,
    upload,
    analyze,
    ask,
  };
}
