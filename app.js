'use strict';
const KEY='powerlifting-campeonato-2026-web-v2';
const MOV=[['sq','Sentadilla'],['bp','Press banca'],['dl','Peso muerto']];
const GROUPS=['Escolar Menor','Escolar Mayor','Exalumnos'];
const DEFAULT_PLATES=[
{kg:25,pairs:2,color:'#dc3545'},{kg:20,pairs:2,color:'#3184df'},{kg:15,pairs:2,color:'#f2ca42'},
{kg:10,pairs:2,color:'#2f9d70'},{kg:5,pairs:2,color:'#f7f8fc'},
{kg:2.5,pairs:2,color:'#242d3d'},{kg:1.25,pairs:1,color:'#a7b2c4'},
{kg:1,pairs:1,color:'#8795a8'},{kg:0.5,pairs:1,color:'#d0dae3'}];
const defaults=()=>({settings:{femaleMinor:55,maleMinor:67.5,femaleMajor:60,maleMajor:75},athletes:[],plates:DEFAULT_PLATES.map(p=>({...p}))});
const attempt=()=>({kg:null,votes:[null,null,null]});
const newLifts=()=>Object.fromEntries(MOV.map(m=>[m[0],[attempt(),attempt(),attempt()]]));
let state=load(),view='overview',movement='sq',round=0,filter='Todos',editing=null,activeLifterId=null;
function load(){try{const x=JSON.parse(localStorage.getItem(KEY));if(x&&Array.isArray(x.athletes)&&x.settings){if(!Array.isArray(x.plates))x.plates=DEFAULT_PLATES.map(p=>({...p}));return x}}catch(e){}return defaults()}
function save(){localStorage.setItem(KEY,JSON.stringify(state));const e=document.getElementById('saveState');if(e)e.textContent='● Guardado local'}
function esc(x){return String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function num(x){return Number(x)||0}
function fixed(x){return num(x).toLocaleString('es-CL',{maximumFractionDigits:2})}
function group(a){return a.group||'Escolar Menor'}
function sex(a){return a.sex==='F'?'Femenino':'Masculino'}
function division(a){if(group(a)==='Exalumnos')return 'Abierta';const s=state.settings;const limit=group(a)==='Escolar Menor'?(a.sex==='F'?num(s.femaleMinor):num(s.maleMinor)):(a.sex==='F'?num(s.femaleMajor):num(s.maleMajor));return num(a.weight)<=limit?'Ligero':'Pesado'}
function lifts(a,m){if(!a.lifts)a.lifts=newLifts();if(!a.lifts[m])a.lifts[m]=[attempt(),attempt(),attempt()];return a.lifts[m]}
function result(t){if(!t||!num(t.kg))return 'Pendiente';const v=t.votes||[];if(v.some(x=>x===null||x===undefined))return 'Pendiente';return v.filter(Boolean).length>=2?'Válido':'Nulo'}
function best(a,m){return Math.max(0,...lifts(a,m).filter(t=>result(t)==='Válido').map(t=>num(t.kg)))}
function total(a){return MOV.reduce((s,m)=>s+best(a,m[0]),0)}
function relative(a){return num(a.weight)>0?total(a)/num(a.weight):0}
function header(title,desc,action=''){return '<div class="pagehead"><div><span class="eyebrow">Campeonato Powerlifting 2026</span><h1>'+title+'</h1><p>'+desc+'</p></div>'+action+'</div>'}
function panel(title,body){return '<section class="panel"><div class="panelhead"><h2>'+title+'</h2></div>'+body+'</section>'}
function table(head,rows){return '<div class="tablewrap"><table><thead><tr>'+head.map(x=>'<th>'+x+'</th>').join('')+'</tr></thead><tbody>'+rows.join('')+'</tbody></table></div>'}
function tag(txt,cls=''){return '<span class="tag '+cls+'">'+esc(txt)+'</span>'}
function athleteRow(a){return '<tr><td><strong>'+esc(a.name)+'</strong></td><td>'+esc(group(a))+'</td><td>'+sex(a)+'</td><td>'+fixed(a.weight)+' kg</td><td>'+tag(division(a),'blue')+'</td><td><button class="btn tiny light" data-edit="'+esc(a.id)+'">Editar</button> <button class="btn tiny danger" data-remove="'+esc(a.id)+'">Eliminar</button></td></tr>'}
function render(){document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===view));const main=document.getElementById('main');main.innerHTML=({overview:overview,athletes:athletesPage,lifting:liftingPage,awards:awardsPage,settings:settingsPage,plates:platesPage}[view]||overview)()}
function overview(){const done=state.athletes.flatMap(a=>MOV.flatMap(m=>lifts(a,m[0]))).filter(t=>result(t)!=='Pendiente');const stats=[['Inscritos',state.athletes.length],['Escolar Menor',state.athletes.filter(a=>group(a)==='Escolar Menor').length],['Escolar Mayor',state.athletes.filter(a=>group(a)==='Escolar Mayor').length],['Exalumnos',state.athletes.filter(a=>group(a)==='Exalumnos').length]];return header('Panel general','Seguimiento del campeonato y acceso a la mesa de control.')+'<div class="cards">'+stats.map(s=>'<div class="stat"><label>'+s[0]+'</label><strong>'+s[1]+'</strong><small>deportistas</small></div>').join('')+'</div>'+panel('Estado de la competencia','<div class="panelbody"><p><strong>'+done.length+'</strong> intentos evaluados · <strong>'+done.filter(t=>result(t)==='Válido').length+'</strong> válidos · <strong>'+done.filter(t=>result(t)==='Nulo').length+'</strong> nulos.</p><div class="actions"><button class="btn" data-go="athletes">Gestionar inscripciones</button><button class="btn light" data-go="lifting">Mesa de levantamientos</button><button class="btn light" data-go="awards">Ver premiación</button></div></div>')+(state.athletes.length?'':'<div class="warning">No hay deportistas registrados. Puedes inscribirlos uno a uno o cargar la simulación ficticia desde Inscripciones.</div>')}
function athleteForm(){
const a=state.athletes.find(a=>a.id===editing)||{name:'',group:'Escolar Menor',sex:'M',weight:'',lifts:newLifts()};
const loadField=(m,label)=>'<label class="field">'+label+' (kg)<input name="initial_'+m+'" type="number" min="0.5" max="800" step=".5" placeholder="Ej. 60" required value="'+esc(lifts(a,m)[0].kg??'')+'"></label>';
return '<form id="athleteForm" class="registration-form">'+
'<div class="formgrid"><label class="field">Nombre completo<input name="name" required maxlength="100" value="'+esc(a.name)+'"></label>'+
'<label class="field">Categoría<select name="group">'+GROUPS.map(x=>'<option '+(group(a)===x?'selected':'')+'>'+x+'</option>').join('')+'</select></label>'+
'<label class="field">Sexo<select name="sex"><option value="M" '+(a.sex==='M'?'selected':'')+'>Masculino</option><option value="F" '+(a.sex==='F'?'selected':'')+'>Femenino</option></select></label>'+
'<label class="field">Peso corporal (kg)<input name="weight" type="number" min="1" max="400" step=".1" required value="'+esc(a.weight)+'"></label></div>'+
'<div class="starter-section"><div class="starter-heading"><strong>Cargas del primer intento</strong><span>Se enviarán automáticamente a la mesa de levantamientos.</span></div><div class="starter-grid">'+
loadField('sq','Sentadilla')+loadField('bp','Press banca')+loadField('dl','Peso muerto')+
'</div></div>'+
'<div class="registration-actions"><button class="btn" type="submit">'+(editing?'Guardar cambios':'Inscribir')+'</button>'+(editing?'<button type="button" id="cancelEdit" class="btn light">Cancelar</button>':'')+'</div></form>'
}
function athletesPage(){return header('Inscripciones y pesaje','Clasificación escolar por sexo y peso. Exalumnos compiten en categoría abierta.')+panel(editing?'Editar deportista':'Nuevo deportista','<div class="panelbody">'+athleteForm()+'</div>')+panel('Participantes ('+state.athletes.length+')','<div class="panelbody"><div class="actions"><button class="btn light" id="loadDemo">Cargar 35 participantes ficticios</button><button class="btn light" id="clearAll">Vaciar inscripciones</button></div></div>'+table(['Deportista','Categoría','Sexo','Peso','División','Acciones'],state.athletes.map(athleteRow)))}
function voteControls(a,t,j){const v=(t.votes||[])[j];const id=a.id+'-'+movement+'-'+round+'-'+j;return '<label class="field" style="display:inline-flex;align-items:center;gap:3px"><span class="muted">J'+(j+1)+'</span><select class="filter" style="min-width:80px;width:90px" data-vote="'+esc(a.id)+'" data-judge="'+j+'"><option value="" '+(v==null?'selected':'')+'>—</option><option value="true" '+(v===true?'selected':'')+'>✓</option><option value="false" '+(v===false?'selected':'')+'>✕</option></select></label>'}
function liftingPage(){
 const sorted=orderedLifters(), selected=activeLifter(sorted);
 const rows=sorted.map(({a,t},i)=>'<tr class="'+(selected&&a.id===selected.a.id?'lift-current':'')+'"><td><button class="select-lifter '+(selected&&a.id===selected.a.id?'chosen':'')+'" data-current="'+esc(a.id)+'">'+(selected&&a.id===selected.a.id?'● ':'')+(i+1)+'</button></td><td><strong>'+esc(a.name)+'</strong><br><small>'+esc(group(a))+' · '+esc(division(a))+'</small></td><td><input aria-label="Carga en kilogramos" class="compact-input" data-kg="'+esc(a.id)+'" type="number" min="0" max="800" step=".5" value="'+esc(t.kg??'')+'"></td><td class="vote-cell" colspan="3">'+[0,1,2].map(j=>voteControls(a,t,j)).join('')+'</td><td>'+tag(result(t),result(t)==='Válido'?'good':result(t)==='Nulo'?'bad':'')+'</td></tr>');
 return '<div class="lifting-top"><div class="lifting-info">'+header('Mesa de levantamientos','Selecciona en la columna Orden al deportista en plataforma. El gráfico indica los discos necesarios para su carga.')+
 '<div class="exercise-tabs">'+MOV.map(m=>'<button data-move="'+m[0]+'" class="'+(movement===m[0]?'active':'')+'">'+m[1]+'</button>').join('')+'</div>'+
 '<div class="exercise-tabs">'+[0,1,2].map(i=>'<button data-round="'+i+'" class="'+(round===i?'active':'')+'">Intento '+(i+1)+'</button>').join('')+'</div></div>'+
 loadWidget(sorted)+'</div>'+
 panel('Orden de salida · '+MOV.find(m=>m[0]===movement)[1]+' · Intento '+(round+1),table(['En plataforma','Deportista','Carga (kg)','Decisiones de los jueces','','','Resultado'],rows))+
 '<div class="warning">El orden se actualiza por carga; la votación queda vinculada al deportista. Haz clic en el número de la primera columna para visualizar su configuración de barra. Los intentos aprobados con dos o más votos válidos se contabilizan para la premiación.</div>';
}
function validLoad(t){return Number.isFinite(Number(t.kg))&&Number(t.kg)>=20}
function orderedLifters(){return state.athletes.map(a=>({a,t:lifts(a,movement)[round]})).sort((x,y)=>(validLoad(x.t)?num(x.t.kg):Infinity)-(validLoad(y.t)?num(y.t.kg):Infinity)||x.a.name.localeCompare(y.a.name,'es'))}
function activeLifter(sorted){const chosen=sorted.find(x=>x.a.id===activeLifterId);if(chosen)return chosen;return sorted.find(x=>validLoad(x.t)&&result(x.t)==='Pendiente')||sorted.find(x=>validLoad(x.t))||null}
function platePlan(load){
 if(!Number.isFinite(load)||load<20)return {ok:false,message:'Indica una carga igual o superior a 20 kg.'};
 const half=(load-20)/2,units=Math.round(half*4);
 if(Math.abs(units/4-half)>1e-7)return {ok:false,message:'Carga no compatible con incrementos de 0,5 kg.'};
 let dp=new Map([[0,[]]]);
 const inventory=(state.plates||[]).filter(p=>Number(p.kg)>0&&Number(p.pairs)>0).sort((a,b)=>b.kg-a.kg);
 for(const p of inventory){
   const w=Math.round(Number(p.kg)*4);if(Math.abs(w/4-Number(p.kg))>1e-7)continue;
   for(let n=0;n<Math.min(100,Math.floor(Number(p.pairs)));n++){
     const next=new Map(dp);
     for(const [v,arr] of dp){const nv=v+w;if(nv>units)continue;
       const candidate=[...arr,p];const previous=next.get(nv);
       if(!previous||candidate.length<previous.length)next.set(nv,candidate);
     }
     dp=next;
   }
 }
 const found=dp.get(units);
 if(!found)return {ok:false,message:'No se puede montar esta carga con los pares disponibles.'};
 return {ok:true,side:half,plates:found,load};
}
function plateGraphic(plan){
 if(!plan.ok)return '<div class="load-error">'+esc(plan.message)+'</div>';
 const colors=plan.plates;
 let x=74;
 const rectangles=colors.map((p,i)=>{
 const height= Math.round(37+Number(p.kg)/25*65);
 const width=Math.max(13,Math.min(23,13+Number(p.kg)/25*10));
 const y=91-height/2;
 const fill=esc(p.color||'#64748b');
 const stroke=fill.toLowerCase()==='#f7f8fc'?'#a6b3c7':'#192438';
 const item='<rect x="'+x+'" y="'+y+'" rx="2" width="'+width+'" height="'+height+'" fill="'+fill+'" stroke="'+stroke+'" stroke-width="1.4"/>'+
 '<text x="'+(x+width/2)+'" y="95" text-anchor="middle" fill="'+(Number(p.kg)===5?'#1c2639':'#ffffff')+'" font-size="11" font-weight="800">'+esc(p.kg)+'</text>';
 x+=width+3;return item;
 }).join('');
 const end=Math.max(330,x+70);
 return '<svg role="img" aria-label="Discos de un lado de la barra de 20 kg" viewBox="0 0 '+end+' 180" xmlns="http://www.w3.org/2000">'+
 '<rect x="16" y="86" width="'+(end-40)+'" height="10" rx="4" fill="#77889e"/>'+
 '<rect x="35" y="71" width="15" height="40" rx="4" fill="#43546a"/>'+
 rectangles+
 '<rect x="'+x+'" y="74" width="14" height="35" rx="3" fill="#4d5c71"/>'+
 '<text x="16" y="150" fill="#7c899c" font-size="12">Barra: 20 kg</text>'+
 '<text x="'+(end-15)+'" y="150" text-anchor="end" fill="#7c899c" font-size="12">Por lado: '+fixed(plan.side)+' kg</text></svg>';
}
function loadWidget(sorted){
 const selected=activeLifter(sorted);
 const load=selected?num(selected.t.kg):0;
 const plan=platePlan(load);
 const packed=plan.ok?plan.plates.reduce((o,p)=>{o[p.kg]=(o[p.kg]||0)+1;return o},{}):{};
 return '<div class="load-widget"><div class="load-title"><span>CONFIGURACIÓN DE BARRA</span><button class="btn tiny light" data-go="plates">Editar discos</button></div>'+
 '<div class="load-weight">'+(selected&&load>=20?fixed(load)+' <small>kg</small>':'Sin carga')+'</div>'+
 '<div class="load-athlete">'+(selected?esc(selected.a.name)+' · Intento '+(round+1):'Selecciona un levantador')+'</div>'+
 plateGraphic(plan)+
 (plan.ok?'<div class="plate-legend">'+Object.entries(packed).sort((a,b)=>Number(b[0])-Number(a[0])).map(([k,v])=>'<span>'+v+' × '+k+' kg <small>por lado</small></span>').join('')+'</div>':'')+
 '<div class="load-caption">Representación de un lado de la barra. Colocar la misma cantidad de discos al otro lado.</div></div>';
}
function platesPage(){
 const rows=(state.plates||[]).map((p,i)=>'<tr><td><strong>'+fixed(p.kg)+' kg</strong></td><td><input class="compact-input" aria-label="Pares disponibles de '+p.kg+' kg" data-pairs="'+i+'" type="number" min="0" max="100" step="1" value="'+Number(p.pairs)+'"></td><td><div class="plate-color-cell"><input type="color" data-color="'+i+'" value="'+esc(p.color)+'" aria-label="Color de discos de '+p.kg+' kg"><span>'+esc(p.color)+'</span></div></td><td>'+Number(p.pairs)*2+' discos</td></tr>');
 return header('Inventario de discos','Indica la cantidad de pares disponibles y el color de cada peso. La barra fija es de 20 kg.')+
 panel('Discos disponibles',table(['Peso unitario','Cantidad de pares','Color','Total físico'],rows))+
 '<div class="warning">Un par equivale a dos discos, uno a cada lado. El cálculo utiliza solamente los pares configurados y respeta la distribución simétrica de carga. Los collarines no están incluidos en los 20 kg de la barra.</div>'+
 '<div class="actions"><button class="btn light" id="resetPlates">Restablecer inventario de ejemplo</button></div>';
}

