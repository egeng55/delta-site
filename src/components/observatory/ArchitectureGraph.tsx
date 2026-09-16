"use client";
import { useEffect, useRef, useState } from "react";
import { Maximize2, Minus, Plus, RotateCcw } from "lucide-react";
import type { Network } from "vis-network";
import type { Graph, GraphNode } from "@/lib/observatory";
import styles from "./Observatory.module.css";

export default function ArchitectureGraph({
  graph,
  query,
  repo,
  revision,
  onSelect,
}: {
  graph: Graph;
  query: string;
  repo: string;
  revision: number;
  onSelect: (node: GraphNode | null) => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const network = useRef<Network | null>(null);
  const select = useRef(onSelect);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    select.current = onSelect;
  }, [onSelect]);
  const nodes = graph.nodes.filter(
    (node) =>
      (repo === "all" || node.group === repo) &&
      `${node.label} ${node.kind}`.toLowerCase().includes(query.toLowerCase()),
  );
  const visible = new Set(nodes.map((node) => node.id));
  const links = graph.links.filter(
    (link) => visible.has(link.source) && visible.has(link.target),
  );
  useEffect(() => {
    let disposed = false;
    void import("vis-network/standalone")
      .then(({ Network }) => {
        if (disposed || !host.current) return;
        const filtered = graph.nodes.filter(
          (node) =>
            (repo === "all" || node.group === repo) &&
            `${node.label} ${node.kind}`
              .toLowerCase()
              .includes(query.toLowerCase()),
        );
        const ids = new Set(filtered.map((node) => node.id));
        const palette: Record<string, string> = {
          agent: "#78dab3",
          backend: "#eaba82",
          site: "#bbc4fb",
          mobile: "#edaca7",
          jobs: "#d2df8b",
          runtime: "#adb9be",
          unmapped: "#737d79",
        };
        const instance = new Network(
          host.current,
          {
            nodes: filtered.map((node) => ({
              id: node.id,
              label: node.label,
              shape: node.kind === "repository" ? "hexagon" : "dot",
              size:
                node.kind === "repository"
                  ? 24
                  : node.kind === "system"
                    ? 11
                    : 5,
              color: {
                background: palette[node.group] || "#adb9be",
                border: "#121c18",
                highlight: { background: "#fff", border: "#78dab3" },
              },
              font: {
                color: "#dbe3df",
                size: graph.id === "modules" ? 10 : 12,
                face: "Inter, sans-serif",
              },
              borderWidth: 2,
            })),
            edges: graph.links
              .filter((link) => ids.has(link.source) && ids.has(link.target))
              .map((link, id) => ({
                id,
                from: link.source,
                to: link.target,
                color: "#39463f",
                width: 1,
                arrows: { to: { enabled: true, scaleFactor: 0.35 } },
              })),
          },
          {
            autoResize: true,
            layout: {
              randomSeed: 17 + revision,
              improvedLayout: filtered.length < 150,
            },
            interaction: {
              hover: true,
              keyboard: { enabled: true, bindToWindow: false },
              tooltipDelay: 500,
            },
            physics: {
              solver: "forceAtlas2Based",
              forceAtlas2Based: {
                gravitationalConstant: -55,
                springLength: 135,
                avoidOverlap: 1,
              },
              stabilization: { iterations: 200, fit: true },
            },
            edges: { smooth: false },
          },
        );
        network.current = instance;
        instance.on("selectNode", (event) =>
          select.current(
            graph.nodes.find((node) => node.id === event.nodes[0]) || null,
          ),
        );
        instance.on("deselectNode", () => select.current(null));
        instance.on("resize", () => instance.fit({ animation: false }));
        instance.once("stabilizationIterationsDone", () => {
          instance.setOptions({ physics: false });
          instance.fit({ animation: false });
        });
      })
      .catch(() => {
        if (!disposed) setFailed(true);
      });
    return () => {
      disposed = true;
      network.current?.destroy();
      network.current = null;
    };
  }, [graph, query, repo, revision]);
  return (
    <div className={styles.graph}>
      <div
        ref={host}
        className={styles.canvas}
        aria-label={`${graph.id} graph: ${nodes.length} nodes and ${links.length} static edges`}
        role="img"
      />
      {!nodes.length && (
        <div className={styles.graphEmpty}>No matching nodes</div>
      )}
      {failed && (
        <div role="alert" className={styles.graphEmpty}>
          Graph could not load. The node list remains available.
        </div>
      )}
      <div className={styles.graphCaption}>
        <span className={styles.dot} /> {nodes.length} nodes <span>/</span>{" "}
        {links.length} edges <span>/</span> static evidence
      </div>
      <div className={styles.graphControls}>
        <button
          title="Zoom in"
          aria-label="Zoom in"
          onClick={() => {
            const n = network.current;
            if (n) n.moveTo({ scale: Math.min(3, n.getScale() * 1.25) });
          }}
        >
          <Plus size={16} />
        </button>
        <button
          title="Zoom out"
          aria-label="Zoom out"
          onClick={() => {
            const n = network.current;
            if (n) n.moveTo({ scale: Math.max(0.15, n.getScale() / 1.25) });
          }}
        >
          <Minus size={16} />
        </button>
        <button
          title="Fit graph"
          aria-label="Fit graph"
          onClick={() => network.current?.fit({ animation: false })}
        >
          <Maximize2 size={16} />
        </button>
        <button
          title="Reset viewport"
          aria-label="Reset viewport"
          onClick={() => network.current?.fit({ animation: false })}
        >
          <RotateCcw size={16} />
        </button>
      </div>
    </div>
  );
}
