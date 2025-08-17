(function(){
  // Minimal, deterministic hexgrid with adjacency-gated movement. Zero deps.
  const COLS = 11;            // width in axial q
  const ROWS = 9;             // height in axial r
  const SIZE = 34;            // radius in px
  const SQRT3 = Math.sqrt(3);

  const svg = document.getElementById('map');
  const logList = document.getElementById('logList');
  const hpText = document.getElementById('hp');
  const healthBar = document.getElementById('healthBar');

  const tiles = new Map();  // key: `q,r` => tile { q, r, x, y, el }

  // Player state
  const state = {
    hp: 10,
    here: { q: Math.floor(COLS/2), r: Math.floor(ROWS/2) }, // start near center
    turn: 0,
  };

  function axialToPixel(q, r){
    // pointy-top
    const x = SIZE * SQRT3 * (q + r/2);
    const y = SIZE * (3/2) * r;
    return { x, y };
  }

  function hexCorner(cx, cy, i){
    const angle = Math.PI / 180 * (60 * i - 30);
    return [
      Math.round((cx + SIZE * Math.cos(angle)) * 100) / 100,
      Math.round((cy + SIZE * Math.sin(angle)) * 100) / 100
    ];
  }

  function polygonPoints(cx, cy){
    const pts = [];
    for(let i=0;i<6;i++){
      const [x,y] = hexCorner(cx, cy, i);
      pts.push(x+","+y);
    }
    return pts.join(' ');
  }

  function key(q,r){ return `${q},${r}`; }

  function neighbors(q, r){
    return [ [1,0], [1,-1], [0,-1], [-1,0], [-1,1], [0,1] ].map(([dq,dr])=>({q:q+dq, r:r+dr}));
  }

  function isOnBoard(q, r){
    return q>=0 && q<COLS && r>=0 && r<ROWS;
  }

  function isNeighbor(a, b){
    return neighbors(a.q, a.r).some(n => n.q===b.q && n.r===b.r);
  }

  function placePlayer(){
    const id = 'player';
    let g = document.getElementById(id);
    const {x, y} = axialToPixel(state.here.q, state.here.r);
    if(!g){
      g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('id', id);
      // soft ritual ring + ember core
      const ring = document.createElementNS('http://www.w3.org/2000/svg','circle');
      ring.setAttribute('class','ring');
      ring.setAttribute('r', String(SIZE * 0.45));
      ring.setAttribute('cx','0'); ring.setAttribute('cy','0');
      const core = document.createElementNS('http://www.w3.org/2000/svg','circle');
      core.setAttribute('class','core');
      core.setAttribute('r', String(SIZE * 0.18));
      core.setAttribute('cx','0'); core.setAttribute('cy','0');
      g.appendChild(ring); g.appendChild(core);
      svg.appendChild(g);
    }
    g.setAttribute('transform', `translate(${x},${y})`);
  }

  function updateHUD(){
    hpText.textContent = String(state.hp);
    healthBar.style.width = (state.hp*10) + '%';
  }

  function log(msg){
    const li = document.createElement('li');
    li.textContent = msg;
    logList.appendChild(li);
    const logPanel = document.getElementById('log');
    logPanel.scrollTop = logPanel.scrollHeight;
  }

  function selectHere(){
    tiles.forEach(t => t.el.classList.remove('here'));
    const t = tiles.get(key(state.here.q, state.here.r));
    if(t) t.el.classList.add('here');
  }

  function markAdjacents(){
    tiles.forEach(t => t.el.classList.remove('adjacent'));
    neighbors(state.here.q, state.here.r)
      .filter(n => isOnBoard(n.q, n.r))
      .forEach(n => {
        const t = tiles.get(key(n.q, n.r));
        if(t) t.el.classList.add('adjacent');
      });
  }

  function tryMove(to){
    if(!isOnBoard(to.q, to.r)) return;
    if(to.q === state.here.q && to.r === state.here.r) return; // same tile
    if(!isNeighbor(state.here, to)){
      log('The thicket bars your way — too far to stride in one breath.');
      return;
    }
    state.here = { q: to.q, r: to.r };
    state.turn++;
    placePlayer();
    selectHere();
    markAdjacents();
    log(`Step ${state.turn}: You move to (${to.q}, ${to.r}). The pines whisper.`);
  }

  function buildBoard(){
    // compute extents to set viewBox nicely
    const corners = [];
    for(let r=0;r<ROWS;r++){
      for(let q=0;q<COLS;q++){
        const {x, y} = axialToPixel(q, r);
        corners.push([x - SIZE, y - SIZE]);
        corners.push([x + SIZE, y + SIZE]);
      }
    }
    const xs = corners.map(c=>c[0]);
    const ys = corners.map(c=>c[1]);
    const minX = Math.min(...xs) - 16; // margin
    const minY = Math.min(...ys) - 16;
    const maxX = Math.max(...xs) + 16;
    const maxY = Math.max(...ys) + 16;
    svg.setAttribute('viewBox', `${minX} ${minY} ${maxX - minX} ${maxY - minY}`);

    // draw tiles
    for(let r=0;r<ROWS;r++){
      for(let q=0;q<COLS;q++){
        const {x, y} = axialToPixel(q, r);
        const poly = document.createElementNS('http://www.w3.org/2000/svg','polygon');
        poly.setAttribute('class','hex');
        poly.setAttribute('points', polygonPoints(x, y));
        poly.dataset.q = String(q);
        poly.dataset.r = String(r);
        poly.addEventListener('click', ()=>{
          tryMove({ q, r });
        });
        svg.appendChild(poly);
        tiles.set(key(q,r), { q, r, x, y, el: poly });
      }
    }
  }

  function init(){
    buildBoard();
    placePlayer();
    selectHere();
    markAdjacents();
    updateHUD();
    log('You wake beneath sullen boughs. Barovia watches.');
    log('Click a highlighted hex to move.');
  }

  // kick off
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();