"use client";

import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowDown, ArrowUpRight, LockKeyhole } from "lucide-react";
import AtmosphereBackdrop from "./AtmosphereBackdrop";
import DeltaConversationExample from "./DeltaConversationExample";
import styles from "./public-site.module.css";

const DeltaMarkScene = dynamic(() => import("./DeltaMarkScene"), {
  ssr: false,
});

const signalRows = [
  ["01", "CONVERSATION", "What changed since yesterday?"],
  ["02", "EVIDENCE", "Three current sources · one unresolved conflict"],
  ["03", "PERSONAL", "Recovery is current · nutrition is incomplete"],
  ["04", "BUILD", "Verification passed · publication not authorized"],
] as const;

const chapters = [
  {
    index: "01",
    label: "OBSERVE",
    title: "Start with what matters.",
    body: "A deadline you just mentioned matters more than an old plan. Delta brings relevant context into the question and keeps missing information visible.",
  },
  {
    index: "02",
    label: "REMEMBER",
    title: "Keep the thread.",
    body: "A project rarely fits in one conversation. Continuity is about bringing forward the useful parts, while checking whether earlier information still holds.",
  },
  {
    index: "03",
    label: "DECIDE",
    title: "Know why, then decide.",
    body: "A recommendation should come with its basis. What was provided, what was inferred, and what still needs checking should not look like the same thing.",
  },
] as const;

const worlds = [
  {
    index: "01",
    name: "Your day",
    summary: "Recovery, nutrition, weather, plans, and the context connecting them.",
  },
  {
    index: "02",
    name: "Your research",
    summary: "Sources, competing claims, durable findings, and explicit uncertainty.",
  },
  {
    index: "03",
    name: "Your work",
    summary: "Projects, architecture, verification, and the actual state of what was built.",
  },
] as const;

const currentState = [
  ["01", "Account-scoped conversation", "PRIVATE PREVIEW"],
  ["02", "Evidence-aware research", "OWNER OPERATED"],
  ["03", "Personal continuity", "OWNER OPERATED"],
  ["04", "Connected context", "CONDITIONAL"],
  ["05", "Consequential actions", "EXPLICIT APPROVAL"],
] as const;

