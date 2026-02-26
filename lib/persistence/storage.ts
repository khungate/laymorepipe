import { CulvertDesign } from "../types/culvert";

const STORAGE_KEY = "permatile-current-design";

export function saveDesign(design: CulvertDesign): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(design));
  } catch {
    // localStorage may be full or unavailable
  }
}

export function loadDesign(): CulvertDesign | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearDesign(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function exportDesignJSON(design: CulvertDesign): void {
  const json = JSON.stringify(design, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const name = design.project.projectNumber || "design";
  const date = new Date().toISOString().split("T")[0];
  a.href = url;
  a.download = `${name}-${date}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importDesignJSON(file: File): Promise<CulvertDesign> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const design = JSON.parse(reader.result as string) as CulvertDesign;
        // Basic shape validation
        if (!design.geometry || !design.units || !design.materials || !design.reinforcement || !design.project) {
          reject(new Error("Invalid design file: missing required sections"));
          return;
        }
        resolve(design);
      } catch {
        reject(new Error("Invalid JSON file"));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
}
