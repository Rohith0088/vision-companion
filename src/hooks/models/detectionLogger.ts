import type { Detection } from "@/hooks/useCamera";

export interface DetectionLogEntry {
  id: string;
  timestamp: Date;
  label: string;
  type: Detection["type"];
  confidence: number;
  age?: number;
  gender?: string;
  expression?: string;
  gesture?: string;
}

const MAX_LOG_SIZE = 5000;

let log: DetectionLogEntry[] = [];
let idCounter = 0;

export function addDetectionLog(
  detections: Detection[],
  gesture?: string
): void {
  const now = new Date();
  const entries: DetectionLogEntry[] = detections.map((d) => ({
    id: `log-${++idCounter}`,
    timestamp: now,
    label: d.label,
    type: d.type,
    confidence: d.confidence,
    age: d.age,
    gender: d.gender,
    expression: d.expression,
    gesture,
  }));

  log = [...entries, ...log].slice(0, MAX_LOG_SIZE);
}

export function getDetectionLog(): DetectionLogEntry[] {
  return log;
}

export function clearDetectionLog(): void {
  log = [];
  idCounter = 0;
}

export function exportLogToCSV(): string {
  const headers = [
    "id",
    "timestamp",
    "label",
    "type",
    "confidence",
    "age",
    "gender",
    "expression",
    "gesture",
  ];

  const rows = log.map((entry) => [
    entry.id,
    entry.timestamp.toISOString(),
    entry.label,
    entry.type,
    entry.confidence.toFixed(3),
    entry.age?.toString() || "",
    entry.gender || "",
    entry.expression || "",
    entry.gesture || "",
  ]);

  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  return csv;
}

export function downloadCSV(filename?: string): void {
  const csv = exportLogToCSV();
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || `detection_log_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
