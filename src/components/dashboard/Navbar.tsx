import { useState, useEffect } from "react";
import { Camera, Eye, Settings, Activity, History, Image, Video, Download, Trash2, X, Moon, Sun, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { DetectionLogEntry } from "@/hooks/models/detectionLogger";

interface NavbarProps {
  isCameraActive: boolean;
  isDetecting: boolean;
  detectionMode: string;
  capturedPhotos?: string[];
  gestureHistory?: string[];
  detectionLog?: DetectionLogEntry[];
  onExportLog?: () => void;
  onClearLog?: () => void;
}

type OverlayView = "history" | "photos" | "recordings" | null;

export function Navbar({
  isCameraActive,
  isDetecting,
  detectionMode,
  capturedPhotos = [],
  gestureHistory = [],
  detectionLog = [],
  onExportLog,
  onClearLog,
}: NavbarProps) {
  const [overlayView, setOverlayView] = useState<OverlayView>(null);

  return (
    <>
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex items-center justify-between px-6 py-4 border-b border-border"
      >
        <div className="flex items-center gap-3">
          <div className="card-red p-2">
            <Eye className="h-5 w-5" />
          </div>
          <h1 className="text-xl font-bold font-display tracking-tight">
            System Tracker
          </h1>
          <span className="text-xs font-display bg-secondary text-secondary-foreground px-2 py-1 rounded-full">
            2026
          </span>
        </div>

        <div className="flex items-center gap-4">
          <StatusBadge
            icon={<Camera className="h-3.5 w-3.5" />}
            label="Camera"
            active={isCameraActive}
          />
          <StatusBadge
            icon={<Activity className="h-3.5 w-3.5" />}
            label={detectionMode === "object" ? "Object Detection" : "Face Analysis"}
            active={isDetecting}
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground transition-colors">
                <Settings className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Tools & Data</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setOverlayView("history")}>
                <History className="mr-2 h-4 w-4" />
                Detection History
                {detectionLog.length > 0 && (
                  <span className="ml-auto text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">
                    {detectionLog.length}
                  </span>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setOverlayView("photos")}>
                <Image className="mr-2 h-4 w-4" />
                Captured Images
                {capturedPhotos.length > 0 && (
                  <span className="ml-auto text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">
                    {capturedPhotos.length}
                  </span>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setOverlayView("recordings")}>
                <Video className="mr-2 h-4 w-4" />
                Recorded Data
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DarkModeToggleItem />
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onExportLog}>
                <Download className="mr-2 h-4 w-4" />
                Export Log as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onClearLog} className="text-destructive focus:text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Clear All Data
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <SignOutItem />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </motion.nav>

      {/* Full-screen overlay panels */}
      <AnimatePresence>
        {overlayView && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm overflow-auto"
          >
            <div className="max-w-4xl mx-auto p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold font-display">
                  {overlayView === "history" && "Detection History"}
                  {overlayView === "photos" && "Captured Images"}
                  {overlayView === "recordings" && "Recorded Data & Gesture Log"}
                </h2>
                <button
                  onClick={() => setOverlayView(null)}
                  className="p-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-muted transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {overlayView === "history" && (
                <HistoryPanel detectionLog={detectionLog} onExport={onExportLog} />
              )}
              {overlayView === "photos" && (
                <PhotosPanel photos={capturedPhotos} />
              )}
              {overlayView === "recordings" && (
                <RecordingsPanel gestureHistory={gestureHistory} detectionLog={detectionLog} />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ── History Panel ── */
function HistoryPanel({ detectionLog, onExport }: { detectionLog: DetectionLogEntry[]; onExport?: () => void }) {
  if (detectionLog.length === 0) {
    return <EmptyState icon={<History className="h-10 w-10" />} message="No detection history yet. Start the camera to begin tracking." />;
  }
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button onClick={onExport} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm hover:opacity-90 transition-opacity">
          <Download className="h-3.5 w-3.5" /> Export CSV
        </button>
      </div>
      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary">
            <tr>
              <th className="text-left px-4 py-2 font-medium text-muted-foreground">Time</th>
              <th className="text-left px-4 py-2 font-medium text-muted-foreground">Label</th>
              <th className="text-left px-4 py-2 font-medium text-muted-foreground">Type</th>
              <th className="text-left px-4 py-2 font-medium text-muted-foreground">Confidence</th>
              <th className="text-left px-4 py-2 font-medium text-muted-foreground">Details</th>
            </tr>
          </thead>
          <tbody>
            {detectionLog.slice(0, 100).map((entry) => (
              <tr key={entry.id} className="border-t border-border hover:bg-secondary/50 transition-colors">
                <td className="px-4 py-2 text-muted-foreground font-mono text-xs">
                  {entry.timestamp.toLocaleTimeString()}
                </td>
                <td className="px-4 py-2 font-medium">{entry.label}</td>
                <td className="px-4 py-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    entry.type === "face" ? "bg-green-500/20 text-green-400" :
                    entry.type === "hand" ? "bg-orange-500/20 text-orange-400" :
                    "bg-blue-500/20 text-blue-400"
                  }`}>{entry.type}</span>
                </td>
                <td className="px-4 py-2 font-mono text-xs">{(entry.confidence * 100).toFixed(1)}%</td>
                <td className="px-4 py-2 text-xs text-muted-foreground">
                  {entry.age ? `${entry.age}y ${entry.gender}` : ""}
                  {entry.expression ? ` · ${entry.expression}` : ""}
                  {entry.gesture ? ` 🤚 ${entry.gesture}` : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Photos Panel ── */
function PhotosPanel({ photos }: { photos: string[] }) {
  if (photos.length === 0) {
    return <EmptyState icon={<Image className="h-10 w-10" />} message="No photos captured yet. Use the Capture button or make a ✊ fist gesture." />;
  }
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {photos.map((src, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.05 }}
          className="group relative rounded-xl overflow-hidden border border-border"
        >
          <img src={src} alt={`Capture ${i + 1}`} className="w-full aspect-video object-cover" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
            <a
              href={src}
              download={`capture_${i + 1}.png`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium"
            >
              <Download className="h-3 w-3" /> Download
            </a>
          </div>
          <div className="absolute bottom-2 left-2 text-[10px] bg-black/60 text-white px-2 py-0.5 rounded-full">
            #{i + 1}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

/* ── Recordings / Gesture Log Panel ── */
function RecordingsPanel({ gestureHistory, detectionLog }: { gestureHistory: string[]; detectionLog: DetectionLogEntry[] }) {
  const gestureEntries = detectionLog.filter(e => e.gesture);
  return (
    <div className="space-y-6">
      {/* Gesture Actions */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Gesture Actions ({gestureHistory.length})</h3>
        {gestureHistory.length === 0 ? (
          <EmptyState icon={<Video className="h-8 w-8" />} message="No gesture actions recorded yet." />
        ) : (
          <div className="space-y-1.5 max-h-64 overflow-y-auto pr-2">
            {gestureHistory.map((entry, i) => (
              <motion.div
                key={i}
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: i * 0.02 }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary text-sm"
              >
                <span className="text-xs text-muted-foreground font-mono">#{gestureHistory.length - i}</span>
                <span>{entry}</span>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Gesture-tagged detections */}
      {gestureEntries.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Gesture-Tagged Detections ({gestureEntries.length})</h3>
          <div className="space-y-1.5 max-h-64 overflow-y-auto pr-2">
            {gestureEntries.slice(0, 50).map((entry) => (
              <div key={entry.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-secondary text-sm">
                <span>{entry.label} — {entry.gesture}</span>
                <span className="text-xs text-muted-foreground">{entry.timestamp.toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Empty State ── */
function EmptyState({ icon, message }: { icon: React.ReactNode; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
      {icon}
      <p className="text-sm text-center max-w-xs">{message}</p>
    </div>
  );
}

function StatusBadge({
  icon,
  label,
  active,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <div className="relative">
        <div
          className={`h-2 w-2 rounded-full ${
            active ? "bg-primary" : "bg-muted-foreground"
          }`}
        />
        {active && (
          <div className="absolute inset-0 h-2 w-2 rounded-full bg-primary animate-pulse-ring" />
        )}
      </div>
      {icon}
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}

/* ── Dark Mode Toggle ── */
function DarkModeToggleItem() {
  const [isDark, setIsDark] = useState(() =>
    document.documentElement.classList.contains("dark")
  );

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark") {
      document.documentElement.classList.add("dark");
      setIsDark(true);
    }
  }, []);

  return (
    <DropdownMenuItem onClick={toggle}>
      {isDark ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
      {isDark ? "Light Mode" : "Dark Mode"}
    </DropdownMenuItem>
  );
}

/* ── Sign Out ── */
function SignOutItem() {
  const { signOut, user } = useAuth();
  return (
    <DropdownMenuItem onClick={signOut}>
      <LogOut className="mr-2 h-4 w-4" />
      Sign Out
      {user?.email && (
        <span className="ml-auto text-xs text-muted-foreground truncate max-w-[100px]">
          {user.email}
        </span>
      )}
    </DropdownMenuItem>
  );
}
