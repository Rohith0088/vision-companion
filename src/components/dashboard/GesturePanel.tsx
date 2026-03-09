import { motion } from "framer-motion";
import { Download, Trash2, Clock } from "lucide-react";
import type { DetectionLogEntry } from "@/hooks/models/detectionLogger";

const gestures = [
  { emoji: "✋", name: "Open Palm", action: "Start Tracking" },
  { emoji: "✊", name: "Fist", action: "Capture Photo" },
  { emoji: "✌️", name: "Peace", action: "Toggle Detection" },
  { emoji: "👍", name: "Thumbs Up", action: "Start Recording" },
  { emoji: "👎", name: "Thumbs Down", action: "Stop Recording" },
  { emoji: "👌", name: "OK Sign", action: "Lock Target" },
  { emoji: "☝️", name: "Point", action: "Highlight Object" },
  { emoji: "🖐️", name: "Five Fingers", action: "Reset System" },
];

interface GesturePanelProps {
  gestureHistory: string[];
  currentGesture?: string;
  detectionLog?: DetectionLogEntry[];
  onExportLog?: () => void;
  onClearLog?: () => void;
}

export function GesturePanel({
  gestureHistory,
  currentGesture,
  detectionLog = [],
  onExportLog,
  onClearLog,
}: GesturePanelProps) {
  return (
    <div className="space-y-4">
      {/* Gesture Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card-red p-5"
      >
        <h3 className="font-display font-bold text-lg mb-4">
          Gesture Controls
          {currentGesture && currentGesture !== "none" && (
            <span className="ml-2 text-sm font-normal opacity-80 animate-pulse">
              — Active
            </span>
          )}
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {gestures.map((g) => (
            <div
              key={g.name}
              className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition-all ${
                currentGesture && g.name.toLowerCase().includes(currentGesture.replace("_", " "))
                  ? "bg-primary-foreground/30 ring-1 ring-primary-foreground/50"
                  : "bg-primary-foreground/10"
              }`}
            >
              <span className="text-lg">{g.emoji}</span>
              <div>
                <p className="font-medium text-xs">{g.name}</p>
                <p className="text-[10px] opacity-70">{g.action}</p>
              </div>
            </div>
          ))}
        </div>

        {gestureHistory.length > 0 && (
          <div className="mt-4 pt-3 border-t border-primary-foreground/20">
            <h4 className="text-xs font-semibold mb-2 opacity-80">Recent Actions</h4>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {gestureHistory.map((h, i) => (
                <p key={i} className="text-xs opacity-70">
                  {h}
                </p>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      {/* Detection History Log */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="card-dark p-4"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <h3 className="font-display font-semibold text-sm">Detection History</h3>
            <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full">
              {detectionLog.length} entries
            </span>
          </div>
          <div className="flex gap-1.5">
            {onExportLog && (
              <button
                onClick={onExportLog}
                disabled={detectionLog.length === 0}
                className="flex items-center gap-1 text-[10px] bg-primary/20 text-primary px-2 py-1 rounded-lg hover:bg-primary/30 transition-colors disabled:opacity-40"
              >
                <Download className="h-3 w-3" />
                CSV
              </button>
            )}
            {onClearLog && (
              <button
                onClick={onClearLog}
                disabled={detectionLog.length === 0}
                className="flex items-center gap-1 text-[10px] bg-destructive/20 text-destructive px-2 py-1 rounded-lg hover:bg-destructive/30 transition-colors disabled:opacity-40"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        <div className="space-y-1 max-h-48 overflow-y-auto">
          {detectionLog.length === 0 ? (
            <p className="text-muted-foreground text-xs">No detections logged yet</p>
          ) : (
            detectionLog.slice(0, 30).map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between text-xs bg-secondary rounded-lg px-2.5 py-1.5"
              >
                <div className="flex items-center gap-2">
                  <span className={`h-1.5 w-1.5 rounded-full ${
                    entry.type === "face" ? "bg-red-500" :
                    entry.type === "hand" ? "bg-green-500" : "bg-blue-500"
                  }`} />
                  <span className="text-secondary-foreground font-medium">{entry.label}</span>
                  {entry.age && (
                    <span className="text-muted-foreground">
                      {entry.age}y {entry.gender}
                    </span>
                  )}
                  {entry.gesture && (
                    <span className="text-primary text-[10px]">{entry.gesture}</span>
                  )}
                </div>
                <span className="text-muted-foreground text-[10px] font-mono">
                  {entry.timestamp.toLocaleTimeString()}
                </span>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}