function ranking(arr,relativeMode){return [...arr].filter(a=>total(a)>0).sort((a,b)=>(relativeMode?relative(b)-relative(a):total(b)-total(a))||num(a.weight)-num(b.weight)||a.name.localeCompare(b.name,'es'))}
function podium(arr,relMode){const r=ranking(arr,relMode).slice(0,3);return table(['Lugar','Deportista','Peso','Total','Relativo'],r.map((a,i)=>'<tr><td class="medal">'+['🥇 1.º','🥈 2.º','🥉 3.º'][i]+'</td><td>'+esc(a.name)+'</td><td>'+fixed(a.weight)+' kg</td><td>'+fixed(total(a))+' kg</td><td>'+relative(a).toFixed(3)+'×</td></tr>'))}
function awardsPage(){let sections='';for(const g of GROUPS.slice(0,2)){for(const sx of ['F','M'])for(const div of ['Ligero','Pesado']){sections+=panel(g+' · '+(sx==='F'?'Femenino':'Masculino')+' · '+div,podium(state.athletes.filter(a=>group(a)===g&&a.sex===sx&&division(a)===div),false))}}sections+=panel('Exalumnos · ABIERTO · Rendimiento relativo',podium(state.athletes.filter(a=>group(a)==='Exalumnos'),true));sections+=panel('Ranking absoluto de rendimiento relativo',table(['Lugar','Deportista','Categoría','Total','Relativo'],ranking(state.athletes,true).map((a,i)=>'<tr><td>'+(i+1)+'.º</td><td>'+esc(a.name)+'</td><td>'+esc(group(a))+'</td><td>'+fixed(total(a))+' kg</td><td>'+relative(a).toFixed(3)+'×</td></tr>')));return header('Resumen de premiación','Escolares: mayor total válido por división y sexo. Exalumnos: podio abierto y mixto por rendimiento relativo.')+'<div class="warning">Coeficiente relativo utilizado: total válido ÷ peso corporal. No corresponde a puntos IPF GL. Deportistas sin levantamientos válidos no participan del ranking.</div>'+sections}
function settingsPage(){const s=state.settings;return header('Configuración','Límites máximos de peso de división Ligero, editables por categoría escolar.')+panel('Cortes de peso (kg)','<div class="panelbody"><form id="settingsForm" class="formgrid">'+[['femaleMinor','Escolar Menor · Mujeres'],['maleMinor','Escolar Menor · Hombres'],['femaleMajor','Escolar Mayor · Mujeres'],['maleMajor','Escolar Mayor · Hombres']].map(x=>'<label class="field">'+x[1]+'<input name="'+x[0]+'" type="number" min="1" step=".1" required value="'+s[x[0]]+'"></label>').join('')+'<div class="formactions"><button class="btn">Guardar límites</button></div></form></div>')+'<div class="warning">Exalumnos no tienen divisiones de peso ni clasificación separada por sexo. Su premiación es abierta y utiliza exclusivamente el índice relativo.</div>'}
function demo(){const names=['Agustín Vera','Joaquín Carrasco','Tomás Alarcón','Sebastián Soto','Benjamín Díaz','Mateo Torres','Antonia Aguilera','Valentina Rojas','Felipe Muñoz','Vicente Ruiz','Martina León','Ignacio Morales','Diego Valdés','Matías Vega','Lucas Riquelme','Francisca Silva','Camila Hernández','Nicolás Oyarzún','Javier Molina','Emilio Fuentes','Isidora Paredes','Cristóbal Andrade','Joaquín Pérez','Sofía Morales','Gabriel Castro','Francisco Cárcamo','Daniel Muñoz','Esteban Muñoz','Rodrigo Aguilar','Pablo Salinas','Andrés Bravo','Paula Vidal','Mauricio Núñez','Felipe Herrera','Carolina Silva'];const female=new Set([6,7,10,15,16,20,23,31]);state.athletes=names.map((name,i)=>{let a={id:'demo-'+(i+1),name,group:i<12?'Escolar Menor':i<25?'Escolar Mayor':'Exalumnos',sex:female.has(i)?'F':'M',weight:Math.round((female.has(i)?47:57)+(i*11%43)+(i%3)*.7),lifts:newLifts()};MOV.forEach((m,k)=>{const base=Math.round((a.weight*(k===1?.65:k===2?1.25:1.05)+i%7*2)/2.5)*2.5;lifts(a,m[0]).forEach((t,j)=>{t.kg=base+j*2.5;t.votes=[true,true,(i+j+k)%5!==0]})});return a});save();render()}
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.view){view=b.dataset.view;editing=null;render()}else if(b.dataset.go){view=b.dataset.go;render()}else if(b.dataset.move){movement=b.dataset.move;activeLifterId=null;render()}else if(b.dataset.round){round=+b.dataset.round;activeLifterId=null;render()}else if(b.dataset.current){activeLifterId=b.dataset.current;render()}else if(b.dataset.edit){editing=b.dataset.edit;render()}else if(b.dataset.remove){if(confirm('¿Eliminar participante y todos sus intentos?')){state.athletes=state.athletes.filter(a=>a.id!==b.dataset.remove);save();render()}}else if(b.id==='cancelEdit'){editing=null;render()}else if(b.id==='resetPlates'){if(confirm('¿Restablecer los pares y colores de ejemplo?')){state.plates=DEFAULT_PLATES.map(p=>({...p}));save();render()}}else if(b.id==='loadDemo'){if(confirm('¿Reemplazar las inscripciones actuales por una simulación con 35 deportistas ficticios?'))demo()}else if(b.id==='clearAll'){if(confirm('¿Eliminar permanentemente las inscripciones de este navegador?')){state.athletes=[];save();render()}}else if(b.id==='exportJSON'){const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='respaldo-powerlifting-2026.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}else if(b.id==='importJSON'){document.getElementById('importFile').click()}});
document.addEventListener('submit',e=>{e.preventDefault();const f=e.target,d=new FormData(f);if(f.id==='athleteForm'){const name=String(d.get('name')||'').trim(),weight=Number(d.get('weight'));if(!name||weight<=0)return;let a=state.athletes.find(a=>a.id===editing);if(!a){a={id:'ath-'+Date.now()+'-'+Math.random().toString(36).slice(2),lifts:newLifts()};state.athletes.push(a)}Object.assign(a,{name,weight,group:String(d.get('group')),sex:String(d.get('sex'))});for(const m of MOV){const initial=Number(d.get('initial_'+m[0]));if(!Number.isFinite(initial)||initial<=0)return;lifts(a,m[0])[0].kg=initial}editing=null}else if(f.id==='settingsForm'){for(const k of Object.keys(state.settings))state.settings[k]=Number(d.get(k))||state.settings[k]}save();render()});
document.addEventListener('change',e=>{const x=e.target;if(x.dataset.pairs!==undefined||x.dataset.color!==undefined){const i=Number(x.dataset.pairs??x.dataset.color);const p=state.plates[i];if(!p)return;if(x.dataset.pairs!==undefined)p.pairs=Math.max(0,Math.min(100,Math.floor(Number(x.value)||0)));else if(/^#[a-fA-F0-9]{6}$/.test(x.value))p.color=x.value;save();render()}else if(x.dataset.kg||x.dataset.vote){const a=state.athletes.find(a=>a.id===(x.dataset.kg||x.dataset.vote));if(!a)return;const t=lifts(a,movement)[round];if(x.dataset.kg)t.kg=x.value===''?null:Number(x.value);else t.votes[+x.dataset.judge]=x.value===''?null:x.value==='true';save();render()}else if(x.id==='importFile'){const file=x.files?.[0];if(!file)return;file.text().then(s=>{try{const d=JSON.parse(s);if(!Array.isArray(d.athletes)||!d.settings)throw Error('Formato incorrecto');if(!confirm('¿Reemplazar todos los datos locales por el respaldo?'))return;state=d;save();render()}catch(err){alert('No se pudo importar: '+err.message)}finally{x.value=''}})}});
render();