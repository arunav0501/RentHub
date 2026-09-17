import cameraImage from "@/assets/camera.jpg";
import evImage from "@/assets/ev.jpg";
import tentImage from "@/assets/tent.jpg";
import djImage from "@/assets/dj.jpg";

export function resolveProductImage(
  imagePath?: string | null,
  categoryName?: string | null,
  title?: string | null
): string {
  if (imagePath && imagePath.trim() !== "") {
    if (imagePath.startsWith("http://") || imagePath.startsWith("https://") || imagePath.startsWith("data:")) {
      return imagePath;
    }
    const cleanPath = imagePath.startsWith("/") ? imagePath : `/${imagePath}`;
    const API_BASE_URL = (String(import.meta.env["VITE_API_URL"] || "")).replace(/\/$/, "");
    return API_BASE_URL ? `${API_BASE_URL}${cleanPath}` : cleanPath;
  }

  const cat = (categoryName || "").toLowerCase();
  const t = (title || "").toLowerCase();

  if (cat.includes("photo") || t.includes("camera") || t.includes("gopro") || t.includes("lens") || t.includes("drone")) {
    return cameraImage;
  }
  if (cat.includes("audio") || cat.includes("music") || t.includes("speaker") || t.includes("guitar") || t.includes("piano") || t.includes("sound")) {
    return djImage;
  }
  if (cat.includes("sport") || t.includes("tent") || t.includes("camp") || t.includes("trek") || t.includes("outdoor")) {
    return tentImage;
  }
  if (cat.includes("vehicle") || t.includes("car") || t.includes("suv") || t.includes("bike") || t.includes("tesla") || t.includes("ev")) {
    return evImage;
  }

  return cameraImage;
}

export { cameraImage, evImage, tentImage, djImage };
