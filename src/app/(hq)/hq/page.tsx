import type { Metadata } from "next";
import DeltaHQ from "@/components/DeltaHQ";
import { getDeltaHqViewModel } from "@/lib/deltaHqServerViewModel";

export const metadata: Metadata = {
  title: "Delta HQ",
  description: "Owner operating surface for Delta engineering.",
};

export default async function DeltaHQPage() {
  return <DeltaHQ model={await getDeltaHqViewModel()} />;
}
