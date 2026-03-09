import { useState, useRef, useCallback, useEffect } from "react";
import { loadFaceModels, detectFaces, type FaceResult } from "./models/faceModel";
import { loadObjectModel, detectObjects, type ObjectResult } from "./models/objectModel";
import { loadHandModel, detectHands, type GestureName, type GestureResult } from "./models/handModel";
import { getCategoryColor, getCategoryPriority } from "./models/datasetConfig";
import { addDetectionLog, getDetectionLog, clearDetectionLog, downloadCSV, type DetectionLogEntry } from "./models/detectionLogger";

export interface Detection {
  id: string;
  label: string;
  confidence: number;
  bbox: { x: number; y: number; w: number; h: number };
  age?: number;
  gender?: string;
  expression?: string;
  type: "face" | "object" | "hand";
  color: string;
}

const GESTURE_LABELS: Record<GestureName, string> = {
  open_palm: "✋ Open Palm",
  fist: "✊ Fist",
  peace: "✌️ Peace",
  thumbs_up: "👍 Thumbs Up",
  thumbs_down: "👎 Thumbs Down",
  ok_sign: "👌 OK Sign",
  pointing: "☝️ Pointing",
  five_fingers: "🖐️ Five Fingers",
  none: "",
};

const GESTURE_ACTIONS: Record<GestureName, string> = {
  open_palm: "Tracking Activated",
  fist: "Photo Captured!",
  peace: "Detection Toggled",
  thumbs_up: "Recording Started",
  thumbs_down: "Recording Stopped",
  ok_sign: "Target Locked",
  pointing: "Object Highlighted",
  five_fingers: "System Reset",
  none: "",
};

