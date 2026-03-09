import { motion, AnimatePresence } from "framer-motion";
import { User, Hand, Box, Scan } from "lucide-react";
import type { Detection } from "@/hooks/useCamera";

interface DetectionPanelProps {
  detections: Detection[];
  detectionMode: string;
}

export function DetectionPanel({ detections, detectionMode }: DetectionPanelProps) {
  const iconMap = {
    face: <User className="h-4 w-4" />,
    hand: <Hand className="h-4 w-4" />,
    object: <Box className="h-4 w-4" />,
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-4"
    >
      {/* Mode indicator */}
      <div className="card-red p-4">
        <div className="flex items-center gap-2 mb-1">
          <Scan className="h-4 w-4" />
          <span className="text-sm font-medium">Detection Mode</span>
        </div>
        <p className="text-lg font-display font-bold">
          {detectionMode === "object" ? "Object Detection" : "Face Analysis"}
        </p>
        <p className="text-xs opacity-80 mt-1">
          It can detect any object and movements
        </p>
      </div>

      {/* Detected objects list */}
      <div className="card-dark p-4">
        <h3 className="font-display font-semibold mb-3 text-sm">
          Detected Objects
        </h3>
        <AnimatePresence mode="popLayout">
          {detections.length === 0 ? (
            <p className="text-muted-foreground text-sm">No detections yet</p>
          ) : (
            <div className="space-y-2">
              {detections.map((d) => (
                <motion.div
                  key={d.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center justify-between p-3 bg-secondary rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-lg bg-primary/20 text-primary">
                      {iconMap[d.type]}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-secondary-foreground">{d.label}</p>
                      {d.age && (
                        <p className="text-xs text-muted-foreground">
                          Age: {d.age} • {d.gender}
                          {d.expression && d.expression !== "Neutral" && ` • ${d.expression}`}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="text-xs font-mono bg-card px-2 py-1 rounded-lg text-card-foreground">
                    {Math.round(d.confidence * 100)}%
                  </span>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Client info cards matching reference */}
      <div className="card-dark p-4">
        <h4 className="text-sm font-semibold mb-2">Type of current clients</h4>
        <p className="text-xs text-muted-foreground border-t border-border pt-2">
          Local businesses and companies
        </p>
        <h4 className="text-sm font-semibold mt-4 mb-2">Type of clients desired</h4>
        <p className="text-xs text-muted-foreground border-t border-border pt-2">
          International business and enterprise
        </p>
      </div>
    </motion.div>
  );
}
