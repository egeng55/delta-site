/* eslint-disable @typescript-eslint/no-require-imports */
// Reproducible presentation projection of committed Historian artifacts. No model calls.
const {execFileSync}=require('node:child_process');
const {createHash}=require('node:crypto');
const fs=require('node:fs');const path=require('node:path');
function projectArchive(root){
 const git=args=>execFileSync('git',['-C',root,...args],{encoding:'utf8',timeout:10000,maxBuffer:2000000,stdio:['ignore','pipe','ignore']});
 const commit=git(['rev-parse','refs/heads/main']).trim();
 const comparison='agent/measurements/organizational-observability/comparisons/2026-08-12/canonical-numerical-progress-2026-08-07-to-2026-08-12.json';
 const timeline='agent/historian/projections/evolution-timeline-2026-08-08-origin-backfill.json';
 const provenance=[];
 const read=file=>{const raw=git(['show',`${commit}:${file}`]);provenance.push({path:file,sha256:createHash('sha256').update(raw).digest('hex')});return JSON.parse(raw);};
 const c=read(comparison),t=read(timeline);
 if(c.artifact_type!=='structural_census_progress_baseline'||t.projection_type!=='evolution_timeline'||!c.read_only_boundary?.no_metric_methodology_change)throw Error('invalid_historian_artifact');
 const snapshots=[c.snapshot_refs.prior_snapshot_ref,c.snapshot_refs.current_snapshot_ref].map(file=>{if(!/^agent\/measurements\/organizational-observability\/census\/snapshots\/\d{4}-\d{2}-\d{2}\/orgcensus-[a-f0-9-]+\.json$/.test(file))throw Error('invalid_census_ref');const s=read(file);return {id:s.census_id,date:s.captured_at,methodology:s.methodology_version,quality:s.data_quality.state,missingQualification:s.organizational_scale.qualified_intelligent_agents.value===null};});
 const milestones=t.entries.map(m=>({id:m.milestone_id,date:m.date,title:m.milestone,significance:m.significance,tracks:m.lineage_tracks,description:m.concise_description,gained:m.major_capability_gained,confidence:m.evidence_confidence,evidence:m.evidence_references.filter(e=>e.kind==='git_artifact'&&/^delta-(agent|backend|site|mobile|jobs):[a-f0-9]{40}:[a-zA-Z0-9_./-]+$/.test(e.ref)).map(e=>({ref:e.ref,summary:e.summary,confidence:e.confidence,classification:e.claim_classification})),omittedEvidence:m.evidence_references.filter(e=>e.kind!=='git_artifact').length}));
 return {version:1,sourceCommit:commit,archiveThrough:t.timeline_window.to,provenance,snapshots,milestones,comparison:{id:c.artifact_id,recordedAt:c.recorded_at,methodology:c.methodology_version,metrics:c.side_by_side_metrics,repositories:c.repo_breakdown,interpretation:c.growth_interpretation,limitations:c.known_limitations}};
}
module.exports={projectArchive};
if(require.main===module){const root=process.argv[2];if(!root||!path.isAbsolute(root))throw Error('absolute_agent_root_required');const data=projectArchive(root);fs.writeFileSync(path.join(__dirname,'../src/lib/historianArchive.json'),JSON.stringify(data,null,2)+'\n');console.log(JSON.stringify({censuses:data.snapshots.length,milestones:data.milestones.length,sourceCommit:data.sourceCommit}));}
