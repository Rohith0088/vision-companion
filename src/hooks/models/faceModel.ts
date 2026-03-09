import * as faceapi from "@vladmandic/face-api";

let modelsLoaded = false;
let loading = false;

const MODEL_URL = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model";

export async function loadFaceModels(): Promise<boolean> {
  if (modelsLoaded) return true;
  if (loading) {
    // Wait for existing load
    return new Promise((resolve) => {
      const check = setInterval(() => {
        if (modelsLoaded) { clearInterval(check); resolve(true); }
      }, 200);
      setTimeout(() => { clearInterval(check); resolve(false); }, 30000);
    });
  }

  loading = true;
  try {
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL),
      faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
    ]);
    modelsLoaded = true;
    console.log("✅ Face-API models loaded (TinyFaceDetector + AgeGender + Expressions)");
    return true;
  } catch (err) {
    console.error("Failed to load face-api models:", err);
    return false;
  } finally {
    loading = false;
  }
}

export interface FaceResult {
  bbox: { x: number; y: number; w: number; h: number };
  age: number;
  gender: string;
  genderProbability: number;
  expression: string;
  confidence: number;
}

export async function detectFaces(
  video: HTMLVideoElement
): Promise<FaceResult[]> {
  if (!modelsLoaded) return [];

  try {
    const results = await faceapi
      .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions({
        inputSize: 320,
        scoreThreshold: 0.4,
      }))
      .withAgeAndGender()
      .withFaceExpressions();

    const videoW = video.videoWidth || video.clientWidth;
    const videoH = video.videoHeight || video.clientHeight;

    return results.map((r) => {
      const box = r.detection.box;
      const expressions = r.expressions.asSortedArray();
      const topExpression = expressions[0]?.expression || "neutral";

      return {
        bbox: {
          x: (box.x / videoW) * 100,
          y: (box.y / videoH) * 100,
          w: (box.width / videoW) * 100,
          h: (box.height / videoH) * 100,
        },
        age: Math.round(r.age),
        gender: r.gender.charAt(0).toUpperCase() + r.gender.slice(1),
        genderProbability: r.genderProbability,
        expression: topExpression.charAt(0).toUpperCase() + topExpression.slice(1),
        confidence: r.detection.score,
      };
    });
  } catch {
    return [];
  }
}

export { faceapi };
