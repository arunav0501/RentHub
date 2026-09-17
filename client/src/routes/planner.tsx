import { createFileRoute } from "@tanstack/react-router";
import { TripPlannerPage } from "./trip-planner";

export const Route = createFileRoute("/planner")({
  component: TripPlannerPage,
});
