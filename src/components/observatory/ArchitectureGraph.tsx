"use client";
import { useEffect, useRef, useState } from "react";
import { Maximize2, Minus, Plus, RotateCcw } from "lucide-react";
import type { Network } from "vis-network";
import type { Graph, GraphNode } from "@/lib/observatory";
import {
  boundedGraphScale,
  MIN_GRAPH_SCALE,
  MAX_GRAPH_SCALE,
} from "@/lib/graphViewport";
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
  const [scale, setScale] = useState(1);
  const initialView = useRef<{
    scale: number;
    position: { x: number; y: number };
  } | null>(null);
  const fit = useRef<() => void>(() => {});
  function zoomTo(value: number) {
    const bounded = boundedGraphScale(value);
    network.current?.moveTo({ scale: bounded });
    setScale(bounded);
  }
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
          agent: "#b5c9a9",
          backend: "#92b6ca",
          site: "#cec9e8",
          mobile: "#dca9bc",
          jobs: "#d5ca94",
          runtime: "#adb9be",
          unmapped: "#737d79",
        };
        const instance = new Network(
          host.current,
          {
            nodes: filtered.map((node) => ({
              id: node.id,
              label:
                node.label.length > 28
                  ? node.label.slice(0, 25) + "..."
                  : node.label,
              shape: node.kind === "repository" ? "hexagon" : "dot",
              size:
                node.kind === "repository"
                  ? 24
                  : node.kind === "system"
                    ? 11
                    : 5,
              color: {
                background: palette[node.group] || "#adb9be",
                border: "#191d1b",
                highlight: { background: "#fff", border: "#b5c9a9" },
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
                color: "#556252",
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
              zoomSpeed: 0.35,
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
        const clamp = () => {
          const actual = instance.getScale();
          const bounded = boundedGraphScale(actual);
          if (actual !== bounded) instance.moveTo({ scale: bounded });
          setScale(bounded);
        };
        fit.current = () => {
          instance.fit({ animation: false });
          // Leave breathing room for labels at the viewport edge.
          instance.moveTo({ scale: boundedGraphScale(instance.getScale() * 0.9) });
          clamp();
        };
        instance.on("zoom", clamp);
        instance.on("selectNode", (event) =>
          select.current(
            graph.nodes.find((node) => node.id === event.nodes[0]) || null,
          ),
        );
        instance.on("deselectNode", () => select.current(null));
        instance.on("resize", () => fit.current());
        instance.once("stabilizationIterationsDone", () => {
          instance.setOptions({ physics: false });
          fit.current();
          initialView.current = {
            scale: boundedGraphScale(instance.getScale()),
            position: instance.getViewPosition(),
          };
        });
      })
      .catch(() => {
        if (!disposed) setFailed(true);
      });
    return () => {
      disposed = true;
      network.current?.destroy();
      network.current = null;
      initialView.current = null;
      fit.current = () => {};
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
        {nodes.length} nodes · {links.length} static edges
      </div>
      <div className={styles.graphControls}>
        <button
          title="Zoom in"
          aria-label="Zoom in"
          disabled={scale >= MAX_GRAPH_SCALE || !nodes.length}
          onClick={() => {
            const n = network.current;
            if (n) zoomTo(n.getScale() * 1.25);
          }}
        >
          <Plus size={16} />
        </button>
        <output aria-label="Graph zoom">{Math.round(scale * 100)}%</output>
        <button
          title="Zoom out"
          aria-label="Zoom out"
          disabled={scale <= MIN_GRAPH_SCALE || !nodes.length}
          onClick={() => {
            const n = network.current;
            if (n) zoomTo(n.getScale() / 1.25);
          }}
        >
          <Minus size={16} />
        </button>
        <button
          title="Fit graph"
          aria-label="Fit graph"
          disabled={!nodes.length}
          onClick={() => fit.current()}
        >
          <Maximize2 size={16} />
        </button>
        <button
          title="Reset viewport"
          aria-label="Reset viewport"
          disabled={!nodes.length}
          onClick={() => {
            const view = initialView.current;
            if (view) {
              network.current?.moveTo({ ...view, animation: false });
              setScale(view.scale);
            } else fit.current();
          }}
        >
          <RotateCcw size={16} />
        </button>
      </div>
    </div>
  );
}
