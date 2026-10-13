"use client";

import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowDown, ArrowUpRight, LockKeyhole, MoveRight } from "lucide-react";
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
    title: "See the whole field.",
    body: "Delta starts with the situation around the question: current signals, earlier context, attached evidence, and what is still missing.",
    image: "/images/hero/aerial-ice.jpg",
    alt: "Aerial view of ice, mountains, and open water",
  },
  {
    index: "02",
    label: "REMEMBER",
    title: "Carry context forward.",
    body: "Useful continuity should prevent you from rebuilding the same understanding every time, without turning old context into current truth.",
    image: "/images/hero/river-blooms.jpg",
    alt: "A river framed by flowering trees beneath a blue sky",
  },
  {
    index: "03",
    label: "DECIDE",
    title: "Move with evidence.",
    body: "Delta separates observations, inferences, conflicts, and unknowns so the next decision remains grounded and visibly yours.",
    image: "/images/hero/waterfall-stones.jpg",
    alt: "A broad waterfall flowing over dark stones",
  },
] as const;

const worlds = [
  {
    index: "01",
    name: "Your day",
    summary: "Recovery, nutrition, weather, plans, and the context connecting them.",
    image: "/images/hero/coastal-wildflowers.jpg",
  },
  {
    index: "02",
    name: "Your research",
    summary: "Sources, competing claims, durable findings, and explicit uncertainty.",
    image: "/images/hero/ocean-mountains.jpg",
  },
  {
    index: "03",
    name: "Your work",
    summary: "Projects, architecture, verification, and the actual state of what was built.",
    image: "/images/hero/misty-village.jpg",
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
            src="/images/hero/mountain-moon.jpg"
            alt="Snow-covered mountains beneath a violet evening sky"
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
            A private intelligence that carries the right context forward.
          </p>
          <div className={styles.storyHeroActions}>
            <Link href="/login?redirect=/app" className={styles.storyPrimaryAction}>
              Open Delta <ArrowUpRight size={17} />
            </Link>
            <Link href="#continuity" className={styles.storyTextAction}>
              Follow the signal <ArrowDown size={15} />
            </Link>
          </div>
        </motion.div>
        <div className={styles.heroBoundary}>
          <span>Private by account</span>
          <span>Evidence-aware</span>
          <span>Owner-controlled</span>
        </div>
      </section>

      <motion.section
        id="signal"
        className={styles.signalChapter}
        initial={reduceMotion ? false : { opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ duration: 0.55 }}
      >
        <motion.div
          className={styles.signalIntro}
          initial={reduceMotion ? false : { opacity: 0, y: 42 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.55 }}
          transition={{ duration: 0.75, ease: [0.2, 0.8, 0.2, 1] }}
        >
          <p className={styles.storyIndex}>[ 01 / SIGNAL ]</p>
          <h2>Your life does not arrive in neat categories.</h2>
          <p>
            Most software waits for another prompt. Delta is built to understand
            what surrounds the question before deciding what belongs in the answer.
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
        <header className={styles.continuityHeader}>
          <p className={styles.storyIndex}>[ 02 / CONTINUITY ]</p>
          <h2>Context becomes useful when it survives the moment.</h2>
        </header>
        <div className={styles.photoSequence}>
          {chapters.map((chapter) => (
            <motion.article
              key={chapter.index}
              className={styles.photoChapter}
              initial={reduceMotion ? false : { opacity: 0.68 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, amount: 0.22 }}
              transition={{ duration: 0.8 }}
            >
              <motion.div
                className={styles.photoFrame}
                initial={reduceMotion ? false : { clipPath: "inset(10% 8% 10% 8%)" }}
                whileInView={{ clipPath: "inset(0% 0% 0% 0%)" }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ duration: 1.05, ease: [0.2, 0.8, 0.2, 1] }}
              >
                <Image
                  src={chapter.image}
                  alt={chapter.alt}
                  fill
                  sizes="(max-width: 800px) 100vw, 72vw"
                />
                <div className={styles.photoTint} aria-hidden="true" />
              </motion.div>
              <motion.div
                className={styles.photoChapterCopy}
                initial={reduceMotion ? false : { opacity: 0, y: 46 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.55 }}
                transition={{ duration: 0.75, delay: 0.12 }}
              >
                <span>{chapter.index} / {chapter.label}</span>
                <h3>{chapter.title}</h3>
                <p>{chapter.body}</p>
              </motion.div>
            </motion.article>
          ))}
        </div>
      </section>

      <section id="workspace" className={styles.workspaceBridge}>
        <motion.div
          className={styles.bridgeStatement}
          initial={reduceMotion ? false : { opacity: 0, y: 42 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.7 }}
        >
          <p className={styles.storyIndex}>[ 03 / CONVERSATION ]</p>
          <h2>Not another blank chat.</h2>
          <p>
            Start where you left off. Delta can use the context available to your
            authenticated account while keeping uncertainty and action boundaries visible.
          </p>
        </motion.div>
        <motion.div
          className={styles.workspaceWindow}
          initial={reduceMotion ? false : { opacity: 0, y: 56, rotateX: 4 }}
          whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }}
        >
          <div className={styles.workspaceBar}>
            <span><i /> DELTA / PRIVATE ACCOUNT</span>
            <span>ACCOUNT CONTEXT</span>
          </div>
          <div className={styles.workspaceBody}>
            <div className={styles.workspacePrompt}>
              <span>YOU</span>
              <p>What actually deserves attention today?</p>
            </div>
            <div className={styles.workspaceAnswer}>
              <span>DELTA</span>
              <p>
                Two things are current, one is carried from earlier context, and one
                still needs evidence. Let&apos;s separate them before deciding.
              </p>
              <div>
                <small>01 / CURRENT</small>
                <small>02 / CONTEXT</small>
                <small>03 / UNKNOWN</small>
              </div>
            </div>
          </div>
          <Link href="/login?redirect=/app" className={styles.workspaceEnter}>
            Enter your workspace <MoveRight size={18} />
          </Link>
        </motion.div>
      </section>

      <section id="worlds" className={styles.worldsChapter}>
        <div className={styles.worldsHeading}>
          <p className={styles.storyIndex}>[ 04 / ONE INTELLIGENCE ]</p>
          <h2>Different parts of life. One governed point of view.</h2>
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
              <div className={styles.worldImage}>
                <Image src={world.image} alt="" fill sizes="42vw" />
              </div>
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
        <div className={styles.authorityLock} aria-hidden="true">
          <LockKeyhole size={32} />
        </div>
        <p className={styles.storyIndex}>[ 05 / AUTHORITY ]</p>
        <h2>Understanding can continue. Action waits for you.</h2>
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
          Conversation access is not blanket permission. Publishing, outreach,
          purchases, and other consequential operations retain their own explicit boundary.
        </p>
        <Link href="/security" className={styles.storyTextAction}>
          Read the security boundary <ArrowUpRight size={15} />
        </Link>
      </motion.section>

      <section id="state" className={styles.stateChapter}>
        <header>
          <div>
            <p className={styles.storyIndex}>[ 06 / CURRENT STATE ]</p>
            <h2>Built is not the same as proven.</h2>
          </div>
          <p>
            Delta reports what is available, what remains conditional, and where
            authority still belongs to the operator.
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
          src="/images/hero/sunset-shore.jpg"
          alt="Sunset light across a quiet shore"
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
