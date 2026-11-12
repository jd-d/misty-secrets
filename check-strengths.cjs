const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');const ctx={window:{},structuredClone};vm.createContext(ctx);vm.runInContext(fs.readFileSync('dist/data.js','utf8')+'\n'+fs.readFileSync('dist/strength-engine.js','utf8'),ctx);const S=vm.runInContext('StrengthEngine',ctx),I=ctx.window.SEED.ingredients;
function valid(plan,t){const used=plan.reduce((a,p)=>a+p.pct/100,0),nic=plan.reduce((a,p)=>a+p.pct/100*S.effective(p,I).nic,0);const booster=(t-nic-(1-used)*6)/14;return used<=1+1e-8&&booster>=-1e-8&&1-used-booster>=-1e-8}
let n=0;for(const recipe of ctx.window.SEED.recipes)for(const target of [6,6.5,7,7.5,8])for(const scope of ['mine','all']){const variants={};for(const p of recipe.parts)if(['Ready e-liquid','Nicotine salt e-liquid'].includes(I[p.id].type))variants[p.id]=[{key:'nine',nic:9,density:I[p.id].density,owned:false},{key:'twelve',nic:12,density:I[p.id].density,owned:true}];const parts=structuredClone(recipe.parts);parts[0].locked=true;const r=S.solve({parts,ingredients:I,variants,scope,target,ceilings:{}});if(r.valid){assert(valid(r.parts,target));assert.equal(r.parts[0].pct,parts[0].pct);if(scope==='mine')assert.equal(r.hypotheticals,0);r.parts.forEach((p,i)=>assert(p.pct<=parts[i].pct+1e-7));}n++;}
// Full-volume example: 80% banana plus 20% zero-nic liquid. 7.5 mg/ml banana retains all flavour at a 6 mg/ml target.
const parts=[{id:15,pct:80,role:'banana'},{id:2,pct:20,role:'fruit'}],variants={15:[{key:'alternative',nic:7.5,density:I[15].density,owned:false}]};const mine=S.solve({parts,ingredients:I,variants,scope:'mine',target:6,ceilings:{}}),all=S.solve({parts,ingredients:I,variants,scope:'all',target:6,ceilings:{}});assert(all.valid&&mine.valid);assert(Math.abs(all.retention-100)<1e-7);assert(mine.retention<100);assert.equal(all.parts[0].strength,7.5);assert(all.parts[0].hypothetical);const restored=S.solve({parts:mine.parts,ingredients:I,variants,scope:'all',target:6,ceilings:{}});assert(Math.abs(restored.retention-100)<1e-7);assert(valid(all.parts,6));
variants[15][0].owned=true;assert.equal(S.solve({parts,ingredients:I,variants,scope:'mine',target:6,ceilings:{}}).retention,100);
variants[15]=[{key:'default',nic:6,density:I[15].density,owned:false}];assert.equal(S.solve({parts,ingredients:I,variants,scope:'mine',target:6,ceilings:{}}).valid,false);
const locked=[{id:15,pct:90,locked:true,role:'banana'},{id:2,pct:20,locked:true,role:'fruit'}];assert.equal(S.solve({parts:locked,ingredients:I,variants:{},scope:'mine',target:6,ceilings:{}}).valid,false);
console.log(n+' strength/scope scenarios plus exact-target, hypothetical, owned-only and impossible-lock cases passed.');

// Inventory metadata alone must not create an actionable recipe proposal.
const baseline=[{id:16,pct:50},{id:7,pct:15}];
const metadataOnly=baseline.map(p=>({...p,strength:I[p.id].nic,variantDensity:I[p.id].density,hypothetical:true}));
assert.equal(S.changes(baseline,metadataOnly,I).length,0);
assert.equal(S.changes(metadataOnly,baseline,I).length,0);
assert.equal(S.changes(baseline,[{...metadataOnly[0],strength:12},metadataOnly[1]],I).length,1);
assert.equal(S.changes(baseline,[{...metadataOnly[0],pct:49},metadataOnly[1]],I).length,1);
assert.equal(S.changes(baseline,[{...metadataOnly[0],variantDensity:1.2},metadataOnly[1]],I).length,1);
console.log('No-op inventory, real strength, amount and density regression checks passed.');
