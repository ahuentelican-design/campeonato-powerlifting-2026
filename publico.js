'use strict';
const KEY='powerlifting-campeonato-2026-web-v2-pantalla-publica';
const CHANNEL='powerlifting-campeonato-2026-publico';
const get=id=>document.getElementById(id);
let lastVersion=0;
function format(x){return Number(x).toLocaleString('es-CL',{maximumFractionDigits:2})}
function drawBar(data){
 if(!data.platesOk)return '<span class="error">'+(data.plateError?'No se puede montar esta carga con el inventario.':'La barra aparecerá al seleccionar una carga.')+'</span>';
 const discs=[...(data.plates||[])].sort((a,b)=>Number(a.kg)-Number(b.kg)).map(p=>{
  const kg=Number(p.kg),color=/^#[\da-fA-F]{6}$/.test(p.color)?p.color:'#64748b';
  const rgb=parseInt(color.slice(1),16),brightness=.2126*(rgb>>16&255)+.7152*(rgb>>8&255)+.0722*(rgb&255);
  return {kg,color,text:brightness>160?'#17263c':'#ffffff',w:Math.round(24+kg/25*14),h:Math.round(58+kg/25*95)};
 });
 const gap=5,groupWidth=discs.reduce((n,p)=>n+p.w,0)+Math.max(0,discs.length-1)*gap;
 const vbW=Math.max(520,groupWidth+140),mid=115,collarX=vbW-42,discEnd=collarX-9;
 const start=discEnd-groupWidth,barStart=start-85,barEnd=collarX+24;
 let x=start,rect='';
 for(const p of discs){const y=mid-p.h/2;rect+='<rect x="'+x+'" y="'+y+'" rx="3" width="'+p.w+'" height="'+p.h+'" fill="'+p.color+'" stroke="#102039" stroke-width="2"/>'+
  '<text x="'+(x+p.w/2)+'" y="'+(mid+6)+'" fill="'+p.text+'" font-size="'+(p.kg<2.5?11:15)+'" font-weight="900" text-anchor="middle">'+format(p.kg)+'</text>';x+=p.w+gap;}
 return '<svg role="img" aria-label="Discos por lado" viewBox="0 0 '+vbW+' 225" xmlns="http://www.w3.org/2000/svg">'+
 '<rect x="'+barStart+'" y="'+(mid-6)+'" rx="5" width="'+(barEnd-barStart)+'" height="12" fill="#8c9fb8"/>'+
 '<rect x="'+(barStart+12)+'" y="'+(mid-19)+'" rx="4" width="16" height="38" fill="#647892"/>'+
 rect+'<rect x="'+collarX+'" y="'+(mid-24)+'" rx="4" width="17" height="48" fill="#667990"/></svg>';
}
function show(data){
 if(!data||data.version!==1)return;
 lastVersion=Date.now();
 get('movement').textContent=data.movementName||'Levantamiento';
 get('group').textContent=data.group==='Todos'?'Todos los grupos':'Grupo '+(data.group||'—');
 get('round').textContent='Intento '+(data.round||'—');
 get('athlete').textContent=data.athlete||'Esperando participante…';
 get('weight').innerHTML=data.weight==null?'— <span>kg</span>':format(data.weight)+' <span>kg</span>';
 const status=data.status==='Válido'?'valid':data.status==='Nulo'?'null':'pending';
 get('result').className='result '+status;
 get('result').textContent=status==='valid'?'✓ VÁLIDO':status==='null'?'✕ NULO':'● PENDIENTE';
 get('diagram').innerHTML=drawBar(data);
 get('per-side').textContent=data.perSide==null?'Barra de 20 kg · carga simétrica':'Barra de 20 kg · '+format(data.perSide)+' kg por lado';
 get('votes').replaceChildren();
 (data.votes||[]).forEach((v,i)=>{
  const tile=document.createElement('div');tile.className='vote '+(v===true?'good':v===false?'bad':'');
  const label=document.createElement('span');label.textContent='J'+(i+1);
  const value=document.createElement('b');value.textContent=v===true?'✓':v===false?'✕':'–';
  tile.append(label,value);get('votes').append(tile);
 });
 get('live').classList.remove('offline');get('connection').textContent='Conectado · en vivo';
}
try{const cached=localStorage.getItem(KEY);if(cached)show(JSON.parse(cached))}catch(e){}
try{if(typeof BroadcastChannel==='function'){const channel=new BroadcastChannel(CHANNEL);channel.onmessage=e=>show(e.data)}}catch(e){}
window.addEventListener('storage',e=>{if(e.key===KEY&&e.newValue){try{show(JSON.parse(e.newValue))}catch(err){}}});
setInterval(()=>{if(lastVersion&&Date.now()-lastVersion>30000){get('live').classList.add('offline');get('connection').textContent='Sin cambios recientes'}} ,5000);
get('fullscreen').addEventListener('click',()=>{if(document.fullscreenElement)document.exitFullscreen();else document.documentElement.requestFullscreen?.()});
