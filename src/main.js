(function(){
  // Robust init: query DOM inside init to avoid null lookups.
  let svg, logList, hpText, healthBar;
  const COLS = 11, ROWS = 9, SIZE = 34, SQRT3 = Math.sqrt(3);
  const tiles = new Map();  // key: `q,r` => tile { q, r, x, y, el }

  const state = { hp: 10, here: { q: Math.floor(COLS/2), r: Math.floor(ROWS/2) }, turn: 0 };

  function axialToPixel(q, r){ const x = SIZE * SQRT3 * (q + r/2); const y = SIZE * (3/2) * r; return { x, y }; }
  function hexCorner(cx, cy, i){ const angle = Math.PI/180 * (60*i - 30); return [+(cx + SIZE*Math.cos(angle)).toFixed(2), +(cy + SIZE*Math.sin(angle)).toFixed(2)]; }
  function polygonPoints(cx, cy){ const pts=[]; for(let i=0;i<6;i++){ const [x,y]=hexCorner(cx,cy,i); pts.push(x+","+y);} return pts.join(' '); }
  function key(q,r){ return `${q},${r}`; }
  function neighbors(q, r){ return [[1,0],[1,-1],[0,-1],[-1,0],[-1,1],[0,1]].map(([dq,dr])=>({q:q+dq, r:r+dr})); }
  function isOnBoard(q,r){ return q>=0 && q<COLS && r>=0 && r<ROWS; }
  function isNeighbor(a,b){ return neighbors(a.q,a.r).some(n=>n.q===b.q && n.r===b.r); }

  function placePlayer(){
    const id='player'; let g=document.getElementById(id);
    const {x,y}=axialToPixel(state.here.q,state.here.r);
    if(!g){
      g=document.createElementNS('http://www.w3.org/2000/svg','g'); g.setAttribute('id',id);
      const ring=document.createElementNS('http://www.w3.org/2000/svg','circle'); ring.setAttribute('class','ring'); ring.setAttribute('r', String(SIZE*0.45)); ring.setAttribute('cx','0'); ring.setAttribute('cy','0');
      const core=document.createElementNS('http://www.w3.org/2000/svg','circle'); core.setAttribute('class','core'); core.setAttribute('r', String(SIZE*0.18)); core.setAttribute('cx','0'); core.setAttribute('cy','0');
      g.appendChild(ring); g.appendChild(core); svg.appendChild(g);
    }
    g.setAttribute('transform', `translate(${x},${y})`);
  }

  function updateHUD(){ hpText.textContent = String(state.hp); healthBar.style.width = (state.hp*10) + '%'; }
  function log(msg){ const li=document.createElement('li'); li.textContent=msg; logList.appendChild(li); const p=document.getElementById('log'); p.scrollTop=p.scrollHeight; }
  function selectHere(){ tiles.forEach(t=>t.el.classList.remove('here')); const t=tiles.get(key(state.here.q,state.here.r)); if(t) t.el.classList.add('here'); }
  function markAdjacents(){ tiles.forEach(t=>t.el.classList.remove('adjacent')); neighbors(state.here.q,state.here.r).filter(n=>isOnBoard(n.q,n.r)).forEach(n=>{ const t=tiles.get(key(n.q,n.r)); if(t) t.el.classList.add('adjacent'); }); }

  function tryMove(to){
    if(!isOnBoard(to.q,to.r)) return;
    if(to.q===state.here.q && to.r===state.here.r) return;
    if(!isNeighbor(state.here,to)){ log('The thicket bars your way — too far to stride in one breath.'); return; }
    state.here={q:to.q,r:to.r}; state.turn++; placePlayer(); selectHere(); markAdjacents();
    log(`Step ${state.turn}: You move to (${to.q}, ${to.r}). The pines whisper.`);
  }

  function buildBoard(){
    const corners=[];
    for(let r=0;r<ROWS;r++){ for(let q=0;q<COLS;q++){ const {x,y}=axialToPixel(q,r); corners.push([x-SIZE,y-SIZE]); corners.push([x+SIZE,y+SIZE]); } }
    const xs=corners.map(c=>c[0]), ys=corners.map(c=>c[1]);
    const minX=Math.min(...xs)-16, minY=Math.min(...ys)-16, maxX=Math.max(...xs)+16, maxY=Math.max(...ys)+16;
    svg.setAttribute('viewBox', `${minX} ${minY} ${maxX-minX} ${maxY-minY}`);
    for(let r=0;r<ROWS;r++){ for(let q=0;q<COLS;q++){ const {x,y}=axialToPixel(q,r); const poly=document.createElementNS('http://www.w3.org/2000/svg','polygon');
      poly.setAttribute('class','hex'); poly.setAttribute('points', polygonPoints(x,y)); poly.dataset.q=String(q); poly.dataset.r=String(r);
      poly.addEventListener('click', ()=>tryMove({q,r})); svg.appendChild(poly); tiles.set(key(q,r), {q,r,x,y,el:poly}); } }
  }

  function init(){
    // Query after DOM is ready
    svg = document.getElementById('map');
    logList = document.getElementById('logList');
    hpText = document.getElementById('hp');
    healthBar = document.getElementById('healthBar');

    if(!svg || !logList || !hpText || !healthBar){
      console.error('Init failed: missing DOM nodes', {svg, logList, hpText, healthBar});
      const warn=document.createElement('div'); warn.style.position='fixed'; warn.style.top='8px'; warn.style.right='8px'; warn.style.padding='8px 10px';
      warn.style.background='rgba(138,43,43,.2)'; warn.style.border='1px solid rgba(138,43,43,.4)'; warn.style.color='var(--ink)'; warn.style.borderRadius='8px';
      warn.textContent='Error: missing DOM nodes — check script path or element IDs.'; document.body.appendChild(warn); return;
    }

    buildBoard(); placePlayer(); selectHere(); markAdjacents(); updateHUD();
    log('You wake beneath sullen boughs. Barovia watches.'); log('Click a highlighted hex to move.');
  }

  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); } else { init(); }
})();