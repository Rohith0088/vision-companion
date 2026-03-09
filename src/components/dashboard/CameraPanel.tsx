import { useRef, useEffect } from "react";
import { Camera, CameraOff, Circle, Video } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Detection } from "@/hooks/useCamera";

interface CameraPanelProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  isActive: boolean;
  isRecording: boolean;
  detections: Detection[];
  gestureMessage: string;
  modelLoading?: boolean;
  modelsReady?: { face: boolean; object: boolean; hand: boolean };
  onStart: () => void;
  onStop: () => void;
  onCapture: () => void;
  onToggleRecord: (start: boolean) => void;
}

export function CameraPanel({
  videoRef,
  canvasRef,
  isActive,
  isRecording,
  detections,
  gestureMessage,
  modelLoading,
  modelsReady,
  onStart,
  onStop,
  onCapture,
  onToggleRecord,
}: CameraPanelProps) {
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = overlayCanvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video || !isActive) return;

    const draw = () => {
      canvas.width = video.clientWidth;
      canvas.height = video.clientHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      detections.forEach((d) => {
        const x = (d.bbox.x / 100) * canvas.width;
        const y = (d.bbox.y / 100) * canvas.height;
        const w = (d.bbox.w / 100) * canvas.width;
        const h = (d.bbox.h / 100) * canvas.height;
        const color = d.color || "#3182ce";

        ctx.shadowColor = color;
        ctx.shadowBlur = 8;
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, w, h);
        ctx.shadowBlur = 0;

        const cornerLen = Math.min(w, h) * 0.2;
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(x, y + cornerLen); ctx.lineTo(x, y); ctx.lineTo(x + cornerLen, y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x + w - cornerLen, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + cornerLen); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x, y + h - cornerLen); ctx.lineTo(x, y + h); ctx.lineTo(x + cornerLen, y + h); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x + w - cornerLen, y + h); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w, y + h - cornerLen); ctx.stroke();

        let label = d.label;
        if (d.type === "face" && d.age) {
          label = `${d.label} · ${d.age}y · ${d.gender}`;
          if (d.expression && d.expression !== "Neutral") label += ` · ${d.expression}`;
        } else {
          label = `${d.label} ${Math.round(d.confidence * 100)}%`;
        }

        ctx.font = "bold 11px 'Space Grotesk', sans-serif";
        const textW = ctx.measureText(label).width + 12;
        const labelH = 22;
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.85;
        ctx.beginPath();
        ctx.roundRect(x, y - labelH - 4, textW, labelH, 4);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.fillStyle = "#fff";
        ctx.fillText(label, x + 6, y - 10);
      });

      if (isActive) requestAnimationFrame(draw);
    };
    draw();
  }, [detections, isActive, videoRef]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="card-dark p-4 relative overflow-hidden"
    >
      <div className="relative aspect-video bg-secondary rounded-xl overflow-hidden">
        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
        <canvas ref={overlayCanvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
        <canvas ref={canvasRef} className="hidden" />

        {!isActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-secondary">
            <Camera className="h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground font-display">Camera Off</p>
            {modelLoading ? (
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-primary animate-pulse" />
                <p className="text-xs text-primary">Loading AI models...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1">
                <p className="text-xs text-muted-foreground">Real ML models ready</p>
                <div className="flex gap-2 text-[10px]">
                  <ModelStatus label="Face-API" ready={modelsReady?.face} />
                  <ModelStatus label="COCO-SSD" ready={modelsReady?.object} />
                  <ModelStatus label="Hands" ready={modelsReady?.hand} />
                </div>
              </div>
            )}
          </div>
        )}

        {isRecording && (
          <div className="absolute top-3 left-3 flex items-center gap-2 bg-primary px-3 py-1 rounded-full">
            <Circle className="h-3 w-3 fill-primary-foreground text-primary-foreground animate-pulse" />
            <span className="text-xs font-medium text-primary-foreground">REC</span>
          </div>
        )}

        {isActive && (
          <div className="absolute top-3 right-3 flex gap-1.5">
            <span className="bg-black/60 text-[10px] px-2 py-0.5 rounded-full" style={{ color: "#68d391" }}>Face ●</span>
            <span className="bg-black/60 text-[10px] px-2 py-0.5 rounded-full" style={{ color: "#63b3ed" }}>Object ●</span>
            <span className="bg-black/60 text-[10px] px-2 py-0.5 rounded-full" style={{ color: "#f6ad55" }}>Hand ●</span>
          </div>
        )}

        <AnimatePresence>
          {gestureMessage && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-primary px-4 py-2 rounded-full"
            >
              <span className="text-sm font-medium text-primary-foreground">{gestureMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-center gap-3 mt-4">
        <ControlButton
          onClick={isActive ? onStop : onStart}
          variant={isActive ? "danger" : "primary"}
          icon={isActive ? <CameraOff className="h-4 w-4" /> : <Camera className="h-4 w-4" />}
          label={isActive ? "Stop" : "Start"}
        />
        <ControlButton onClick={onCapture} disabled={!isActive} icon={<Circle className="h-4 w-4" />} label="Capture" />
        <ControlButton
          onClick={() => onToggleRecord(!isRecording)}
          disabled={!isActive}
          variant={isRecording ? "danger" : "default"}
          icon={<Video className="h-4 w-4" />}
          label={isRecording ? "Stop Rec" : "Record"}
        />
      </div>
    </motion.div>
  );
}

function ModelStatus({ label, ready }: { label: string; ready?: boolean }) {
  return (
    <span className={ready ? "text-green-500" : "text-muted-foreground"}>
      ● {label} {ready ? "✓" : "✗"}
    </span>
  );
}

function ControlButton({
  onClick, icon, label, disabled, variant = "default",
}: {
  onClick: () => void; icon: React.ReactNode; label: string; disabled?: boolean;
  variant?: "default" | "primary" | "danger";
}) {
  const styles = {
    default: "bg-secondary text-secondary-foreground hover:bg-muted",
    primary: "bg-primary text-primary-foreground hover:opacity-90",
    danger: "bg-destructive text-destructive-foreground hover:opacity-90",
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed ${styles[variant]}`}
    >
      {icon}
      {label}
    </button>
  );
}