export default function DeltaStory() {
  const reduceMotion = useReducedMotion();
  const { scrollY } = useScroll();
  const heroCopyY = useTransform(scrollY, [0, 900], [0, reduceMotion ? 0 : 180]);
  const heroCopyOpacity = useTransform(scrollY, [0, 650], [1, 0]);
  const heroImageScale = useTransform(scrollY, [0, 900], [1.02, reduceMotion ? 1.02 : 1.14]);

  return (
    <>
      <section className={styles.storyHero}>
        <motion.div
          className={styles.storyHeroImage}
          style={{ position: "absolute", inset: 0, scale: heroImageScale }}
        >
          <Image
            src="/images/atmosphere/mountain-moon.jpg"
            alt=""
            fill
            priority
            sizes="100vw"
          />
        </motion.div>
        <div className={styles.storyHeroWash} aria-hidden="true" />
        <div className={styles.heroGrid} aria-hidden="true" />
        <div className={styles.edgeWord} aria-hidden="true">
          <span>DEL</span>
          <span>TA</span>
        </div>
        <DeltaMarkScene />
        <motion.div
          className={styles.storyHeroCopy}
          style={{ y: heroCopyY, opacity: heroCopyOpacity }}
        >
          <p className={styles.storyKicker}>Personal intelligence operating system</p>
          <h1>Delta</h1>
          <p className={styles.storyThesis}>
            A personal intelligence for the life you&apos;re building.
          </p>
          <p className={styles.heroDescription}>Think through a decision. Keep a project moving. Bring the useful context with you.</p>
          <div className={styles.storyHeroActions}>
            <Link href="/login?redirect=/app" className={styles.storyPrimaryAction}>
              Open Delta <ArrowUpRight size={17} />
            </Link>
            <Link href="#examples" className={styles.storyTextAction}>
              Meet Delta <ArrowDown size={15} />
            </Link>
          </div>
        </motion.div>
        <div className={styles.heroBoundary}>
          <span>Private by account</span>
          <span>Evidence-aware</span>
          <span>Owner-controlled</span>
        </div>
      </section>

      <section id="examples" className={styles.exampleChapter} aria-labelledby="example-title">
        <AtmosphereBackdrop src="/images/atmosphere/river-blooms.jpg" treatment="light" position="center 52%" />
        <div className={styles.exampleHeading}>
          <p className={styles.storyIndex}>[ 01 / IN CONVERSATION ]</p>
          <h2 id="example-title">A question.<br />A clearer next step.</h2>
          <p>A useful answer does more than sound convincing. It connects what you know to what you can do next, without filling in the gaps for you.</p>
          <div className={styles.exampleAside}>
            <span>Context</span><span>Perspective</span><span>Your decision</span>
          </div>
          <Link href="/access" className={styles.exampleAccess}>Private preview <ArrowUpRight size={16} /></Link>
        </div>
        <DeltaConversationExample />
      </section>

      <motion.section
        id="signal"
        className={styles.signalChapter}
        initial={reduceMotion ? false : { opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ duration: 0.55 }}
      >
        <AtmosphereBackdrop
          src="/images/atmosphere/lake-sunset.jpg"
          treatment="light"
          position="center 58%"
        />
        <motion.div
          className={styles.signalIntro}
          initial={reduceMotion ? false : { opacity: 0, y: 42 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.55 }}
          transition={{ duration: 0.75, ease: [0.2, 0.8, 0.2, 1] }}
        >
          <p className={styles.storyIndex}>[ 02 / CONTEXT ]</p>
          <h2>The question is only part of the picture.</h2>
          <p>
            What you said earlier. The source you attached. Something that changed
            this morning. Delta&apos;s direction is to bring the relevant pieces together,
            without treating everything it has seen as equally useful or current.
          </p>
        </motion.div>
        <div className={styles.signalLedger} aria-label="Illustrative context signals">
          {signalRows.map(([index, kind, signal], rowIndex) => (
            <motion.div
              key={index}
              className={styles.signalRow}
              initial={reduceMotion ? false : { opacity: 0, x: 32 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.7 }}
              transition={{
                duration: 0.55,
                delay: rowIndex * 0.08,
                ease: [0.2, 0.8, 0.2, 1],
              }}
            >
              <span>[{index}]</span>
              <strong>{kind}</strong>
              <p>{signal}</p>
              <i aria-hidden="true" />
            </motion.div>
          ))}
        </div>
        <p className={styles.illustrativeNote}>
          Illustrative examples · no account data
        </p>
      </motion.section>

      <section id="continuity" className={styles.continuityChapter}>
        <AtmosphereBackdrop
          src="/images/atmosphere/aerial-glaciers.jpg"
          treatment="dark"
          position="center 38%"
        />
        <header className={styles.continuityHeader}>
          <p className={styles.storyIndex}>[ 03 / CONTINUITY ]</p>
          <h2>From one question<br />to the next.</h2>
        </header>
        <div className={styles.continuitySequence}>
          {chapters.map((chapter) => (
            <motion.article
              key={chapter.index}
              className={styles.continuityStep}
              initial={reduceMotion ? false : { opacity: 0, y: 44 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.45 }}
              transition={{ duration: 0.72, ease: [0.2, 0.8, 0.2, 1] }}
            >
              <span className={styles.continuityNumber} aria-hidden="true">
                {chapter.index}
              </span>
              <div className={styles.continuityLabel}>{chapter.label}</div>
              <div className={styles.continuityCopy}>
                <h3>{chapter.title}</h3>
                <p>{chapter.body}</p>
              </div>
              <span className={styles.continuityStatus}>CONTEXT LAYER</span>
            </motion.article>
          ))}
        </div>
      </section>

      <section id="worlds" className={styles.worldsChapter}>
        <div className={styles.worldsHeading}>
          <p className={styles.storyIndex}>[ 04 / DIRECTIONS ]</p>
          <h2>Built around life.<br />Not one kind of task.</h2>
        </div>
        <div className={styles.worldList}>
          {worlds.map((world, worldIndex) => (
            <motion.article
              key={world.index}
              className={styles.worldRow}
              initial={reduceMotion ? false : { opacity: 0, x: -26 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.7 }}
              transition={{ duration: 0.58, delay: worldIndex * 0.08 }}
            >
              <span>[{world.index}]</span>
              <h3>{world.name}</h3>
              <p>{world.summary}</p>
              <ArrowUpRight size={19} aria-hidden="true" />
            </motion.article>
          ))}
        </div>
      </section>

      <motion.section
        id="authority"
        className={styles.authorityChapter}
        initial={reduceMotion ? false : { opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ duration: 0.75 }}
      >
        <AtmosphereBackdrop
          src="/images/atmosphere/ocean-mountains.jpg"
          treatment="dark"
          position="center 45%"
        />
        <div className={styles.authorityLock} aria-hidden="true">
          <LockKeyhole size={32} />
        </div>
        <p className={styles.storyIndex}>[ 05 / YOUR CONTROL ]</p>
        <h2>Help thinking.<br />Not a blank cheque.</h2>
        <motion.div
          className={styles.authorityFlow}
          initial={reduceMotion ? false : { opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.7 }}
          transition={{ duration: 0.75, delay: 0.15 }}
        >
          <span>OBSERVE</span><i /><span>REASON</span><i /><span>PROPOSE</span><i /><strong>APPROVE</strong>
        </motion.div>
        <p>
          Talking through a plan is different from carrying it out. Publishing,
          sending messages, or making purchases needs its own permission.
        </p>
        <Link href="/security" className={styles.storyTextAction}>
          Privacy and control <ArrowUpRight size={15} />
        </Link>
      </motion.section>

      <section id="state" className={styles.stateChapter}>
        <AtmosphereBackdrop
          src="/images/atmosphere/orange-sunset.jpg"
          treatment="light"
          position="center 54%"
        />
        <header>
          <div>
            <p className={styles.storyIndex}>[ 06 / CURRENT STATE ]</p>
            <h2>Where Delta is today.</h2>
          </div>
          <p>
            Delta is in active development. Preview access is limited;
            owner-operated work does not automatically become a feature in every account.
          </p>
        </header>
        <div className={styles.stateIndex}>
          {currentState.map(([index, capability, state], stateIndex) => (
            <motion.div
              key={index}
              initial={reduceMotion ? false : { opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.8 }}
              transition={{ duration: 0.5, delay: stateIndex * 0.06 }}
            >
              <span>[{index}]</span>
              <strong>{capability}</strong>
              <em>{state}</em>
            </motion.div>
          ))}
        </div>
        <Link href="/research" className={styles.stateLink}>
          Explore current development <ArrowUpRight size={17} />
        </Link>
      </section>

      <motion.section
        id="enter"
        className={styles.finalPortal}
        initial={reduceMotion ? false : { opacity: 0.6 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ duration: 1 }}
      >
        <Image
          src="/images/atmosphere/sunset-shore.jpg"
          alt=""
          fill
          sizes="100vw"
        />
        <div className={styles.finalPortalShade} aria-hidden="true" />
        <motion.div
          className={styles.finalPortalMark}
          aria-hidden="true"
          initial={reduceMotion ? false : { opacity: 0, scale: 0.72, rotate: -7 }}
          whileInView={{ opacity: 0.3, scale: 1, rotate: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 1.15, ease: [0.2, 0.8, 0.2, 1] }}
        />
        <motion.div
          className={styles.finalPortalCopy}
          initial={reduceMotion ? false : { opacity: 0, y: 34 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.65 }}
          transition={{ duration: 0.7, delay: 0.15 }}
        >
          <p>[ 07 / ENTER DELTA ]</p>
          <h2>Continue the conversation.</h2>
          <Link href="/login?redirect=/app">
            Open Delta <ArrowUpRight size={20} />
          </Link>
          <small>Private preview · Account-scoped context</small>
        </motion.div>
      </motion.section>
    </>
  );
}
