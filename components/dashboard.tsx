"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import AlertsPanel from "./alerts-panel";
import AutomationCard from "./automation-card";
import DependenciesCard from "./dependencies-card";
import HealthSummary from "./health-summary";
import HistoryCard from "./history-card";
import ResolvedCard from "./resolved-card";
import ScanForm from "./scan-form";
import ShareReport from "./share-report";
import { DEFAULT_PRESET_ID, type DemoPresetId } from "@/lib/preset-options";
import { isResolvedAlert } from "@/lib/resolution-contract";
import { scoreAlerts, statusFromScore, verdictFromStatus } from "@/lib/score";
import type {
  AlertCounts,
  Cadence,
  MaintenanceAlert,
  ResolvedAlert,
  ScanReport,
  ScanSource,
} from "@/lib/types";

const STORAGE_KEY = "arquikota.resolutions.v1";

type ResolutionStorage = "loading" | "supabase" | "local";

interface ResolutionStore {
  projectId: string;
  entries: ResolvedAlert[];
  storage: ResolutionStorage;
  error: string | null;
}

function readStoredResolutions(): Record<string, ResolvedAlert[]> {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const result: Record<string, ResolvedAlert[]> = {};
    for (const [projectId, entries] of Object.entries(parsed as Record<string, unknown>)) {
      if (!Array.isArray(entries)) continue;
      result[projectId] = entries.filter(isResolvedAlert).slice(0, 80);
    }
    return result;
  } catch {
    return {};
  }
}

function persistStoredResolutions(projectId: string, entries: ResolvedAlert[]) {
  try {
    const stored = readStoredResolutions();
    stored[projectId] = entries.slice(0, 80);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  } catch {
    // Private browsing or a full quota can block the cache; Supabase remains the source of truth.
  }
}

