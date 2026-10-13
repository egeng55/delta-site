import type { Metadata } from "next";
import DeltaChatWorkspace from "@/components/chat/DeltaChatWorkspace";

export const metadata: Metadata = {
  title: "Delta workspace",
  description: "Your private Delta conversation workspace.",
};

export default function DeltaAppPage() {
  return <DeltaChatWorkspace />;
}
