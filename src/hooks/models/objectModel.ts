import * as tf from "@tensorflow/tfjs";
import * as cocoSsd from "@tensorflow-models/coco-ssd";

let model: cocoSsd.ObjectDetection | null = null;
let loading = false;

// Dataset label mapping - maps COCO classes to our tracking categories
const DATASET_LABELS = new Set([
  "face", "hand", "phone", "laptop", "bottle",
  "keyboard", "book", "person", "cup", "mouse",
]);

// COCO-SSD class → our label mapping
const LABEL_MAP: Record<string, string> = {
  "cell phone": "Phone",
  "laptop": "Laptop",
  "bottle": "Bottle",
  "keyboard": "Keyboard",
  "book": "Book",
  "person": "Person",
  "cup": "Cup",
  "mouse": "Mouse",
  "tv": "Monitor",
  "chair": "Chair",
  "backpack": "Backpack",
  "handbag": "Bag",
  "scissors": "Scissors",
  "remote": "Remote",
  "clock": "Clock",
};

export async function loadObjectModel(): Promise<boolean> {
  if (model) return true;
  if (loading) {
    return new Promise((resolve) => {
      const check = setInterval(() => {
        if (model) { clearInterval(check); resolve(true); }
      }, 200);
      setTimeout(() => { clearInterval(check); resolve(false); }, 30000);
    });
  }

  loading = true;
  try {
    await tf.ready();
    // Use full mobilenet_v2 for better accuracy
    model = await cocoSsd.load({ base: "mobilenet_v2" });
    console.log("✅ COCO-SSD model loaded (mobilenet_v2 - upgraded)");
    return true;
  } catch (err) {
    console.error("Failed to load COCO-SSD model:", err);
    return false;
  } finally {
    loading = false;
  }
}

export interface ObjectResult {
  label: string;
  rawClass: string;
  confidence: number;
  bbox: { x: number; y: number; w: number; h: number };
  isTrackedCategory: boolean;
}

export async function detectObjects(
  video: HTMLVideoElement
): Promise<ObjectResult[]> {
  if (!model) return [];

  try {
    const predictions = await model.detect(video, 20, 0.35);
    const videoW = video.videoWidth || video.clientWidth;
    const videoH = video.videoHeight || video.clientHeight;

    return predictions
      .filter((p) => p.class !== "person") // Faces handled by face-api
      .map((pred) => {
        const [x, y, w, h] = pred.bbox;
        const mappedLabel = LABEL_MAP[pred.class] || 
          (pred.class.charAt(0).toUpperCase() + pred.class.slice(1));

        return {
          label: mappedLabel,
          rawClass: pred.class,
          confidence: pred.score,
          bbox: {
            x: (x / videoW) * 100,
            y: (y / videoH) * 100,
            w: (w / videoW) * 100,
            h: (h / videoH) * 100,
          },
          isTrackedCategory: DATASET_LABELS.has(pred.class) || 
            DATASET_LABELS.has(mappedLabel.toLowerCase()),
        };
      });
  } catch {
    return [];
  }
}
