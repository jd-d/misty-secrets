'use strict';
/* Presentation-only enhancements. No recipe logic lives here. */
(()=>{
  const root=document.documentElement,main=document.getElementById('main'),header=document.querySelector('.site-header'),dock=document.getElementById('dock'),dockTotal=document.getElementById('dockTotal');

  // Filled range tracks: expose progress as a CSS variable.
  const paint=r=>{const min=+r.min||0,max=+r.max||100,v=+r.value;r.style.setProperty('--fill',((v-min)/((max-min)||1)*100).toFixed(2)+'%')};
  const paintAll=()=>document.querySelectorAll('input[type=range]').forEach(paint);
  document.addEventListener('input',e=>{if(e.target.matches?.('input[type=range]'))paint(e.target)});

  // Header gains a surface once the page scrolls.
  const onScroll=()=>header.classList.toggle('scrolled',scrollY>8);
  addEventListener('scroll',onScroll,{passive:true});onScroll();

  // Mobile result dock: shows the live total and jumps to the weighing card.
  let io;
  const syncDock=()=>{
    const panel=document.getElementById('weighing');
    if(!panel){dock.hidden=true;io?.disconnect();return}
    const total=panel.querySelector('.total strong');
    dockTotal.textContent=total?total.textContent.trim():'Needs rebalancing';
    dock.classList.toggle('warn',!total);
    dock.hidden=false;
    if(!io){io=new IntersectionObserver(entries=>entries.forEach(e=>{
      if(e.target.id==='weighing')dock.classList.toggle('away',e.isIntersecting);
      else dock.classList.toggle('near',e.isIntersecting);
    }),{threshold:0})}
    io.disconnect();io.observe(panel);
    const rows=document.getElementById('ingredientRows');if(rows)io.observe(rows);
  };
  dock.addEventListener('click',e=>{const p=document.getElementById('weighing');if(!p)return;e.preventDefault();p.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'})});

  // Re-run after every render the app performs.
  let queued=false;
  new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;paintAll();syncDock()})}).observe(main,{childList:true,subtree:true});
  paintAll();syncDock();

  // Moving between views starts at the top of the page.
  const enter=()=>{main.classList.remove('entering');void main.offsetWidth;main.classList.add('entering');clearTimeout(enter.t);enter.t=setTimeout(()=>main.classList.remove('entering'),600)};
  document.addEventListener('misty:view',()=>{scrollTo({top:0});main.focus({preventScroll:true});enter()});
  enter();

  // Theme colour follows the chosen light/dark mode.
  const meta=[...document.querySelectorAll('meta[name=theme-color]')];
  const syncMeta=()=>{const c=getComputedStyle(root).getPropertyValue('--bg').trim();meta.forEach(m=>{m.setAttribute('content',c);m.removeAttribute('media')})};
  new MutationObserver(syncMeta).observe(root,{attributes:true,attributeFilter:['data-theme','data-style']});syncMeta();
})();
