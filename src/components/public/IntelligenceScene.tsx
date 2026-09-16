"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import styles from "./public-site.module.css";

const examples = [
  {
    id: "day",
    label: "Your day",
    number: "01",
    question: "Help me make a sensible training plan.",
    heading: "Start with what you actually know.",
    answer:
      "Keep the session easy until you have current recovery data. No nutrition has been logged in this example, so there is no reliable intake total to plan around.",
    sources: [
      { name: "Recovery", status: "Not current", type: "caution" },
      { name: "Nutrition", status: "No entries", type: "caution" },
      { name: "Training", status: "Plan requested", type: "neutral" },
    ],
    actions: [
      "Check current recovery before choosing intensity.",
      "Log what you have eaten and choose a manageable session.",
    ],
    note: "No assumed recovery score. No invented remaining calories.",
  },
  {
    id: "research",
    label: "Your research",
    number: "02",
    question: "Is this company worth a closer look?",
    heading: "Evidence first. Confidence earned.",
    answer:
      "A directory listing is a lead, not verification. Confirm the official company domain and first-party service evidence before ranking the opportunity. Keep gaps visible rather than filling them with guesses.",
    sources: [
      { name: "Discovery", status: "Lead only", type: "caution" },
      {
        name: "Company identity",
        status: "Needs verification",
        type: "caution",
      },
      { name: "Outreach", status: "Not authorized", type: "neutral" },
    ],
    actions: [
      "Verify the operating company and its official domain.",
      "Review source-backed opportunities before taking action.",
    ],
    note: "No fabricated company. No automatic outreach.",
  },
  {
    id: "build",
    label: "Your software",
    number: "03",
    question: "What else needs to change with this code?",
    heading: "See the system around the change.",
    answer:
      "Inspect the owning module, its declared consumers, and the checks tied to that surface. Implement in an isolated worktree, verify the result, and bring the change back for review. A passing tool is not proof of a solved task.",
    sources: [
      {
        name: "Architecture",
        status: "Declared dependencies",
        type: "neutral",
      },
      { name: "Verification", status: "Required", type: "neutral" },
      { name: "Release", status: "Separate approval", type: "caution" },
    ],
    actions: [
      "Check affected contracts, consumers, and context freshness.",
      "Run the required tests before proposing integration.",
    ],
    note: "Governed engineering tools. Not a claim of proven autonomy.",
  },
] as const;

export default function IntelligenceScene() {
  const [selected, setSelected] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const example = examples[selected];
  return (
    <section className={styles.scene} aria-label="Illustrative Delta answers">
      <div className={styles.sceneBar}>
        <span className={styles.eyebrow}>A wider view of the question</span>
        <span className={styles.exampleLabel}>
          Illustrative examples · Not live data
        </span>
      </div>
      <div
        className={styles.sceneTabs}
        role="tablist"
        aria-label="Example context"
      >
        {examples.map((item, index) => (
          <button
            key={item.id}
            id={`tab-${item.id}`}
            ref={(element) => {
              tabs.current[index] = element;
            }}
            type="button"
            role="tab"
            aria-selected={index === selected}
            aria-controls={`panel-${item.id}`}
            tabIndex={index === selected ? 0 : -1}
            onClick={() => setSelected(index)}
            onKeyDown={(event) => {
              let next = index;
              if (event.key === "ArrowRight")
                next = (index + 1) % examples.length;
              else if (event.key === "ArrowLeft")
                next = (index + examples.length - 1) % examples.length;
              else if (event.key === "Home") next = 0;
              else if (event.key === "End") next = examples.length - 1;
              else return;
              event.preventDefault();
              setSelected(next);
              tabs.current[next]?.focus();
            }}
          >
            <span>{item.number}</span>
            {item.label}
            <span aria-hidden="true">↗</span>
          </button>
        ))}
      </div>
      <div
        className={styles.sceneBody}
        id={`panel-${example.id}`}
        role="tabpanel"
        aria-labelledby={`tab-${example.id}`}
        tabIndex={0}
      >
        <aside className={styles.sourceColumn}>
          <p className={styles.eyebrow}>Context in view</p>
          {example.sources.map((source) => (
            <div className={styles.sourceRow} key={source.name}>
              <span>{source.name}</span>
              <span
                className={
                  source.type === "caution"
                    ? styles.caution
                    : styles.sourceStatus
                }
              >
                {source.status}
              </span>
            </div>
          ))}
          <p className={styles.sourceNote}>
            Relevant evidence, with its limits attached.
          </p>
        </aside>
        <div className={styles.answerColumn}>
          <p className={styles.sampleQuestion}>{example.question}</p>
          <div className={styles.answerHeading}>
            <Image src="/delta-logo.svg" alt="Delta" width={26} height={26} />
            <h2>{example.heading}</h2>
          </div>
          <p className={styles.answer}>{example.answer}</p>
          <ol className={styles.sampleActions}>
            {example.actions.map((action) => (
              <li key={action}>{action}</li>
            ))}
          </ol>
          <p className={styles.answerNote}>{example.note}</p>
        </div>
      </div>
    </section>
  );
}
