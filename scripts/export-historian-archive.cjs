/* eslint-disable @typescript-eslint/no-require-imports */
// Reproducible presentation projection of committed Historian artifacts. No model calls.
const {execFileSync}=require('node:child_process');
const {createHash}=require('node:crypto');
const fs=require('node:fs');const path=require('node:path');
const HISTORY_PROJECTION_TYPES=new Set(['evolution_timeline','delta_origin_story']);
const SAFE_EVIDENCE_KINDS=new Set(['git_artifact','git_commit','historian_milestone','historian_projection','historian_update','repo_doc','other']);
function validateComparison(c){
 if(c.artifact_type!=='structural_census_progress_baseline'||!c.read_only_boundary?.no_metric_methodology_change||!Array.isArray(c.side_by_side_metrics)||!c.side_by_side_metrics.length)throw Error('invalid_comparison');
 const ids=new Set();
 for(const m of c.side_by_side_metrics){
  if(typeof m.metric_id!=='string'||ids.has(m.metric_id))throw Error('duplicate_metric');
  ids.add(m.metric_id);
  for(const k of ['previous','current','absolute_change','percentage_change'])if(m[k]!==null&&(typeof m[k]!=='number'||!Number.isFinite(m[k])))throw Error('invalid_metric');
  const delta=m.current===null||m.previous===null?null:m.current-m.previous;
  if(delta===null?m.absolute_change!==null:Math.abs(delta-m.absolute_change)>1e-6)throw Error('invalid_delta');
 }
 return c;
}
function safeEvidence(e){
 if(!e||typeof e!=='object')return null;
 const kind=typeof e.kind==='string'?e.kind:'other',ref=typeof e.ref==='string'?e.ref:'';
 if(!SAFE_EVIDENCE_KINDS.has(kind)||!ref||path.isAbsolute(ref)||ref.includes('..')||ref.includes('/Users/')||/\.delta|memory\.db|Bearer /i.test(ref))return null;
 if(kind==='git_artifact'&&!/^delta-(agent|backend|site|mobile|jobs):[a-f0-9]{40}:[a-zA-Z0-9_./-]+$/.test(ref))return null;
 if(kind==='git_commit'&&!/^delta-(agent|backend|site|mobile|jobs):[a-f0-9]{7,40}$/.test(ref))return null;
 if(!kind.startsWith('git_')&&!/^[a-zA-Z0-9_./:-]+$/.test(ref))return null;
 return {kind,ref,summary:e.summary||'',confidence:e.confidence||'unknown',classification:e.claim_classification||'unknown'};
}
function periodFor(items){
 const dates=items.map(m=>Date.parse(m.date)).filter(Number.isFinite).sort((a,b)=>a-b);
 if(!dates.length)return 'Recorded history';
 const fmt=ms=>new Date(ms).toLocaleDateString('en-US',{month:'short',year:'numeric',timeZone:'America/New_York'});
 const first=fmt(dates[0]),last=fmt(dates.at(-1)||dates[0]);
 return first===last?first:`${first} - ${last}`;
}
function buildHistoryFeed(t,milestones){
 const byTrack=track=>milestones.filter(m=>m.tracks.includes(track)).map(m=>m.id),productIds=byTrack('product_intelligence'),engineeringIds=byTrack('engineering_agentic'),convergedIds=byTrack('converged_platform'),origin=milestones.find(m=>m.id===productIds[0])||milestones[0]||null;
 const earlyProductIds=productIds.slice(1).filter(id=>!/behavioral-os|intelligence-os|shared-substrate/.test(id)),substrateIds=productIds.filter(id=>/behavioral-os|intelligence-os|shared-substrate/.test(id)),specialistIds=[...new Set(convergedIds)],agentIds=engineeringIds.filter(id=>!specialistIds.includes(id)),chapterItems=ids=>milestones.filter(m=>ids.includes(m.id));
 const specs=[
  {id:'origin',name:'Origin',zone:'Surface',ids:origin?[origin.id]:[],headline:origin?`${origin.title}.`:'An idea becomes a system.',copy:origin?.description||'The earliest available Historian projection supplies Delta origin baseline.'},
  {id:'memory-and-health',name:'Memory and health intelligence',zone:'Sunlight',ids:earlyProductIds,headline:'The score becomes continuity.',copy:'The product lineage moved from isolated measurement toward memory, conversation, inference, and health-intelligence loops.'},
  {id:'operating-substrate',name:'Operating substrate',zone:'Twilight',ids:substrateIds,headline:'The product becomes an operating system.',copy:'Delta generalized from one domain into Behavioral OS and Intelligence OS framing, with substrate proof replacing implied transferability.'},
  {id:'agentic-engineering',name:'Agentic engineering',zone:'Midnight',ids:agentIds,headline:'The engineering system gets its own runtime.',copy:'The engineering lineage added supervisor, shared runtime, Mission Control, and bounded Historian dependency records.'},
  {id:'governed-specialists',name:'Governed specialists',zone:'Abyss',ids:specialistIds,headline:'Specialists join the current.',copy:'Qualified specialist milestones show the shared runtime expanding into distinct advisory roles without granting autonomous execution authority.'}
 ].filter(c=>c.ids.length);
 return {schemaVersion:1,feedType:'delta_history_feed_v1',sourceProjectionType:t.projection_type,generatedAt:t.generated_at||'',story:{headline:t.story_summary?.one_sentence||'Delta through time.',summary:t.story_summary?.personal_continuity_relevance||'Historian supplies milestone projections for the website to render without changing historical truth.',coreShift:t.story_summary?.core_shift||'Delta evolved through product, memory, substrate, and governed-agent phases.',truthBoundary:'Historian remains temporal truth. The website renders a read-only presentation feed and does not mutate canon.'},origin:origin?{milestoneId:origin.id,date:origin.date,title:origin.title,summary:origin.description,currentTruthGuard:'Origin evidence is historical context, not current canonical product identity.'}:null,chapters:specs.map(c=>({id:c.id,name:c.name,zone:c.zone,period:periodFor(chapterItems(c.ids)),headline:c.headline,copy:c.copy,milestoneIds:c.ids})),outputModules:[{id:'origin_hero',label:'Origin story hero',consumes:['historyFeed.origin','historyFeed.story']},{id:'ocean_timeline',label:'Interactive evolution timeline',consumes:['historyFeed.chapters','milestones']},{id:'census_growth',label:'Measured structural growth',consumes:['comparison','snapshots']},{id:'evidence_drawers',label:'Bounded evidence drawers',consumes:['milestones.evidence','provenance']}]};
}
function projectArchive(root,options={}){
 const git=args=>execFileSync('git',['-C',root,...args],{encoding:'utf8',timeout:10000,maxBuffer:2000000,stdio:['ignore','pipe','ignore']});
 const commit=git(['rev-parse',options.ref||'refs/heads/main']).trim();
 const provenance=[];
 const raw=file=>git(['show',`${commit}:${file}`]);
 const parse=file=>JSON.parse(raw(file));
 const read=file=>{const text=raw(file);provenance.push({path:file,sha256:createHash('sha256').update(text).digest('hex')});return JSON.parse(text);};
 const list=dir=>git(['ls-tree','-r','--name-only',commit,dir]).split(/\r?\n/).filter(file=>file.endsWith('.json'));
 const latest=(files,reader,clock)=>files.map(file=>{try{return {file,value:reader(file)}}catch{return null}}).filter(Boolean).sort((a,b)=>clock(a.value)-clock(b.value)).at(-1);
 const comparisonFiles=list('agent/measurements/organizational-observability/comparisons');
 const comparisonEntry=latest(
  options.comparisonPath?[options.comparisonPath]:comparisonFiles,
  file=>{const v=parse(file);if(v.artifact_type!=='structural_census_progress_baseline'||v.read_only_boundary?.no_metric_methodology_change!==true)throw Error('invalid_comparison');return v;},
  value=>Date.parse(value.current_checkpoint?.captured_at||value.recorded_at||'')||0
 );
 const timelineEntry=latest(
  list('agent/historian/projections'),
  file=>{const v=parse(file);if(!HISTORY_PROJECTION_TYPES.has(v.projection_type)||!Array.isArray(v.entries))throw Error('invalid_projection');return v;},
  value=>Date.parse(value.timeline_window?.to||value.generated_at||'')||0
 );
 if(!comparisonEntry||!timelineEntry)throw Error('missing_historian_projection');
 const comparison=comparisonEntry.file,timeline=timelineEntry.file;
 const c=validateComparison(read(comparison)),t=read(timeline);
 if(c.artifact_type!=='structural_census_progress_baseline'||!HISTORY_PROJECTION_TYPES.has(t.projection_type)||!Array.isArray(t.entries)||!c.read_only_boundary?.no_metric_methodology_change)throw Error('invalid_historian_artifact');
 const snapshots=[c.snapshot_refs.prior_snapshot_ref,c.snapshot_refs.current_snapshot_ref].map(file=>{if(!/^agent\/measurements\/organizational-observability\/census\/snapshots\/\d{4}-\d{2}-\d{2}\/orgcensus-[a-f0-9-]+\.json$/.test(file))throw Error('invalid_census_ref');const s=read(file);return {id:s.census_id,date:s.captured_at,methodology:s.methodology_version,quality:s.data_quality.state,missingQualification:s.organizational_scale.qualified_intelligent_agents.value===null};});
 const milestones=t.entries.map(m=>{const refs=Array.isArray(m.evidence_references)?m.evidence_references:[],evidence=refs.map(safeEvidence).filter(Boolean);return {id:m.milestone_id,date:m.date,title:m.milestone,significance:m.significance,tracks:m.lineage_tracks||[],description:m.concise_description,gained:m.major_capability_gained,confidence:m.evidence_confidence,evidence,omittedEvidence:refs.length-evidence.length};});
 const archive={version:1,sourceMode:'bundled_archive',freshness:{state:'fallback',generatedAt:c.recorded_at,latestAcceptedSourceTime:snapshots.at(-1)?.date??null},sourceCommit:commit,archiveThrough:t.timeline_window.to,provenance,snapshots,milestones,historyFeed:buildHistoryFeed(t,milestones),comparison:{id:c.artifact_id,recordedAt:c.recorded_at,methodology:c.methodology_version,metrics:c.side_by_side_metrics,repositories:c.repo_breakdown,interpretation:c.growth_interpretation,limitations:c.known_limitations}};
 if(options.includeHistory!==false){
  const entries=comparisonFiles.map(file=>projectArchive(root,{ref:commit,comparisonPath:file,includeHistory:false})).sort((a,b)=>Date.parse(a.comparison.recordedAt)-Date.parse(b.comparison.recordedAt));
  const checkpoints=list('agent/measurements/organizational-observability/census/snapshots').map(file=>{
   const s=read(file);
   if(s.snapshot_type!=='structural_census'||typeof s.census_id!=='string'||!Number.isFinite(Date.parse(s.captured_at)))throw Error('invalid_census');
   const measurement=v=>typeof v==='number'&&Number.isFinite(v)&&v>=0?v:null;
   const scope=(s.provenance?.included_sources||[]).filter(x=>x.counted_for_implementation===true).map(x=>`${x.repository}:${x.source_role}`).sort().join('|');
   return {id:s.census_id,date:s.captured_at,methodology:s.methodology_version,quality:s.data_quality?.state||'unknown',missingQualification:s.organizational_scale?.qualified_intelligent_agents?.value==null,scope,
    values:{source_loc:measurement(s.physical_scale?.unique_source_loc),test_loc:measurement(s.physical_scale?.test_loc),source_files:measurement(s.physical_scale?.source_files),unique_tests:measurement(s.verification_scale?.unique_tests)},evidence:{path:file,sha256:createHash('sha256').update(raw(file)).digest('hex')}};
  }).sort((a,b)=>Date.parse(a.date)-Date.parse(b.date));
  if(new Set(checkpoints.map(s=>s.id)).size!==checkpoints.length)throw Error('duplicate_census_id');
  archive.growthArchive={version:1,comparisons:entries.map(e=>({comparison:e.comparison,snapshots:e.snapshots})),checkpoints};
  archive.freshness.latestAcceptedSourceTime=checkpoints.at(-1)?.date??null;
  archive.provenance=[...new Map([...provenance,...entries.flatMap(e=>e.provenance)].map(p=>[p.path,p])).values()];
 }
 return archive;
}
module.exports={projectArchive,validateComparison};
if(require.main===module){const root=process.argv[2];if(!root||!path.isAbsolute(root))throw Error('absolute_agent_root_required');const data=projectArchive(root);fs.writeFileSync(path.join(__dirname,'../src/lib/historianArchive.json'),JSON.stringify(data,null,2)+'\n');console.log(JSON.stringify({censuses:data.snapshots.length,milestones:data.milestones.length,sourceCommit:data.sourceCommit}));}
