import DeltaStory from "@/components/public/DeltaStory";
import { PublicSite } from "@/components/public/PublicSite";

export default function Home() {
  return (
    <PublicSite>
      <main id="main">
        <DeltaStory />
      </main>
    </PublicSite>
  );
}
