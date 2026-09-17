import cameraImage from "@/assets/camera.jpg";
import evImage from "@/assets/ev.jpg";
import tentImage from "@/assets/tent.jpg";
import djImage from "@/assets/dj.jpg";

export type Listing = {
  id: string;
  title: string;
  category: string;
  price: number;
  location: string;
  distance: string;
  rating: number;
  reviews: number;
  trust: number;
  owner: string;
  image: string;
};

export const listings: Listing[] = [
  { id: "sony-a7-iv", title: "Sony A7 IV Creator Kit", category: "Photography", price: 45, location: "Indiranagar", distance: "1.2 km", rating: 4.98, reviews: 36, trust: 96, owner: "Maya Rao", image: cameraImage },
  { id: "electric-suv", title: "Premium Electric SUV", category: "Vehicles", price: 118, location: "Koramangala", distance: "2.8 km", rating: 4.94, reviews: 21, trust: 92, owner: "Arjun Mehta", image: evImage },
  { id: "alpine-camp", title: "Alpine Camping Set for 4", category: "Sports", price: 28, location: "HSR Layout", distance: "3.4 km", rating: 4.91, reviews: 48, trust: 98, owner: "Nina Joseph", image: tentImage },
  { id: "dj-party", title: "Pro DJ & Speaker Package", category: "Audio & Visual", price: 76, location: "Whitefield", distance: "6.1 km", rating: 4.89, reviews: 17, trust: 94, owner: "Kabir Shah", image: djImage },
];

export const featuredListing = listings[0];