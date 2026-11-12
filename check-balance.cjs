const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');const ctx={window:{},structuredClone};vm.createContext(ctx);vm.runInContext(fs.readFileSync('dist/strength-engine.js','utf8'),ctx);vm.runInContext('let strengthMode=false;',ctx);vm.runInContext(fs.readFileSync('dist/data.js','utf8'),ctx);vm.runInContext('const SEED=window.SEED,ingredients=SEED.ingredients;let selected,parts,target=6,volume=10,edited=false;const saved={};',ctx);const src=fs.readFileSync('dist/app.js','utf8');vm.runInContext(src.slice(src.indexOf('function calculate('),src.indexOf('function choose(')),ctx);vm.runInContext(src.slice(src.indexOf('const balancePrefs='),src.indexOf('function renderBalance(')),ctx);
let n=0;for(let r=0;r<11;r++)for(const t of [6,7,8])for(const strength of [0,1,2]){
 vm.runInContext(`selected=SEED.recipes[${r}];parts=structuredClone(selected.parts);target=${t};fit();balancePrefs.strength=${strength};parts[0].pct*=.3;parts[0].locked=true;`,ctx);
 const before=vm.runInContext('structuredClone(parts)',ctx), result=vm.runInContext('proposeBalance()',ctx);assert(!result.invalid);assert.equal(result.parts[0].pct,before[0].pct);assert(vm.runInContext('calculate(proposeBalance().parts).valid',ctx));assert(result.filled<=result.gap+1e-6);for(const p of result.parts){const old=before.find(q=>q.id===p.id);assert(p.pct>=old.pct);if(ctx.window.SEED.ingredients[p.id].soft||ctx.window.SEED.ingredients[p.id].type==='Additive')assert.equal(p.pct,old.pct);}n++;
}
vm.runInContext('selected=SEED.recipes.find(r=>r.name==="Deep Cassis Astaire");parts=structuredClone(selected.parts);target=6;parts[0].pct=15;parts[0].locked=true;',ctx);const example=vm.runInContext('proposeBalance()',ctx);assert(example.filled>0);console.log(n+' balancing scenarios passed. Cassis example:',JSON.stringify(example.changes));

// Automatic mode updates the actual recipe and recomputes from manual inputs.
vm.runInContext('balancePrefs.mode="flavour";balancePrefs.strength=1;applyAutomaticBalance()',ctx);
const auto=vm.runInContext('structuredClone(parts)',ctx);
assert.equal(auto[0].pct,15);
assert(auto.find(p=>p.id===7).pct>15);
assert(vm.runInContext('calculate().valid',ctx));
vm.runInContext('applyAutomaticBalance()',ctx);
assert.deepEqual(vm.runInContext('structuredClone(parts)',ctx),auto,'repeated rendering must not compound boosts');
vm.runInContext('balancePrefs.strength=0;applyAutomaticBalance();balancePrefs.strength=1;applyAutomaticBalance()',ctx);
assert.deepEqual(vm.runInContext('structuredClone(parts)',ctx),auto,'strength changes must recompute from manual amounts');
vm.runInContext('parts=balanceInputs(parts);parts[0].pct=50;applyAutomaticBalance()',ctx);
assert.equal(vm.runInContext('parts.find(p=>p.id===7).pct',ctx),15,'returning Cassis to original must release compensation');
vm.runInContext('parts[0].pct=15;applyAutomaticBalance();balancePrefs.mode="classic";applyAutomaticBalance()',ctx);
assert.equal(vm.runInContext('parts.find(p=>p.id===7).pct',ctx),15);
assert.equal(vm.runInContext('parts[0].pct',ctx),15);
assert(vm.runInContext('parts.every(p=>p.balanceBasePct===undefined)',ctx));
console.log('Automatic compensation, repeat renders, strength changes, slider reversal and classic-mode restoration passed.');
