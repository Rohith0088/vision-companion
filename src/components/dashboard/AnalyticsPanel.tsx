import { motion } from "framer-motion";
import { Users, Box, Zap, Hand, Globe } from "lucide-react";
import heroPortrait from "@/assets/hero-portrait.jpg";
import workspace from "@/assets/workspace.jpg";

interface AnalyticsPanelProps {
  stats: { faces: number; objects: number; gestures: number; hands: number };
}

export function AnalyticsPanel({ stats }: AnalyticsPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="space-y-4"
    >
      <div className="grid grid-cols-4 gap-2">
        <StatCard icon={<Users className="h-4 w-4" />} label="Faces" value={stats.faces} />
        <StatCard icon={<Box className="h-4 w-4" />} label="Objects" value={stats.objects} />
        <StatCard icon={<Hand className="h-4 w-4" />} label="Hands" value={stats.hands} />
        <StatCard icon={<Zap className="h-4 w-4" />} label="Actions" value={stats.gestures} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="card-dark p-0 overflow-hidden rounded-2xl relative">
          <img src={heroPortrait} alt="AI Vision" className="w-full h-32 object-cover opacity-70" />
          <div className="absolute inset-0 flex items-center justify-center">
            <h3 className="text-2xl font-display font-bold text-card-foreground">System<br />Tracker</h3>
          </div>
        </div>
        <div className="card-red p-0 overflow-hidden rounded-2xl relative">
          <img src={workspace} alt="Workspace" className="w-full h-32 object-cover opacity-60" />
          <div className="absolute inset-0 flex items-center justify-center p-3">
            <p className="text-sm font-display font-bold text-center text-primary-foreground">
              3 ML Models · Real-time Detection
            </p>
          </div>
        </div>
      </div>

      <div className="card-dark p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-primary" />
          <span className="text-sm font-display">Computer Engineer</span>
        </div>
        <span className="text-xs text-muted-foreground">(Artificial Intelligence)</span>
      </div>

      <div className="card-red p-4">
        <h4 className="font-display font-bold text-sm mb-2">Active ML Models</h4>
        <ul className="text-xs space-y-1 opacity-90 list-disc list-inside">
          <li>Face-API.js — Age, Gender, Emotion</li>
          <li>COCO-SSD — Object Detection (80 classes)</li>
          <li>MediaPipe — Hand Gesture Recognition</li>
        </ul>
      </div>
    </motion.div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="card-dark p-3 text-center">
      <div className="flex items-center justify-center gap-1.5 text-primary mb-1">{icon}</div>
      <p className="text-2xl font-display font-bold text-card-foreground">{value}</p>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
    </div>
  );
}
