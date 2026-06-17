import type { Metadata } from "next";
import OSConsole from "@/components/OSConsole";

export const metadata: Metadata = {
  title: "Delta OS Console",
  description: "Local Behavioral OS and conversation runtime cockpit.",
};

export default function DeltaOSConsolePage() {
  return <OSConsole />;
}
