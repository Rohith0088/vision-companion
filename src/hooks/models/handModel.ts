import {
  FilesetResolver,
  HandLandmarker,
  type HandLandmarkerResult,
} from "@mediapipe/tasks-vision";

let handLandmarker: HandLandmarker | null = null;
let loading = false;

export type GestureName =
  | "open_palm"
  | "fist"
  | "peace"
  | "thumbs_up"
  | "thumbs_down"
  | "ok_sign"
  | "pointing"
  | "five_fingers"
  | "none";

export interface GestureResult {
  gesture: GestureName;
  confidence: number;
  landmarks: { x: number; y: number; z: number }[];
  handedness: string;
}

export async function loadHandModel(): Promise<boolean> {
  if (handLandmarker) return true;
  if (loading) {
    return new Promise((resolve) => {
      const check = setInterval(() => {
        if (handLandmarker) { clearInterval(check); resolve(true); }
      }, 200);
      setTimeout(() => { clearInterval(check); resolve(false); }, 30000);
    });
  }

  loading = true;
  try {
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
    );
    handLandmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
        delegate: "GPU",
      },
      runningMode: "VIDEO",
      numHands: 2,
      minHandDetectionConfidence: 0.5,
      minHandPresenceConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });
    console.log("✅ MediaPipe Hand Landmarker loaded");
    return true;
  } catch (err) {
    console.error("Failed to load hand model:", err);
    return false;
  } finally {
    loading = false;
  }
}

// Landmark indices
const WRIST = 0;
const THUMB_TIP = 4;
const THUMB_IP = 3;
const INDEX_TIP = 8;
const INDEX_DIP = 7;
const INDEX_MCP = 5;
const MIDDLE_TIP = 12;
const MIDDLE_DIP = 11;
const MIDDLE_MCP = 9;
const RING_TIP = 16;
const RING_DIP = 15;
const RING_MCP = 13;
const PINKY_TIP = 20;
const PINKY_DIP = 19;
const PINKY_MCP = 17;

function isFingerExtended(
  landmarks: { x: number; y: number; z: number }[],
  tipIdx: number,
  dipIdx: number,
  mcpIdx: number
): boolean {
  return landmarks[tipIdx].y < landmarks[dipIdx].y &&
    landmarks[dipIdx].y < landmarks[mcpIdx].y;
}

function isThumbExtended(
  landmarks: { x: number; y: number; z: number }[]
): boolean {
  // Thumb is extended if tip is far from index MCP
  const dx = landmarks[THUMB_TIP].x - landmarks[INDEX_MCP].x;
  const dy = landmarks[THUMB_TIP].y - landmarks[INDEX_MCP].y;
  return Math.sqrt(dx * dx + dy * dy) > 0.08;
}

function classifyGesture(
  landmarks: { x: number; y: number; z: number }[]
): { gesture: GestureName; confidence: number } {
  const thumb = isThumbExtended(landmarks);
  const index = isFingerExtended(landmarks, INDEX_TIP, INDEX_DIP, INDEX_MCP);
  const middle = isFingerExtended(landmarks, MIDDLE_TIP, MIDDLE_DIP, MIDDLE_MCP);
  const ring = isFingerExtended(landmarks, RING_TIP, RING_DIP, RING_MCP);
  const pinky = isFingerExtended(landmarks, PINKY_TIP, PINKY_DIP, PINKY_MCP);

  const allFingers = index && middle && ring && pinky;

  // Five fingers spread (all extended + thumb)
  if (allFingers && thumb) {
    return { gesture: "five_fingers", confidence: 0.9 };
  }

  // Open palm (all fingers, thumb optional)
  if (allFingers) {
    return { gesture: "open_palm", confidence: 0.85 };
  }

  // Fist (no fingers extended)
  if (!index && !middle && !ring && !pinky && !thumb) {
    return { gesture: "fist", confidence: 0.9 };
  }

  // Peace sign (index + middle only)
  if (index && middle && !ring && !pinky) {
    return { gesture: "peace", confidence: 0.85 };
  }

  // Thumbs up (only thumb extended, hand upright)
  if (thumb && !index && !middle && !ring && !pinky) {
    if (landmarks[THUMB_TIP].y < landmarks[WRIST].y) {
      return { gesture: "thumbs_up", confidence: 0.85 };
    }
    return { gesture: "thumbs_down", confidence: 0.8 };
  }

  // Pointing (only index extended)
  if (index && !middle && !ring && !pinky) {
    // Check for OK sign (thumb tip close to index tip)
    const dx = landmarks[THUMB_TIP].x - landmarks[INDEX_TIP].x;
    const dy = landmarks[THUMB_TIP].y - landmarks[INDEX_TIP].y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 0.05) {
      return { gesture: "ok_sign", confidence: 0.8 };
    }
    return { gesture: "pointing", confidence: 0.85 };
  }

  return { gesture: "none", confidence: 0 };
}

export function detectHands(
  video: HTMLVideoElement,
  timestamp: number
): GestureResult[] {
  if (!handLandmarker) return [];

  try {
    const result: HandLandmarkerResult = handLandmarker.detectForVideo(
      video,
      timestamp
    );

    if (!result.landmarks || result.landmarks.length === 0) return [];

    return result.landmarks.map((lm, i) => {
      const { gesture, confidence } = classifyGesture(lm);
      return {
        gesture,
        confidence,
        landmarks: lm,
        handedness: result.handednesses?.[i]?.[0]?.categoryName || "Unknown",
      };
    });
  } catch {
    return [];
  }
}
