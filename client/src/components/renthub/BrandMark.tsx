import { Hexagon } from "lucide-react";

export function BrandMark() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="gradient-action grid size-9 place-items-center rounded-xl">
        <Hexagon className="size-5" strokeWidth={2.5} />
      </span>
      <span className="text-lg font-extrabold text-foreground">RentHub</span>
    </div>
  );
}