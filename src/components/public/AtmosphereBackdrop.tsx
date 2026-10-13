import Image from "next/image";
import styles from "./public-site.module.css";

export default function AtmosphereBackdrop({
  src,
  treatment = "dark",
  position = "center",
}: {
  src: string;
  treatment?: "dark" | "light" | "page";
  position?: string;
}) {
  const treatmentClass = {
    dark: styles.atmosphereDark,
    light: styles.atmosphereLight,
    page: styles.atmospherePage,
  }[treatment];

  return (
    <div
      className={`${styles.atmosphereBackdrop} ${treatmentClass}`}
      aria-hidden="true"
      style={{ position: "absolute" }}
    >
      <Image
        src={src}
        alt=""
        fill
        loading={treatment === "page" ? "eager" : "lazy"}
        sizes="100vw"
        style={{ objectPosition: position }}
      />
    </div>
  );
}
