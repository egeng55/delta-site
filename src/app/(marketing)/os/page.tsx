import type { Metadata } from "next";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import OSConsole from "@/components/OSConsole";

export const metadata: Metadata = {
  title: "Delta OS Console",
  description: "Local Behavioral OS and conversation runtime cockpit.",
};

export default function DeltaOSConsolePage() {
  return (
    <>
      <Navigation />
      <OSConsole />
      <Footer />
    </>
  );
}
