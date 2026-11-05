import { censusTimeline } from "./censusTimeline";
import archive from "./historianArchive.json";
import type { HistorianArchive } from "./historian";
const checkpoint = (id: string, day: number, value: number | null, extra = {}) => ({ id, date: `2026-01-${String(day).padStart(2,"0")}T12:00:00Z`, methodology: "v1", quality: "complete", missingQualification: true, scope: "agent:canonical", values: { source_loc: value }, ...extra });
function data(checkpoints: HistorianArchive["snapshots"]): HistorianArchive {
  return { ...archive as HistorianArchive, growthArchive: { version: 1, comparisons: [], checkpoints } };
}
it("sorts the whole retained record and compares endpoints without summing", () => {
  const result = censusTimeline(data([checkpoint("c",3,90), checkpoint("a",1,10), checkpoint("b",2,100)]), "source_loc");
  expect(result.points.map(p=>p.id)).toEqual(["a","b","c"]);
  expect(result.totalChange).toBe(80);
  expect(result.recentChange).toBe(-10);
});
it("preserves every checkpoint but excludes different scopes, methodologies and incomplete records from deltas", () => {
  const result = censusTimeline(data([checkpoint("a",1,10,{scope:"other"}),checkpoint("b",2,20,{methodology:"v2"}),checkpoint("c",3,30,{quality:"partial"}),checkpoint("d",4,40),checkpoint("e",5,50)]),"source_loc");
  expect(result.points).toHaveLength(5);
  expect(result.first?.id).toBe("d");
  expect(result.totalChange).toBe(10);
});
it("never substitutes zero for missing values or implies a comparable baseline without scope", () => {
  expect(censusTimeline(data([checkpoint("a",1,0),checkpoint("b",2,null)]),"source_loc").totalChange).toBeNull();
  expect(censusTimeline(data([checkpoint("a",1,0,{scope:""}),checkpoint("b",2,5,{scope:""})]),"source_loc").first).toBeNull();
  expect(censusTimeline(data([checkpoint("a",1,0),checkpoint("b",2,5)]),"source_loc").totalChange).toBe(5);
});
it("retains older publications while detecting conflicting comparison measurements", () => {
  const base = archive as HistorianArchive;
  const value = { ...base, growthArchive: { version: 1 as const, checkpoints: base.snapshots, comparisons: [
    { snapshots: base.snapshots, comparison: base.comparison },
    { snapshots: base.snapshots, comparison: { ...base.comparison, metrics: base.comparison.metrics.map(m => ({ ...m, previous: 999 })) } },
  ] } };
  expect(censusTimeline(value,"source_loc").points[0].value).toBeNull();
  expect(censusTimeline(value,"source_loc").points[0].conflicting).toBe(true);
});
