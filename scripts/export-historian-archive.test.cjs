const test=require('node:test');
const assert=require('node:assert/strict');
const {validateComparison}=require('./export-historian-archive.cjs');
const archive=require('../src/lib/historianArchive.json');
test('catalogue retains checkpoints and historical comparison endpoints',()=>{
 assert.equal(archive.growthArchive.checkpoints.length,3);
 assert.equal(archive.growthArchive.comparisons.length,2);
 assert.equal(archive.growthArchive.comparisons[0].comparison.metrics.find(m=>m.metric_id==='source_loc').current,186730);
 assert.equal(archive.comparison.metrics.find(m=>m.metric_id==='source_loc').current,329707);
});
test('export rejects malformed numeric records instead of dropping them',()=>{
 const c={artifact_type:'structural_census_progress_baseline',read_only_boundary:{no_metric_methodology_change:true},side_by_side_metrics:[{metric_id:'loc',previous:1,current:3,absolute_change:2,percentage_change:200}]};
 validateComparison(c);
 assert.throws(()=>validateComparison({...c,side_by_side_metrics:[{...c.side_by_side_metrics[0],current:'invented'}]}));
 assert.throws(()=>validateComparison({...c,side_by_side_metrics:[{...c.side_by_side_metrics[0],absolute_change:20}]}));
 assert.throws(()=>validateComparison({...c,side_by_side_metrics:[...c.side_by_side_metrics,...c.side_by_side_metrics]}));
});
