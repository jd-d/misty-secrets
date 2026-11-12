const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const ctx={window:{},structuredClone,toast:()=>{}};vm.createContext(ctx);vm.runInContext(fs.readFileSync('dist/strength-engine.js','utf8'),ctx);vm.runInContext('let strengthMode=false;',ctx);
vm.runInContext(fs.readFileSync('dist/data.js','utf8'),ctx);
vm.runInContext('const SEED=window.SEED;const ingredients=SEED.ingredients;let parts=[],target=6,volume=10,edited=false;',ctx);
const src=fs.readFileSync('dist/app.js','utf8');
vm.runInContext(src.slice(src.indexOf('function calculate('),src.indexOf('function choose(')),ctx);
vm.runInContext(src.slice(src.indexOf('function balanceInputs('),src.indexOf('function applyAutomaticBalance(')),ctx);
let checks=0;
for(let recipe=0;recipe<11;recipe++)for(const target of [6,6.5,7,7.5,8])for(const volume of [10,20,30,50,100]){
 vm.runInContext(`parts=structuredClone(SEED.recipes[${recipe}].parts);target=${target};volume=${volume};fit();`,ctx);
 const r=vm.runInContext('calculate()',ctx);assert.ok(r.valid,`recipe ${recipe}, ${target}, ${volume}`);
 assert.ok(Math.abs(r.rows.reduce((a,b)=>a+b.ml,0)-volume)<1e-6);
 assert.ok(Math.abs(r.actual-target)<1e-6);assert.ok(r.rows.every(r=>r.g>=0));checks++;
}
const r=vm.runInContext('parts=structuredClone(SEED.recipes.find(r=>r.name==="Deep Cassis Astaire").parts);target=6;volume=10;calculate()',ctx);
assert.ok(Math.abs(r.booster-.3142857142857143)<1e-10);
assert.ok(Math.abs(r.totalG-11.306)<.001);
assert.equal(vm.runInContext('calculate([{id:2,pct:75,role:"test"}],6,10).valid',ctx),false);
assert.equal(vm.runInContext('calculate([],8,10).actual',ctx),8);
console.log(`${checks} recipe/strength/batch combinations verified; reference weights and infeasible mix checks passed.`);
