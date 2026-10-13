"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, ChevronDown, FileText, MessageSquare, Search, Wrench } from "lucide-react";
import styles from "./conversation-example.module.css";

const examples = [
  {
    id: "day", label: "Your day", icon: MessageSquare,
    question: "What actually deserves my attention today?",
    answer: "The proposal comes first. The rest depends on what changed.",
    paragraphs: [
      "You said the proposal is due this afternoon. Finishing the outline would move that forward more than starting another task.",
      "Yesterday, you mentioned a meeting might move. I don't have a current update, so I would keep that time open rather than assume it is free.",
    ],
    next: "Finish the outline, then confirm the meeting time.",
    context: [
      { name: "Your current note", detail: "The proposal is due this afternoon.", state: "Provided" },
      { name: "Earlier conversation", detail: "The meeting may move; no new time was confirmed.", state: "Earlier" },
      { name: "Today's schedule", detail: "No connected calendar is used in this example.", state: "Unknown" },
    ],
  },
  {
    id: "research", label: "A decision", icon: Search,
    question: "Which of these two options deserves a closer look?",
    answer: "Option B fits the stated need. Its long-term cost is still an open question.",
    paragraphs: [
      "Your priority is exporting the work, not adding more features. In the material you supplied, B documents an export path; A leaves that unclear.",
      "The price notes are from different dates. I would verify the current terms before calling either option cheaper.",
    ],
    next: "Verify B's current terms before making a commitment.",
    context: [
      { name: "Your requirements", detail: "Exporting completed work is a requirement; extra features are optional.", state: "Provided" },
      { name: "Comparison notes", detail: "B describes an export path. A's supplied notes do not establish one.", state: "Provided" },
      { name: "Price notes", detail: "Different dates; current pricing has not been checked.", state: "Unconfirmed" },
    ],
  },
  {
    id: "project", label: "A project", icon: Wrench,
    question: "Is this website change ready to publish?",
    answer: "The local checks pass. That is not the same as a live release.",
    paragraphs: [
      "The supplied report shows a successful build and a mobile layout check. That supports reviewing the change.",
      "There is no deployment receipt or approval in this example. I would show you the preview and leave the live site unchanged.",
    ],
    next: "Review the preview, then decide whether to publish.",
    context: [
      { name: "Local check report", detail: "Build passed; mobile layout checked. Illustrative report only.", state: "Provided" },
      { name: "Deployment receipt", detail: "No release has been performed or verified.", state: "Absent" },
      { name: "Your approval", detail: "Publishing has not been authorized.", state: "Required" },
    ],
  },
] as const;

export default function DeltaConversationExample() {
  const [selected, setSelected] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const tabs = useRef<Array<HTMLButtonElement | null>>([]);
  const example = examples[selected];

  function select(index: number, focus = false) {
    setSelected(index);
    setExpanded(false);
    if (focus) tabs.current[index]?.focus();
  }

  return (
    <div className={styles.example}>
      <div className={styles.topline}>
        <span><Image src="/delta-logo.svg" alt="" width={22} height={22} /> DELTA</span>
        <span>Example conversation</span>
      </div>
      <div role="tablist" aria-label="Conversation examples" className={styles.tabs}>
        {examples.map((item, index) => {
          const Icon = item.icon;
          return (
            <button key={item.id} type="button" role="tab"
              ref={(element) => { tabs.current[index] = element; }}
              id={`example-tab-${item.id}`} aria-controls={`example-panel-${item.id}`}
              aria-selected={selected === index} tabIndex={selected === index ? 0 : -1}
              onClick={() => select(index)}
              onKeyDown={(event) => {
                let next = index;
                if (event.key === "ArrowRight") next = (index + 1) % examples.length;
                else if (event.key === "ArrowLeft") next = (index + examples.length - 1) % examples.length;
                else if (event.key === "Home") next = 0;
                else if (event.key === "End") next = examples.length - 1;
                else return;
                event.preventDefault();
                select(next, true);
              }}>
              <Icon size={16} aria-hidden="true" />{item.label}
            </button>
          );
        })}
      </div>
      <div className={styles.conversation} role="tabpanel" tabIndex={0}
        id={`example-panel-${example.id}`} aria-labelledby={`example-tab-${example.id}`}>
        <div className={styles.question}><span>You</span><p>{example.question}</p></div>
        <div key={example.id} className={styles.answer}>
          <span className={styles.speaker}>Delta</span>
          <h3>{example.answer}</h3>
          {example.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          <div className={styles.next}><span>Next step</span><p>{example.next}</p></div>
        </div>
        <button className={styles.contextToggle} type="button" aria-expanded={expanded}
          aria-controls="example-context" onClick={() => setExpanded(!expanded)}>
          <FileText size={16} aria-hidden="true" /><span>Context behind this answer</span>
          <ChevronDown size={16} aria-hidden="true" className={expanded ? styles.rotated : undefined} />
        </button>
        <div id="example-context" hidden={!expanded} className={styles.context}>
          {example.context.map((item) => (
            <div key={item.name}><strong>{item.name}</strong><small>{item.state}</small><p>{item.detail}</p></div>
          ))}
        </div>
      </div>
      <div className={styles.bottomline}>
        <p>Illustrative content. No live session or account data.</p>
        <Link href="/product">Explore Delta <ArrowUpRight size={15} aria-hidden="true" /></Link>
      </div>
    </div>
  );
}
