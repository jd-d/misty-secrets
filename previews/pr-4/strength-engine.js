'use strict';
// Pure one-variant-per-ingredient optimiser. No retailer queries or inventory transmission.
const StrengthEngine={
 changes(current,proposed,ingredients){return proposed.filter((p,n)=>{const before=this.effective(current[n],ingredients),after=this.effective(p,ingredients);return Math.abs(p.pct-current[n].pct)>.001||Math.abs(after.nic-before.nic)>.001||Math.abs(after.density-before.density)>.0001;});},
 effective(p,ingredients){const i=ingredients[p.id];if(!Number.isFinite(p.strength))return i;return {...i,nic:p.strength,density:Number.isFinite(p.variantDensity)?p.variantDensity:i.density,name:i.name.replace(/\s+\d+(?:\.\d+)?\s*mg(?:\/ml)?/i,'')+' · '+p.strength+' mg/ml'+(p.hypothetical?' · hypothetical':'')};},
 solve({parts,ingredients,variants,scope,target,ceilings}){
  const effective=p=>this.effective(p,ingredients),desired=parts.map(p=>({...p,desiredPct:p.desiredPct??p.pct,pct:p.locked?p.pct:Math.min(p.desiredPct??p.pct,ceilings[p.id]??ingredients[p.id].max)}));
  const options=desired.map(p=>{const i=ingredients[p.id],base={nic:i.nic,density:i.density,owned:true,key:'default'};if(!['Ready e-liquid','Nicotine salt e-liquid'].includes(i.type))return [base];const entered=(variants[p.id]||[]);const defaultConfig=entered.find(v=>v.key==='default');base.owned=defaultConfig?defaultConfig.owned:true;const list=[base,...entered.filter(v=>v.key!=='default')].filter(v=>scope==='all'||v.owned);return list;});
  if(options.some(x=>!x.length))return {valid:false,reason:'At least one ingredient has no variant marked Mine. Mark an owned variant or use All entered strengths.'};
  // Bound search for predictable UI latency. Six options across six flavours remains exhaustive.
  let states=[[]];let searchedAll=true;for(const opts of options){const next=[];for(const state of states)for(const opt of opts)next.push([...state,opt]);if(next.length>60000){searchedAll=false;next.sort((a,b)=>a.reduce((n,v)=>n+(!v.owned?100:0)+(v.key!=='default'?1:0),0)-b.reduce((n,v)=>n+(!v.owned?100:0)+(v.key!=='default'?1:0),0));next.length=60000;}states=next;}
  const currentNic=parts.map(p=>effective(p).nic);let best=null;
  for(const choices of states){let lockedV=0,lockedNic=0,freeV=0,freeNic=0;desired.forEach((p,n)=>{const amt=p.pct/100;if(p.locked){lockedV+=amt;lockedNic+=amt*choices[n].nic}else{freeV+=amt;freeNic+=amt*choices[n].nic}});
   let lo=0,hi=1;let feasible=true;const constrain=(a,b)=>{if(Math.abs(a)<1e-12){if(b<-1e-8)feasible=false}else if(a>0)hi=Math.min(hi,b/a);else lo=Math.max(lo,b/a)};
   constrain(freeV,1-lockedV);constrain(freeNic-6*freeV,target-6-lockedNic+6*lockedV);constrain(20*freeV-freeNic,20-20*lockedV-target+lockedNic);
   if(!feasible||hi<lo-1e-9||hi<0||lo>1)continue;const scale=Math.max(0,Math.min(1,hi));const out=desired.map((p,n)=>({...p,pct:p.locked?p.pct:p.pct*scale,strength:choices[n].nic,variantDensity:choices[n].density,hypothetical:!choices[n].owned}));
   const retention=out.reduce((a,p)=>a+p.pct,0),switches=choices.reduce((a,v,n)=>a+(Math.abs(v.nic-currentNic[n])>.0001?1:0),0),hypotheticals=choices.filter(v=>!v.owned).length;const score=[retention,-hypotheticals,-switches,-choices.reduce((a,v,n)=>a+Math.abs(v.nic-currentNic[n]),0)];
   if(!best||score.some((v,n)=>score.slice(0,n).every((x,k)=>Math.abs(x-best.score[k])<1e-7)&&v>best.score[n]+1e-7))best={valid:true,parts:out,retention,score,scale,switches,hypotheticals,searchedAll};
  }
  return best||{valid:false,reason:'No entered variant combination can satisfy the locked amounts and nicotine target.'};
 }
};