// Debounce gesture to avoid rapid repeated triggers
const GESTURE_COOLDOWN_MS = 1500;

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number>(0);
  const lastGestureRef = useRef<{ gesture: GestureName; time: number }>({
    gesture: "none",
    time: 0,
  });

  const [isActive, setIsActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [detectionMode, setDetectionMode] = useState<"object" | "face">("object");
  const [gestureMessage, setGestureMessage] = useState("");
  const [currentGesture, setCurrentGesture] = useState<GestureName>("none");
  const [stats, setStats] = useState({ faces: 0, objects: 0, gestures: 0, hands: 0 });
  const [gestureHistory, setGestureHistory] = useState<string[]>([]);
  const [modelLoading, setModelLoading] = useState(false);
  const [modelsReady, setModelsReady] = useState({ face: false, object: false, hand: false });
  const [detectionLog, setDetectionLog] = useState<DetectionLogEntry[]>([]);

  // Load all ML models on mount
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setModelLoading(true);
      const [faceOk, objectOk, handOk] = await Promise.all([
        loadFaceModels(),
        loadObjectModel(),
        loadHandModel(),
      ]);
      if (!cancelled) {
        setModelsReady({ face: faceOk, object: objectOk, hand: handOk });
        setModelLoading(false);
        console.log(`Models ready — Face: ${faceOk}, Object: ${objectOk}, Hand: ${handOk}`);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  // Execute gesture action
  const executeGesture = useCallback(
    (gesture: GestureName) => {
      const now = Date.now();
      const last = lastGestureRef.current;
      if (gesture === "none") return;
      if (gesture === last.gesture && now - last.time < GESTURE_COOLDOWN_MS) return;

      lastGestureRef.current = { gesture, time: now };
      setCurrentGesture(gesture);

      const label = GESTURE_LABELS[gesture];
      const action = GESTURE_ACTIONS[gesture];
      setGestureMessage(action);
      setGestureHistory((h) => [`${label} → ${action}`, ...h.slice(0, 19)]);
      setStats((s) => ({ ...s, gestures: s.gestures + 1 }));

      switch (gesture) {
        case "fist":
          // Capture photo
          if (videoRef.current && canvasRef.current) {
            const canvas = canvasRef.current;
            const video = videoRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext("2d");
            if (ctx) {
              ctx.drawImage(video, 0, 0);
              setCapturedPhotos((prev) => [canvas.toDataURL("image/png"), ...prev]);
            }
          }
          break;
        case "peace":
          setDetectionMode((m) => (m === "object" ? "face" : "object"));
          break;
        case "thumbs_up":
          setIsRecording(true);
          break;
        case "thumbs_down":
          setIsRecording(false);
          break;
        case "five_fingers":
          setDetections([]);
          setStats({ faces: 0, objects: 0, gestures: 0, hands: 0 });
          setGestureHistory([]);
          clearDetectionLog();
          setDetectionLog([]);
          break;
      }
    },
    []
  );

  // Real-time detection loop
  const runDetection = useCallback(async () => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) {
      animFrameRef.current = requestAnimationFrame(runDetection);
      return;
    }

    try {
      const timestamp = performance.now();

      // Run all models in parallel
      const [faceResults, objectResults, handResults] = await Promise.all([
        detectFaces(video),
        detectObjects(video),
        Promise.resolve(detectHands(video, timestamp)),
      ]);

      const mapped: Detection[] = [];

      // Face detections
      faceResults.forEach((f: FaceResult, i: number) => {
        mapped.push({
          id: `face-${i}`,
          label: "Face",
          confidence: f.confidence,
          bbox: f.bbox,
          age: f.age,
          gender: f.gender,
          expression: f.expression,
          type: "face",
          color: getCategoryColor("face"),
        });
      });

      // Object detections
      objectResults.forEach((o: ObjectResult, i: number) => {
        mapped.push({
          id: `obj-${o.rawClass}-${i}`,
          label: o.label,
          confidence: o.confidence,
          bbox: o.bbox,
          type: "object",
          color: getCategoryColor(o.rawClass),
        });
      });

      // Hand detections
      handResults.forEach((h: GestureResult, i: number) => {
        if (h.landmarks.length > 0) {
          const xs = h.landmarks.map((l) => l.x * 100);
          const ys = h.landmarks.map((l) => l.y * 100);
          const minX = Math.min(...xs);
          const minY = Math.min(...ys);
          const maxX = Math.max(...xs);
          const maxY = Math.max(...ys);

          mapped.push({
            id: `hand-${i}`,
            label: h.gesture !== "none" 
              ? `Hand (${GESTURE_LABELS[h.gesture]})` 
              : `Hand (${h.handedness})`,
            confidence: h.confidence || 0.8,
            bbox: { x: minX, y: minY, w: maxX - minX, h: maxY - minY },
            type: "hand",
            color: getCategoryColor("hand"),
          });
        }

        // Execute gesture action
        if (h.gesture !== "none") {
          executeGesture(h.gesture);
        }
      });

      mapped.sort((a, b) =>
        getCategoryPriority(a.label) - getCategoryPriority(b.label)
      );

      setDetections(mapped);

      const newStats = {
        faces: faceResults.length,
        objects: objectResults.length,
        hands: handResults.length,
        gestures: stats.gestures, // preserve gesture count
      };
      setStats((s) => ({ ...newStats, gestures: s.gestures }));

      // Log detections (throttled — every 2 seconds via frame timing)
      const activeGesture = handResults.find((h) => h.gesture !== "none")?.gesture;
      if (mapped.length > 0) {
        addDetectionLog(mapped, activeGesture ? GESTURE_LABELS[activeGesture] : undefined);
        setDetectionLog(getDetectionLog().slice(0, 50)); // keep UI light
      }
    } catch {
      // Skip failed frames
    }

    setTimeout(() => {
      animFrameRef.current = requestAnimationFrame(runDetection);
    }, 100);
  }, [executeGesture, stats.gestures]);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, facingMode: "user" },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsActive(true);
        const allReady = modelsReady.face && modelsReady.object && modelsReady.hand;
        setGestureMessage(allReady ? "AI Models Ready — Tracking Activated" : "Loading AI Models...");

        videoRef.current.onloadeddata = () => {
          setGestureMessage("Tracking Activated");
          animFrameRef.current = requestAnimationFrame(runDetection);
        };
      }
    } catch (err) {
      console.error("Camera access denied:", err);
      setGestureMessage("Camera access denied");
    }
  }, [runDetection, modelsReady]);

  const stopCamera = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = 0;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsActive(false);
    setDetections([]);
    setGestureMessage("");
    setCurrentGesture("none");
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      setCapturedPhotos((prev) => [canvas.toDataURL("image/png"), ...prev]);
      setGestureMessage("Photo Captured!");
      setStats((s) => ({ ...s, gestures: s.gestures + 1 }));
      setGestureHistory((h) => ["📸 Manual → Photo Captured", ...h.slice(0, 19)]);
    }
  }, []);

  const toggleDetectionMode = useCallback(() => {
    setDetectionMode((m) => (m === "object" ? "face" : "object"));
    setGestureMessage(
      detectionMode === "object" ? "Face Analysis Mode" : "Object Detection Mode"
    );
    setGestureHistory((h) => ["🔄 Manual → Mode Switched", ...h.slice(0, 19)]);
  }, [detectionMode]);

  const toggleRecording = useCallback((start: boolean) => {
    setIsRecording(start);
    setGestureMessage(start ? "Recording Started" : "Recording Stopped");
    setGestureHistory((h) => [
      start ? "⏺ Manual → Recording" : "⏹ Manual → Stopped",
      ...h.slice(0, 19),
    ]);
  }, []);

  const resetSystem = useCallback(() => {
    setDetections([]);
    setStats({ faces: 0, objects: 0, gestures: 0, hands: 0 });
    setGestureHistory([]);
    setGestureMessage("System Reset");
    clearDetectionLog();
    setDetectionLog([]);
  }, []);

  const exportDetectionLog = useCallback(() => {
    downloadCSV();
    setGestureMessage("Detection log exported!");
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  return {
    videoRef,
    canvasRef,
    isActive,
    isRecording,
    capturedPhotos,
    detections,
    detectionMode,
    gestureMessage,
    currentGesture,
    stats,
    gestureHistory,
    modelLoading,
    modelsReady,
    detectionLog,
    startCamera,
    stopCamera,
    capturePhoto,
    toggleDetectionMode,
    toggleRecording,
    resetSystem,
    exportDetectionLog,
  };
}