export default function Dashboard({
  initialReport,
  initialPreset = DEFAULT_PRESET_ID,
}: {
  initialReport: ScanReport;
  initialPreset?: DemoPresetId;
}) {
  const [report, setReport] = useState(initialReport);
  const [source, setSource] = useState<ScanSource>("demo");
  const [presetId, setPresetId] = useState<DemoPresetId>(initialPreset);
  const [repo, setRepo] = useState("");
  const [cadence, setCadence] = useState<Cadence>(initialReport.automation.cadence);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resolutionStore, setResolutionStore] = useState<ResolutionStore>({
    projectId: initialReport.project.id,
    entries: [],
    storage: "loading",
    error: null,
  });
  const [clearingResolutions, setClearingResolutions] = useState(false);

  useEffect(() => {
    const projectId = report.project.id;
    const cached = readStoredResolutions()[projectId] ?? [];
    setResolutionStore({ projectId, entries: cached, storage: "loading", error: null });
    setClearingResolutions(false);

    const controller = new AbortController();

    (async () => {
      try {
        const response = await fetch(
          `/api/resolutions?projectId=${encodeURIComponent(projectId)}`,
          { cache: "no-store", signal: controller.signal },
        );
        const data = (await response.json().catch(() => null)) as
          | { resolutions?: unknown; error?: string }
          | null;

        if (!response.ok) {
          throw new Error(data?.error ?? "Não foi possível carregar o histórico partilhado.");
        }

        const entries = Array.isArray(data?.resolutions)
          ? data.resolutions.filter(isResolvedAlert)
          : [];
        setResolutionStore({ projectId, entries, storage: "supabase", error: null });
      } catch (cause) {
        if (controller.signal.aborted) return;
        setResolutionStore({
          projectId,
          entries: cached,
          storage: "local",
          error:
            cause instanceof Error
              ? cause.message
              : "Histórico partilhado indisponível; as ações ficam neste browser.",
        });
      }
    })();

    return () => controller.abort();
  }, [report.project.id]);

  useEffect(() => {
    if (resolutionStore.storage === "loading") return;
    persistStoredResolutions(resolutionStore.projectId, resolutionStore.entries);
  }, [resolutionStore]);

  const storedResolved =
    resolutionStore.projectId === report.project.id ? resolutionStore.entries : [];
  const storedIds = useMemo(
    () => new Set(storedResolved.map((entry) => entry.id)),
    [storedResolved],
  );
  const activeAlerts = useMemo(
    () => report.alerts.filter((alert) => !storedIds.has(alert.id)),
    [report.alerts, storedIds],
  );
  const counts = useMemo<AlertCounts>(
    () => ({
      critical: activeAlerts.filter((alert) => alert.severity === "critical").length,
      high: activeAlerts.filter((alert) => alert.severity === "high").length,
      medium: activeAlerts.filter((alert) => alert.severity === "medium").length,
      low: activeAlerts.filter((alert) => alert.severity === "low").length,
      total: activeAlerts.length,
    }),
    [activeAlerts],
  );
  const score = useMemo(() => scoreAlerts(activeAlerts), [activeAlerts]);
  const status = statusFromScore(score);
  const verdict = verdictFromStatus(status);

  const resolvedHistory = useMemo(() => {
    const map = new Map<string, ResolvedAlert>();
    for (const entry of [...report.resolved, ...storedResolved]) {
      if (!map.has(entry.id)) map.set(entry.id, entry);
    }
    return Array.from(map.values()).sort((a, b) =>
      b.resolvedAt.localeCompare(a.resolvedAt),
    );
  }, [report.resolved, storedResolved]);

  const displayHistory = useMemo(
    () =>
      report.history.map((point, index) =>
        index === report.history.length - 1
          ? { ...point, score, critical: counts.critical, high: counts.high }
          : point,
      ),
    [report.history, score, counts.critical, counts.high],
  );

  function changeSource(next: ScanSource) {
    setSource(next);
    setError(null);
  }

  function changePreset(next: DemoPresetId) {
    setPresetId(next);
    setError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    if (source === "github" && !repo.trim()) {
      setError("Indica um repositório público no formato owner/repo.");
      return;
    }

    setPending(true);
    setError(null);

    try {
      const response = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source,
          presetId: source === "demo" ? presetId : null,
          repo: source === "github" ? repo.trim() : null,
          cadence,
        }),
      });

      const data = (await response.json().catch(() => null)) as
        | (ScanReport & { error?: string })
        | null;

      if (!response.ok) {
        throw new Error(data?.error ?? "A verificação falhou. Tenta novamente.");
      }
      if (!data || typeof data !== "object" || !data.project || !Array.isArray(data.alerts)) {
        throw new Error("O servidor devolveu um relatório inválido.");
      }

      setReport(data);

      if (window.matchMedia("(max-width: 1279px)").matches) {
        window.requestAnimationFrame(() => {
          document.getElementById("diagnostico")?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        });
      }
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível concluir a verificação. Tenta novamente.",
      );
    } finally {
      setPending(false);
    }
  }

  async function resolveAlert(alert: MaintenanceAlert) {
    const projectId = report.project.id;
    const entry: ResolvedAlert = {
      id: alert.id,
      title: alert.title,
      category: alert.kind,
      resolvedAt: new Date().toISOString(),
      note: `Marcado como resolvido no painel. Correção associada: ${alert.fix.label}.`,
    };

    setResolutionStore((current) =>
      current.projectId === projectId
        ? {
            ...current,
            entries: [entry, ...current.entries.filter((item) => item.id !== entry.id)],
            error: null,
          }
        : current,
    );

    try {
      const response = await fetch("/api/resolutions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          alertId: alert.id,
          title: alert.title,
          category: alert.kind,
          fixLabel: alert.fix.label,
        }),
      });
      const data = (await response.json().catch(() => null)) as
        | { resolution?: unknown; error?: string }
        | null;

      if (!response.ok) {
        throw new Error(data?.error ?? "Não foi possível guardar a resolução.");
      }

      const saved = isResolvedAlert(data?.resolution) ? data.resolution : entry;
      setResolutionStore((current) =>
        current.projectId === projectId
          ? {
              ...current,
              entries: [saved, ...current.entries.filter((item) => item.id !== saved.id)],
              storage: "supabase",
              error: null,
            }
          : current,
      );
    } catch (cause) {
      setResolutionStore((current) =>
        current.projectId === projectId
          ? {
              ...current,
              storage: "local",
              error: `A resolução ficou guardada neste browser. ${
                cause instanceof Error ? cause.message : ""
              }`.trim(),
            }
          : current,
      );
    }
  }

  async function clearStoredResolutions() {
    const projectId = report.project.id;
    if (resolutionStore.projectId !== projectId || resolutionStore.storage === "loading") {
      return;
    }

    if (resolutionStore.storage === "local") {
      setResolutionStore((current) =>
        current.projectId === projectId ? { ...current, entries: [], error: null } : current,
      );
      return;
    }

    setClearingResolutions(true);
    try {
      const response = await fetch(
        `/api/resolutions?projectId=${encodeURIComponent(projectId)}`,
        { method: "DELETE" },
      );
      const data = (await response.json().catch(() => null)) as
        | { removed?: number; error?: string }
        | null;

      if (!response.ok) {
        throw new Error(data?.error ?? "Não foi possível limpar o histórico.");
      }

      setResolutionStore((current) =>
        current.projectId === projectId ? { ...current, entries: [], error: null } : current,
      );
    } catch (cause) {
      setResolutionStore((current) =>
        current.projectId === projectId
          ? {
              ...current,
              error:
                cause instanceof Error
                  ? cause.message
                  : "Não foi possível limpar o histórico.",
            }
          : current,
      );
    } finally {
      setClearingResolutions(false);
    }
  }

  const historyStorage =
    resolutionStore.projectId === report.project.id ? resolutionStore.storage : "loading";
  const historyError =
    resolutionStore.projectId === report.project.id ? resolutionStore.error : null;

  return (
    <div className="mx-auto max-w-[1480px] px-4 pb-12 sm:px-6 lg:px-10">
      <p role="status" className="sr-only">
        {pending
          ? "A verificar o projeto."
          : `Relatório de ${report.project.name}: ${score} de 100, ${verdict}.`}
      </p>

      <section id="painel" className="scroll-mt-24 pt-8 lg:pt-10">
        <div className="grid gap-5 xl:grid-cols-12 xl:items-start">
          <ScanForm
            className="xl:col-span-4"
            source={source}
            onSourceChange={changeSource}
            presetId={presetId}
            onPresetChange={changePreset}
            repo={repo}
            onRepoChange={setRepo}
            cadence={cadence}
            onCadenceChange={setCadence}
            pending={pending}
            error={error}
            report={report}
            onSubmit={handleSubmit}
          />
          <HealthSummary
            className="xl:col-span-8"
            report={report}
            alerts={activeAlerts}
            score={score}
            status={status}
            verdict={verdict}
            counts={counts}
            resolvedCount={resolvedHistory.length}
            history={displayHistory}
          />
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-12 xl:items-start">
          <AlertsPanel
            className="xl:col-span-7"
            report={report}
            alerts={activeAlerts}
            onResolve={resolveAlert}
          />
          <div className="space-y-5 xl:col-span-5">
            <AutomationCard automation={report.automation} />
            <HistoryCard
              history={displayHistory}
              score={score}
              status={status}
              counts={counts}
            />
          </div>
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-12 xl:items-start">
          <DependenciesCard
            className="xl:col-span-7"
            dependencies={report.dependencies}
            latestSource={report.latestSource}
          />
          <div className="space-y-5 xl:col-span-5">
            <ResolvedCard
              resolved={resolvedHistory}
              storedIds={storedIds}
              storage={historyStorage}
              error={historyError}
              clearing={clearingResolutions}
              onClearStored={clearStoredResolutions}
            />
            <ShareReport
              report={report}
              score={score}
              status={status}
              verdict={verdict}
              counts={counts}
              alerts={activeAlerts}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
