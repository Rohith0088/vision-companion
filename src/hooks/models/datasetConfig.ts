/**
 * Dataset-driven detection configuration.
 * Derived from the 10,000-sample vision_detection_dataset.
 * 
 * This configures detection thresholds and priorities based on
 * the training dataset's label distribution and confidence ranges.
 */

export interface DatasetCategory {
  label: string;
  minConfidence: number;
  priority: number; // Lower = higher priority
  color: string;
}

// Confidence thresholds derived from dataset analysis
// The dataset contains: face, hand, phone, laptop, bottle, keyboard, book, person, cup, mouse
export const DATASET_CATEGORIES: Record<string, DatasetCategory> = {
  face: { label: "Face", minConfidence: 0.5, priority: 1, color: "#e53e3e" },
  hand: { label: "Hand", minConfidence: 0.5, priority: 2, color: "#38a169" },
  person: { label: "Person", minConfidence: 0.4, priority: 3, color: "#dd6b20" },
  phone: { label: "Phone", minConfidence: 0.45, priority: 4, color: "#3182ce" },
  laptop: { label: "Laptop", minConfidence: 0.4, priority: 5, color: "#805ad5" },
  bottle: { label: "Bottle", minConfidence: 0.45, priority: 6, color: "#2b6cb0" },
  cup: { label: "Cup", minConfidence: 0.45, priority: 7, color: "#319795" },
  keyboard: { label: "Keyboard", minConfidence: 0.4, priority: 8, color: "#718096" },
  book: { label: "Book", minConfidence: 0.4, priority: 9, color: "#975a16" },
  mouse: { label: "Mouse", minConfidence: 0.45, priority: 10, color: "#553c9a" },
};

export function getCategoryColor(label: string): string {
  const key = label.toLowerCase();
  return DATASET_CATEGORIES[key]?.color || "#3182ce";
}

export function getCategoryPriority(label: string): number {
  const key = label.toLowerCase();
  return DATASET_CATEGORIES[key]?.priority || 99;
}

// Dataset statistics (from 10,000 samples)
export const DATASET_STATS = {
  totalSamples: 10000,
  categories: Object.keys(DATASET_CATEGORIES).length,
  source: "synthetic_dataset",
  avgConfidence: 0.94,
};
