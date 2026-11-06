'use strict';
const KEY='powerlifting-campeonato-2026-web-v2';
const MOV=[['sq','Sentadilla'],['bp','Press banca'],['dl','Peso muerto']];
const GROUPS=['Escolar Menor','Escolar Mayor','Exalumnos'];
const DEFAULT_PLATES=[
{kg:25,pairs:2,color:'#dc3545'},{kg:20,pairs:2,color:'#3184df'},{kg:15,pairs:2,color:'#f2ca42'},
{kg:10,pairs:2,color:'#2f9d70'},{kg:5,pairs:2,color:'#f7f8fc'},
{kg:2.5,pairs:2,color:'#242d3d'},{kg:2,pairs:1,color:'#7965bf'},
{kg:1.5,pairs:1,color:'#ed925c'},{kg:1.25,pairs:1,color:'#a7b2c4'},
{kg:1,pairs:1,color:'#8795a8'},{kg:0.5,pairs:1,color:'#d0dae3'}];
const MAX_JUDGES=7;
const DEFAULT_JUDGES=()=>Array.from({length:MAX_JUDGES},()=>({first:'',last:''}));
const defaults=()=>({settings:{femaleMinor:55,maleMinor:67.5,femaleMajor:60,maleMajor:75},athletes:[],plates:DEFAULT_PLATES.map(p=>({...p})),judgeCount:3,judges:DEFAULT_JUDGES(),groupsLocked:false});
const NEXT_DEFAULT_INCREASE=2.5;
const NEXT_MIN_INCREASE=0.5;
const attempt=()=>({kg:null,votes:[null,null,null]});
const newLifts=()=>Object.fromEntries(MOV.map(m=>[m[0],[attempt(),attempt(),attempt()]]));
let state=load(),view='overview',movement='sq',round=0,filter='Todos',editing=null,activeLifterId=null;
// La selección es local a cada mesa: SQ inicia en A y BP en B (primera rotación).
const stationFilters={sq:'A',bp:'B',dl:'Todos'};
function normalizePlates(plates){
 const existing=Array.isArray(plates)?plates:[];
 // Mantiene pares y colores existentes, incorporando los nuevos pesos sin reiniciar el inventario.
 const merged=DEFAULT_PLATES.map(def=>{
  const saved=existing.find(p=>p&&Number(p.kg)===def.kg);
  if(!saved)return {...def};
  return {kg:def.kg,pairs:Math.max(0,Math.min(100,Math.floor(Number(saved.pairs)||0))),color:/^#[a-fA-F0-9]{6}$/.test(saved.color)?saved.color:def.color};
 });
 return merged;
}
function load(){try{const x=JSON.parse(localStorage.getItem(KEY));if(x&&Array.isArray(x.athletes)&&x.settings){x.plates=normalizePlates(x.plates);normalizeJudges(x);if(typeof x.groupsLocked!=='boolean')x.groupsLocked=false;return x}}catch(e){}return defaults()}
function normalizeJudges(x){
 x.judgeCount=Math.max(1,Math.min(MAX_JUDGES,Math.floor(Number(x.judgeCount)||3)));
 const prev=Array.isArray(x.judges)?x.judges:[];
 x.judges=DEFAULT_JUDGES().map((empty,i)=>({first:String(prev[i]?.first||'').slice(0,70),last:String(prev[i]?.last||'').slice(0,70)}));
 return x;
}
function judgeCount(){return Math.max(1,Math.min(MAX_JUDGES,Number(state.judgeCount)||3))}
function judgeLabel(i){const j=state.judges?.[i]||{};const n=String(j.first||'').trim();const a=String(j.last||'').trim();return n&&a?'J. '+n[0].toLocaleUpperCase('es-CL')+'.'+a[0].toLocaleUpperCase('es-CL')+'.':'J'+(i+1)}
function judgeFullName(i){const j=state.judges?.[i]||{};return [j.first,j.last].filter(Boolean).join(' ').trim()||'Juez '+(i+1)}
function save(){localStorage.setItem(KEY,JSON.stringify(state));const e=document.getElementById('saveState');if(e)e.textContent='● Guardado local'}
function esc(x){return String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function num(x){return Number(x)||0}
function fixed(x){return num(x).toLocaleString('es-CL',{maximumFractionDigits:2})}
function group(a){return a.group||'Escolar Menor'}
function sex(a){return a.sex==='F'?'Femenino':'Masculino'}
function division(a){if(group(a)==='Exalumnos')return 'Abierta';const s=state.settings;const limit=group(a)==='Escolar Menor'?(a.sex==='F'?num(s.femaleMinor):num(s.maleMinor)):(a.sex==='F'?num(s.femaleMajor):num(s.maleMajor));return num(a.weight)<=limit?'Ligero':'Pesado'}
function lifts(a,m){if(!a.lifts)a.lifts=newLifts();if(!a.lifts[m])a.lifts[m]=[attempt(),attempt(),attempt()];return a.lifts[m]}
function result(t){
 if(!t||!num(t.kg))return 'Pendiente';
 const n=judgeCount(),v=Array.isArray(t.votes)?t.votes.slice(0,n):[];
 const threshold=Math.floor(n/2)+1;
 if(v.filter(x=>x===true).length>=threshold)return 'Válido';
 if(v.filter(x=>x===false).length>=threshold)return 'Nulo';
 if(Array.from({length:n},(_,i)=>v[i]).every(x=>x===true||x===false))return 'Empate';
 return 'Pendiente';
}
function canUseAttempt(a,m,index){return index!==2||validLoad(lifts(a,m)[1])}
function best(a,m){return Math.max(0,...lifts(a,m).filter((t,i)=>canUseAttempt(a,m,i)&&result(t)==='Válido').map(t=>num(t.kg)))}
function total(a){return MOV.reduce((s,m)=>s+best(a,m[0]),0)}
function relative(a){return num(a.weight)>0?total(a)/num(a.weight):0}
function header(title,desc,action=''){return '<div class="pagehead"><div><span class="eyebrow">Campeonato Powerlifting 2026</span><h1>'+title+'</h1><p>'+desc+'</p></div>'+action+'</div>'}
function panel(title,body){return '<section class="panel"><div class="panelhead"><h2>'+title+'</h2></div>'+body+'</section>'}
function table(head,rows){return '<div class="tablewrap"><table><thead><tr>'+head.map(x=>'<th>'+x+'</th>').join('')+'</tr></thead><tbody>'+rows.join('')+'</tbody></table></div>'}
function tag(txt,cls=''){return '<span class="tag '+cls+'">'+esc(txt)+'</span>'}

function athleteCode(a){return a.competitionId||a.id}
function initial(a,m){return num(lifts(a,m)[0].kg)}
function eligibleForDistribution(){return state.athletes.length>=2&&state.athletes.every(a=>initial(a,'sq')>=20&&initial(a,'bp')>=20)}
function ensureIds(){
 const reserved=new Set(state.athletes.map(a=>a.competitionId).filter(Boolean));let n=1;
 for(const a of state.athletes){if(a.competitionId)continue;let code;do{code='CFN-'+String(n++).padStart(3,'0')}while(reserved.has(code));a.competitionId=code;reserved.add(code)}
}
function distributeGroups(){
 if(!eligibleForDistribution())throw Error('Registra sentadilla y banca iniciales (mínimo 20 kg) para todos.');
 const list=[...state.athletes].sort((a,b)=>initial(b,'sq')+initial(b,'bp')-initial(a,'sq')-initial(a,'bp')||a.name.localeCompare(b.name,'es')||a.id.localeCompare(b.id));
 const totalSq=list.reduce((n,a)=>n+initial(a,'sq'),0),totalBp=list.reduce((n,a)=>n+initial(a,'bp'),0);
 const totals={A:{count:0,sq:0,bp:0},B:{count:0,sq:0,bp:0}};
 const add=(a,g)=>{a.stationGroup=g;totals[g].count++;totals[g].sq+=initial(a,'sq');totals[g].bp+=initial(a,'bp')};
 const loss=(a,b)=>Math.abs(totals.A.sq+initial(a,'sq')-totals.B.sq-initial(b,'sq'))/totalSq+Math.abs(totals.A.bp+initial(a,'bp')-totals.B.bp-initial(b,'bp'))/totalBp;
 for(let i=0;i<list.length;i+=2){const a=list[i],b=list[i+1];if(!b){add(a,totals.A.count<=totals.B.count?'A':'B');break}if(loss(a,b)<=loss(b,a)){add(a,'A');add(b,'B')}else{add(a,'B');add(b,'A')}}
 ensureIds();return totals;
}
function stationStats(){return ['A','B'].map(g=>{const arr=state.athletes.filter(a=>a.stationGroup===g);return {g,count:arr.length,sq:arr.reduce((n,a)=>n+initial(a,'sq'),0),bp:arr.reduce((n,a)=>n+initial(a,'bp'),0)}})}

const LIFT_CSV_FORMAT='CFN-POWERLIFTING-RESULTADOS';
const LIFT_CSV_VERSION='1';
const LIFT_CSV_HEADER=['Formato','Version','Prueba','ID','Nombre','Categoria','Sexo','PesoCorporalKg','GrupoAB','NumeroJueces','Intento','CargaKg','VotoJ1','VotoJ2','VotoJ3','VotoJ4','VotoJ5','VotoJ6','VotoJ7','CargaManual'];
function csvQuote(value){
 let v=String(value??'');
 // Evita que nombres maliciosos sean interpretados como fórmulas por Excel.
 if(/^[=+@-]/.test(v))v="'"+v;
 return '"'+v.replace(/"/g,'""')+'"';
}
function csvText(rows){return '\uFEFF'+rows.map(row=>row.map(csvQuote).join(';')).join('\r\n')}
function csvRows(text){
 const content=String(text).replace(/^\uFEFF/,'');
 const rows=[];let row=[],field='',quoted=false;
 for(let i=0;i<content.length;i++){
  const ch=content[i];
  if(quoted){
   if(ch==='"'){if(content[i+1]==='"'){field+='"';i++}else quoted=false}
   else field+=ch;
  }else if(ch==='"'&&field==='')quoted=true;
  else if(ch===';'){row.push(field);field=''}
  else if(ch==='\n'||ch==='\r'){
   row.push(field);if(row.some(v=>v!==''))rows.push(row);row=[];field='';
   if(ch==='\r'&&content[i+1]==='\n')i++;
  }else field+=ch;
 }
 if(quoted)throw Error('CSV incompleto: hay comillas sin cerrar.');
 if(field!==''||row.length){row.push(field);if(row.some(v=>v!==''))rows.push(row)}
 return rows;
}
function decodedCsvName(s){return /^'[=+@-]/.test(s)?s.slice(1):s}
function validateRosterForTransfer(data=state){
 if(!data.groupsLocked)throw Error('Debes cerrar la nómina oficial antes de transferir resultados.');
 if(!data.athletes.length)throw Error('No hay deportistas registrados.');
 const ids=data.athletes.map(a=>a.competitionId);
 if(ids.some(x=>typeof x!=='string'||!x.trim())||new Set(ids).size!==ids.length)throw Error('Todos los deportistas necesitan un identificador oficial único. Revisa la nómina.');
 if(data.athletes.some(a=>!['A','B'].includes(a.stationGroup)))throw Error('Hay deportistas sin grupo de competencia.');
}
function liftResultsCsv(m,data=state){
 if(!['sq','bp'].includes(m))throw Error('Solo se exportan pruebas de sentadilla o press banca.');
 validateRosterForTransfer(data);
 const count=Math.max(1,Math.min(MAX_JUDGES,Math.floor(Number(data.judgeCount)||3)));
 const rows=[LIFT_CSV_HEADER];
 for(const a of [...data.athletes].sort((x,y)=>x.competitionId.localeCompare(y.competitionId))){
  const attempts=lifts(a,m);
  for(let i=0;i<3;i++){
   const t=attempts[i],vote=Array.isArray(t.votes)?t.votes:[];
   rows.push([LIFT_CSV_FORMAT,LIFT_CSV_VERSION,m,a.competitionId,a.name,group(a),a.sex,num(a.weight),a.stationGroup,count,i+1,
    t.kg===null?'':t.kg,
    ...Array.from({length:MAX_JUDGES},(_,j)=>j>=count?'':vote[j]===true?'V':vote[j]===false?'N':''),
    t.nextLoadManual?'1':'0']);
  }
 }
 return csvText(rows);
}
function prepareLiftResultsImport(content,expectedMove,data=state){
 if(!['sq','bp'].includes(expectedMove))throw Error('Selecciona la prueba SQ o BP para importar.');
 validateRosterForTransfer(data);
 const rows=csvRows(content);
 if(rows.length<2)throw Error('El CSV está vacío.');
 const expected=LIFT_CSV_HEADER.join('|');
 if(rows[0].join('|')!==expected)throw Error('Formato CSV incompatible. Importa el archivo de resultados generado desde una tarima.');
 const map=new Map(data.athletes.map(a=>[a.competitionId,a]));
 const found=new Map(),judgeNumber=Math.max(1,Math.min(MAX_JUDGES,Math.floor(Number(data.judgeCount)||3)));
 for(let i=1;i<rows.length;i++){
  const r=rows[i];
  if(r.length!==LIFT_CSV_HEADER.length)throw Error('Fila '+(i+1)+': número de columnas incorrecto.');
  const [format,version,m,id,rawName,category,sex,weight,stationGroup,judges,attemptIndex,weightKg]=r;
  if(format!==LIFT_CSV_FORMAT||version!==LIFT_CSV_VERSION)throw Error('Fila '+(i+1)+': versión o formato incorrectos.');
  if(m!==expectedMove)throw Error('El archivo pertenece a '+m.toUpperCase()+' y no a '+expectedMove.toUpperCase()+'.');
  const a=map.get(id);
  if(!a)throw Error('Deportista desconocido en la fila '+(i+1)+': '+id+'. Las nóminas no coinciden.');
  if(decodedCsvName(rawName)!==a.name||category!==group(a)||sex!==a.sex||Number(weight)!==num(a.weight)||stationGroup!==a.stationGroup)throw Error('Los datos del deportista '+id+' no coinciden con la nómina central.');
  if(Number(judges)!==judgeNumber)throw Error('El archivo utiliza '+judges+' jueces y la mesa central tiene '+judgeNumber+'. Configura el mismo número antes de importar.');
  const n=Number(attemptIndex);
  if(!Number.isInteger(n)||n<1||n>3)throw Error('Intento inválido del deportista '+id+'.');
  const kg=weightKg===''?null:Number(weightKg);
  if(kg!==null&&(!Number.isFinite(kg)||kg<20||kg>800||Math.abs(kg*2-Math.round(kg*2))>1e-6))throw Error('Carga no válida para '+id+' (intento '+n+').');
  const votes=r.slice(12,19);
  if(votes.some((v,j)=>!['','V','N'].includes(v)||(j>=judgeNumber&&v!=='')))throw Error('Decisiones de jueces incorrectas en '+id+' (intento '+n+').');
  if(kg===null&&votes.some(Boolean))throw Error('El deportista '+id+' tiene votos sin carga declarada.');
  const manual=r[19];if(!['0','1'].includes(manual))throw Error('Indicador de carga manual inválido en '+id+'.');
  if(!found.has(id))found.set(id,[null,null,null]);
  if(found.get(id)[n-1])throw Error('Intento duplicado para '+id+': intento '+n+'.');
  found.get(id)[n-1]={kg,votes:Array.from({length:MAX_JUDGES},(_,j)=>votes[j]==='V'?true:votes[j]==='N'?false:null),nextLoadManual:manual==='1'};
 }
 if(found.size!==map.size)throw Error('La nómina del archivo no está completa: '+found.size+' de '+map.size+' deportistas. No se importó nada.');
 for(const [id,trials] of found){
  if(trials.some(t=>t===null))throw Error('Faltan uno o más intentos del deportista '+id+'.');
  for(let j=1;j<3;j++){
   const current=trials[j],prev=trials[j-1];
   if(current.kg===null)continue;
   if(prev.kg===null)throw Error('Intento '+(j+1)+' de '+id+' sin el intento anterior cargado.');
   const nValid=prev.votes.slice(0,judgeNumber).filter(x=>x===true).length;
   const min=prev.kg+(nValid>=Math.floor(judgeNumber/2)+1?NEXT_MIN_INCREASE:0);
   if(current.kg<min)throw Error('Carga del intento '+(j+1)+' de '+id+' es inferior al mínimo de '+min+' kg.');
  }
 }
 return {movement:expectedMove,athletes:found,count:found.size,attempts:found.size*3};
}
function applyLiftResultsImport(prepared,data=state){
 // Única escritura sobre los deportistas: el movimiento especificado, sin tocar datos personales ni otros movimientos.
 for(const a of data.athletes){a.lifts[prepared.movement]=prepared.athletes.get(a.competitionId).map(t=>({kg:t.kg,votes:t.votes.slice(0,Math.max(3,Math.floor(Number(data.judgeCount)||3))),nextLoadManual:t.nextLoadManual}))}
 data.liftImports=data.liftImports||{};
 data.liftImports[prepared.movement]={count:prepared.count,at:new Date().toISOString()};
}
function downloadText(filename,content,type){
 const url=URL.createObjectURL(new Blob([content],{type}));
 const a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function exportLiftResults(m){
 try{
  const csv=liftResultsCsv(m);
  downloadText('resultados_'+m.toUpperCase()+'_CFN_2026.csv',csv,'text/csv;charset=utf-8');
 }catch(e){alert(e.message)}
}
function exportRosterForTeams(){
 try{
  validateRosterForTransfer();
  const copy={...state,liftImports:{},athletes:state.athletes.map(a=>({...a,lifts:Object.fromEntries(MOV.map(([m])=>[m,[{kg:initial(a,m),votes:[null,null,null]},{kg:null,votes:[null,null,null]},{kg:null,votes:[null,null,null]}]]))}))};
  downloadText('nomina_maestra_CFN_2026_equipos.json',JSON.stringify(copy,null,2),'application/json');
 }catch(e){alert(e.message)}
}
function liftTransferPanel(){
 const ready=state.groupsLocked&&state.athletes.length>0;
 const info=m=>{
  const last=state.liftImports?.[m];
  return last?'<span class="transfer-status">Importados '+last.count+' deportistas · '+esc(new Date(last.at).toLocaleString('es-CL'))+'</span>':'<span class="transfer-status">Sin resultados importados</span>';
 };
 return panel('Consolidación de tarimas · Importar resultados',
  '<div class="panelbody"><p>La nómina debe estar cerrada en los tres equipos y ser idéntica. Cada CSV contiene únicamente los tres intentos de un movimiento, con sus cargas y votos. Al importar se conserva intacta la nómina y la otra prueba.</p>'+
  '<div class="transfer-grid"><div class="transfer-card"><strong>Sentadilla · Tarima SQ</strong>'+info('sq')+
  '<button type="button" class="btn light" data-import-results="sq" '+(ready?'':'disabled')+'>Importar resultados SQ (CSV)</button></div>'+
  '<div class="transfer-card"><strong>Press banca · Tarima BP</strong>'+info('bp')+
  '<button type="button" class="btn light" data-import-results="bp" '+(ready?'':'disabled')+'>Importar resultados BP (CSV)</button></div></div>'+
  '<div class="warning">Al importar, se reemplazan únicamente los intentos de la prueba seleccionada en este navegador. Primero se comprueban ID, nombre, categoría, grupo, peso corporal, jueces y los tres intentos de todos los deportistas. El peso muerto se registra directamente en la mesa central.</div></div>');
}

function rosterCsv(){
 if(!state.groupsLocked||state.athletes.some(a=>!['A','B'].includes(a.stationGroup))){alert('Confirma la distribución de A y B antes de exportar.');return}
 const fields=['ID','Nombre','Categoría','Sexo','Peso corporal kg','División','Grupo competencia','Sentadilla inicial kg','Press banca inicial kg','Peso muerto inicial kg'];
 const rows=[fields,...state.athletes.map(a=>[athleteCode(a),a.name,group(a),a.sex,a.weight,division(a),a.stationGroup,initial(a,'sq'),initial(a,'bp'),initial(a,'dl')])];
 const quote=v=>{const val=String(v??'').replace(/^([=+@-])/,"'$1");return '"'+val.replace(/"/g,'""')+'"'};
 const csv='\uFEFF'+rows.map(r=>r.map(quote).join(';')).join('\r\n'),url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
 const link=document.createElement('a');link.href=url;link.download='nomina_oficial_CFN_2026_AB.csv';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function athleteRow(a){
 const choice=state.groupsLocked?tag(a.stationGroup||'Sin grupo','blue'):'<select class="filter group-assignment" data-station-group="'+esc(a.id)+'"><option value="">Sin grupo</option><option value="A" '+(a.stationGroup==='A'?'selected':'')+'>A</option><option value="B" '+(a.stationGroup==='B'?'selected':'')+'>B</option></select>';
 return '<tr><td><strong>'+esc(a.name)+'</strong><br><small>'+esc(athleteCode(a))+'</small></td><td>'+esc(group(a))+'</td><td>'+sex(a)+'</td><td>'+fixed(a.weight)+' kg</td><td>'+tag(division(a),'blue')+'</td><td>'+fixed(initial(a,'sq'))+' / '+fixed(initial(a,'bp'))+'</td><td>'+choice+'</td><td>'+(state.groupsLocked?tag('Nómina cerrada','gold'):'<button class="btn tiny light" data-edit="'+esc(a.id)+'">Editar</button> <button class="btn tiny danger" data-remove="'+esc(a.id)+'">Eliminar</button>')+'</td></tr>'
}
function stationPanel(){
 const count=state.athletes.filter(a=>['A','B'].includes(a.stationGroup)).length,ready=eligibleForDistribution();
 const stats='<div class="group-stats">'+stationStats().map(g=>'<div class="group-stat"><span>Grupo '+g.g+'</span><strong>'+g.count+' deportistas</strong><small>Sentadilla '+fixed(g.sq)+' kg · Banca '+fixed(g.bp)+' kg</small></div>').join('')+'</div>';
 const actions=state.groupsLocked?'<button class="btn light" id="exportRoster">Exportar nómina CSV</button><button class="btn light" id="exportRosterTeams">Descargar nómina para equipos (JSON)</button><button class="btn danger" id="unlockGroups">Reabrir nómina</button>':'<button class="btn light" id="distributeGroups" '+(ready?'':'disabled')+'>Distribuir automáticamente A/B</button><button class="btn" id="lockGroups" '+(count>0&&count===state.athletes.length?'':'disabled')+'>Confirmar y cerrar nómina</button>';
 return panel('Distribución de grupos A y B','<div class="panelbody">'+stats+'<p class="footnote">'+count+' de '+state.athletes.length+' participantes asignados. El reparto equilibra las cargas iniciales de sentadilla y banca.</p>'+(state.groupsLocked?'<div class="warning">Nómina cerrada. Exporta el CSV para los equipos.</div>':!ready?'<div class="warning">Completa las cargas iniciales de sentadilla y banca de todos (mínimo 20 kg).</div>':'')+'<div class="actions">'+actions+'</div></div>');
}

function render(){document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===view));const main=document.getElementById('main');main.innerHTML=({overview:overview,athletes:athletesPage,lifting:liftingPage,awards:awardsPage,settings:settingsPage,plates:platesPage}[view]||overview)()}
function overview(){const done=state.athletes.flatMap(a=>MOV.flatMap(m=>lifts(a,m[0]).filter((t,i)=>canUseAttempt(a,m[0],i)))).filter(t=>result(t)!=='Pendiente');const stats=[['Inscritos',state.athletes.length],['Escolar Menor',state.athletes.filter(a=>group(a)==='Escolar Menor').length],['Escolar Mayor',state.athletes.filter(a=>group(a)==='Escolar Mayor').length],['Exalumnos',state.athletes.filter(a=>group(a)==='Exalumnos').length]];return header('Panel general','Seguimiento del campeonato y acceso a la mesa de control.')+'<div class="cards">'+stats.map(s=>'<div class="stat"><label>'+s[0]+'</label><strong>'+s[1]+'</strong><small>deportistas</small></div>').join('')+'</div>'+panel('Estado de la competencia','<div class="panelbody"><p><strong>'+done.length+'</strong> intentos evaluados · <strong>'+done.filter(t=>result(t)==='Válido').length+'</strong> válidos · <strong>'+done.filter(t=>result(t)==='Nulo').length+'</strong> nulos.</p><div class="actions"><button class="btn" data-go="athletes">Gestionar inscripciones</button><button class="btn light" data-go="lifting">Mesa de levantamientos</button><button class="btn light" data-go="awards">Ver premiación</button></div></div>')+(state.athletes.length?'':'<div class="warning">No hay deportistas registrados. Puedes inscribirlos uno a uno o cargar la simulación ficticia desde Inscripciones.</div>')}
function athleteForm(){
if(state.groupsLocked)return '<div class="warning">Nómina cerrada: utiliza «Reabrir nómina» para modificar participantes.</div>';
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
function athletesPage(){return header('Inscripciones y pesaje','Registra las cargas iniciales y después distribuye los grupos A y B.')+panel(editing?'Editar deportista':'Nuevo deportista','<div class="panelbody">'+athleteForm()+'</div>')+stationPanel()+panel('Participantes ('+state.athletes.length+')','<div class="panelbody"><div class="actions"><button class="btn light" id="loadDemo" '+(state.groupsLocked?'disabled':'')+'>Cargar 35 participantes ficticios</button><button class="btn light" id="clearAll" '+(state.groupsLocked?'disabled':'')+'>Vaciar inscripciones</button></div></div>'+table(['Deportista / ID','Categoría','Sexo','Peso','División','Inicial SQ / BP','Grupo A/B','Acciones'],state.athletes.map(athleteRow)))}
function voteControls(a,t,j){
 const v=(t.votes||[])[j];
 const short=esc(judgeLabel(j)),full=esc(judgeFullName(j));
 const locked=round===2&&!canUseAttempt(a,movement,round);
 const disabled=locked?' disabled title="Registra primero la carga del intento 2"':'';
 return '<div class="judge-control"><span class="judge-label" title="'+full+'">'+short+'</span><div class="judge-choice" role="group" aria-label="Votación de '+full+'">'+
 '<button type="button" class="judge-vote judge-yes'+(v===true?' is-selected':'')+'" data-judge-vote="'+esc(a.id)+'" data-judge-index="'+j+'" data-vote-choice="true" aria-label="'+full+': Válido" aria-pressed="'+(v===true)+'"'+disabled+'>✓</button>'+
 '<button type="button" class="judge-vote judge-no'+(v===false?' is-selected':'')+'" data-judge-vote="'+esc(a.id)+'" data-judge-index="'+j+'" data-vote-choice="false" aria-label="'+full+': Nulo" aria-pressed="'+(v===false)+'"'+disabled+'>✕</button>'+
 '</div></div>';
}
function liftingPage(){
 let changed=false;
 for(const athlete of state.athletes){if(syncNextLoads(athlete,movement))changed=true}
 if(changed)save();
 const sorted=orderedLifters(),selected=activeLifter(sorted);
 const rows=sorted.map(({a,t},i)=>{const locked=round===2&&!canUseAttempt(a,movement,round);return '<tr class="'+(selected&&a.id===selected.a.id?'lift-current':'')+(locked?' lift-blocked':'')+'"><td><button class="select-lifter '+(selected&&a.id===selected.a.id?'chosen':'')+'" data-current="'+esc(a.id)+'"'+(locked?' disabled title="Registra la carga del intento 2"':'')+'>'+(selected&&a.id===selected.a.id?'● ':'')+(i+1)+'</button></td><td><strong>'+esc(a.name)+'</strong><br><small>'+esc(group(a))+' · '+esc(division(a))+'</small></td><td>'+attemptLoadCell(a,t)+'</td><td class="next-load-column">'+nextLoadCell(a,t)+'</td><td class="vote-cell" colspan="3"><div class="judges-row">'+Array.from({length:judgeCount()},(_,j)=>voteControls(a,t,j)).join('')+'</div></td><td>'+tag(locked?'Bloqueado':result(t),!locked&&result(t)==='Válido'?'good':!locked&&result(t)==='Nulo'?'bad':'')+'</td></tr>'});
 return '<div class="lifting-top"><div class="lifting-info">'+header('Mesa de levantamientos','Selecciona en la columna Orden al deportista en plataforma. El gráfico indica los discos necesarios para su carga.')+
 '<div class="exercise-tabs">'+MOV.map(m=>'<button data-move="'+m[0]+'" class="'+(movement===m[0]?'active':'')+'">'+m[1]+'</button>').join('')+'</div>'+
 stationGroupControls()+
 '<div class="exercise-tabs">'+[0,1,2].map(i=>'<button data-round="'+i+'" class="'+(round===i?'active':'')+'">Intento '+(i+1)+'</button>').join('')+'</div></div>'+
 loadWidget(sorted)+'</div>'+
 (movement==='dl'?'':'<div class="transfer-export"><button type="button" class="btn light" data-export-results="'+movement+'" '+(state.groupsLocked?'':'disabled')+'>Exportar resultados '+movement.toUpperCase()+' (CSV) · Todos los grupos</button><span>Incluye A y B, los tres intentos y las decisiones de los jueces.</span></div>')+
 panel('Orden de salida · '+MOV.find(m=>m[0]===movement)[1]+(selectedStationGroup()==='Todos'?' · Todos los grupos':' · Grupo '+selectedStationGroup())+' · Intento '+(round+1)+' · '+sorted.length+' participantes',table(['En plataforma','Deportista','Carga (kg)','Siguiente carga (kg)','Decisiones de los jueces','','','Resultado'],rows.length?rows:['<tr><td colspan="8" class="station-no-athletes">No hay participantes asignados a este grupo. Selecciona otro grupo o revisa las asignaciones en Inscripciones.</td></tr>']))+
 '<div class="warning">El intento 3 se bloquea para cada deportista hasta registrar la carga del intento 2. En los intentos 2 y 3 se muestra en verde la carga anterior válida y en rojo la nula. Tras un levantamiento válido se propone aumentar 2,5 kg y tras uno nulo se propone repetir la carga. Al terminar la evaluación, el atleta puede indicar una carga mayor en «Siguiente carga», y quedará guardada directamente para su próximo intento. Después de un válido debe aumentar; tras un nulo se permite repetir o aumentar.</div>';
}
function minimumForAttempt(a,m,r){
 if(r<=0)return 20;
 const previous=lifts(a,m)[r-1];
 if(!validLoad(previous))return 20;
 return num(previous.kg)+(result(previous)==='Válido'?NEXT_MIN_INCREASE:0);
}
function suggestedNextLoad(t){
 if(!validLoad(t))return null;
 const status=result(t);
 return status==='Válido'?num(t.kg)+NEXT_DEFAULT_INCREASE:status==='Nulo'?num(t.kg):null;
}
function attemptHasVotes(t){
 return Array.isArray(t.votes)&&t.votes.some(v=>v===true||v===false);
}
function syncNextLoads(a,m){
 const attempts=lifts(a,m);let changed=false;
 for(let i=1;i<3;i++){
  const previous=attempts[i-1],current=attempts[i];
  if(!previous||!current||!validLoad(previous))continue;
  const suggested=suggestedNextLoad(previous);
  if(suggested===null||attemptHasVotes(current))continue;
  const minimum=minimumForAttempt(a,m,i);
  if(!validLoad(current)){
   current.kg=suggested;changed=true;
  }else if(num(current.kg)<minimum){
   current.kg=current.nextLoadManual?minimum:suggested;changed=true;
  }
 }
 return changed;
}
function nextLoadCell(a,t){
 if(round>=2)return '<span class="next-load-final">Último intento</span>';
 if(!canUseAttempt(a,movement,round))return '<span class="next-load-pending">Intento bloqueado</span>';
 const status=result(t);
 if(status!=='Válido'&&status!=='Nulo')return '<span class="next-load-pending">Esperando a los jueces</span>';
 const next=lifts(a,movement)[round+1],minimum=minimumForAttempt(a,movement,round+1);
 const locked=attemptHasVotes(next);
 return '<div class="next-load-cell '+(status==='Válido'?'next-load-valid':'next-load-null')+'">'+
  '<span class="next-load-caption">Intento '+(round+2)+'</span>'+
  '<div class="next-load-entry"><input type="number" class="next-load-input" data-next-kg="'+esc(a.id)+'" aria-label="Carga declarada por '+esc(a.name)+' para el intento '+(round+2)+'" step="0.5" min="'+minimum+'" max="800" value="'+esc(next.kg??'')+'"'+(locked?' disabled title="El siguiente intento ya se ha evaluado"':'')+'><span>kg</span></div>'+
  '<small>'+(locked?'Ya evaluado':status==='Válido'?'Válido · mínimo '+fixed(minimum)+' kg':'Nulo · repetir o aumentar')+'</small>'+
  '</div>';
}
function attemptLoadCell(a,t){
 if(round===2&&!canUseAttempt(a,movement,round)){
  return '<div class="attempt-load-cell"><span class="previous-attempt prior-pending">Intento 2: sin carga</span>'+
   '<div class="attempt-load-input"><input class="compact-input" type="number" disabled aria-label="Intento 3 bloqueado; falta la carga del intento 2" placeholder="—"><span>kg</span></div>'+
   '<span class="attempt-locked-note">Primero registra la carga del intento 2</span></div>';
 }
 const previous=round>0?lifts(a,movement)[round-1]:null;
 const previousStatus=previous?result(previous):'Pendiente';
 const hasPrevious=previous&&num(previous.kg)>0;
 const previousClass=previousStatus==='Válido'?'prior-valid':previousStatus==='Nulo'?'prior-null':'prior-pending';
 const previousText=hasPrevious?'Intento '+round+': '+fixed(previous.kg)+' kg · '+previousStatus:'Intento anterior: sin carga';
 const before=round>0?'<span class="previous-attempt '+previousClass+'">'+esc(previousText)+'</span>':'';
 const minimum=minimumForAttempt(a,movement,round);
 const hint=round>0?'<span class="attempt-minimum">Mínimo: '+fixed(minimum)+' kg</span>':'';
 return '<div class="attempt-load-cell">'+before+
 '<div class="attempt-load-input"><input aria-label="Carga del intento '+(round+1)+' en kilogramos" class="compact-input" data-kg="'+esc(a.id)+'" type="number" min="'+minimum+'" max="800" step=".5" value="'+esc(t.kg??'')+'"><span>kg</span></div>'+
 hint+'</div>';
}

function validLoad(t){return Number.isFinite(Number(t.kg))&&Number(t.kg)>=20}
function selectedStationGroup(){
 const assigned=state.athletes.some(a=>a.stationGroup==='A'||a.stationGroup==='B');
 return assigned?(stationFilters[movement]||'Todos'):'Todos';
}
function stationVisible(a){
 const g=selectedStationGroup();
 return g==='Todos'||a.stationGroup===g;
}
function stationStageLabel(){
 const g=selectedStationGroup();
 if(movement==='dl')return 'Etapa 3 · Peso muerto · '+(g==='Todos'?'Grupos A + B':'Grupo '+g);
 if(g==='Todos')return 'Sentadilla y banca · Vista general';
 const first=(movement==='sq'&&g==='A')||(movement==='bp'&&g==='B');
 return (first?'Etapa 1':'Etapa 2')+' · '+(movement==='sq'?'Sentadilla':'Press banca')+' · Grupo '+g;
}
function stationGroupControls(){
 const assigned=state.athletes.filter(a=>a.stationGroup==='A'||a.stationGroup==='B').length;
 const selected=selectedStationGroup();
 const count=state.athletes.filter(stationVisible).length;
 const options=['A','B','Todos'].map(g=>{
  const n=g==='Todos'?state.athletes.length:state.athletes.filter(a=>a.stationGroup===g).length;
  const label=g==='Todos'?'Todos los grupos':'Grupo '+g;
  return '<option value="'+g+'"'+(selected===g?' selected':'')+'>'+label+' ('+n+')</option>';
 }).join('');
 const info=assigned===0?
  '<p class="footnote station-filter-note">Aún no hay grupos asignados. Se muestra la nómina completa; distribuye A/B desde Inscripciones.</p>':
  assigned<state.athletes.length?
  '<p class="footnote station-filter-note">Hay '+(state.athletes.length-assigned)+' deportistas sin grupo. Usa «Todos los grupos» para verlos.</p>':'';
 return '<div class="station-filter station-filter-select"><div class="station-filter-heading"><strong>Seleccionar participantes por grupo</strong><span>'+esc(stationStageLabel())+'</span></div>'+
  '<div class="station-filter-line"><label class="field" for="stationGroupSelect">Grupo de competencia'+
  '<select id="stationGroupSelect" aria-label="Seleccionar grupo de la prueba '+esc(MOV.find(m=>m[0]===movement)[1])+'">'+options+'</select></label>'+
  '<div class="station-filter-count"><strong>'+count+'</strong><span>'+ (count===1?'participante':'participantes')+' · intento '+(round+1)+'</span></div></div>'+info+'</div>';
}
function orderedLifters(){return state.athletes.filter(stationVisible).map(a=>({a,t:lifts(a,movement)[round]})).sort((x,y)=>(validLoad(x.t)?num(x.t.kg):Infinity)-(validLoad(y.t)?num(y.t.kg):Infinity)||x.a.name.localeCompare(y.a.name,'es'))}
function activeLifter(sorted){const available=sorted.filter(x=>canUseAttempt(x.a,movement,round));const chosen=available.find(x=>x.a.id===activeLifterId);if(chosen)return chosen;return available.find(x=>validLoad(x.t)&&result(x.t)==='Pendiente')||available.find(x=>validLoad(x.t))||null}
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
 // Se muestra un solo extremo de la barra; de izquierda a derecha, menor a mayor.
 const ordered=[...plan.plates].sort((a,b)=>Number(a.kg)-Number(b.kg));
 const discs=ordered.map(p=>{
   const kg=Number(p.kg);
   return {
     kg,
     width:Math.round(20+kg/25*11),
     height:Math.round(54+kg/25*90),
     fill:String(p.color||'#64748b').match(/^#[0-9a-fA-F]{6}$/)?.[0]||'#64748b'
   };
 });
 const gap=4;
 const groupWidth=discs.reduce((sum,d)=>sum+d.width,0)+Math.max(0,discs.length-1)*gap;
 // Marco adaptable: se agranda si hay muchos discos, sin cortarlos.
 const width=Math.max(480,Math.ceil(groupWidth+130));
 const midY=112,collarX=width-37,discEnd=collarX-7;
 let x=discEnd-groupWidth;
 let rects='';
 for(const d of discs){
   const y=midY-d.height/2;
   const rgb=parseInt(d.fill.slice(1),16);
   const luma=0.2126*((rgb>>16)&255)+0.7152*((rgb>>8)&255)+0.0722*(rgb&255);
   const textColor=luma>160?'#1a293e':'#ffffff';
   const fontSize=d.kg<2.5?'9':'12';
   rects+='<rect x="'+x+'" y="'+y+'" rx="3" width="'+d.width+'" height="'+d.height+'" fill="'+d.fill+'" stroke="#354357" stroke-width="1.4"/>'+
          '<text x="'+(x+d.width/2)+'" y="'+(midY+4)+'" text-anchor="middle" fill="'+textColor+'" font-size="'+fontSize+'" font-weight="800">'+fixed(d.kg)+'</text>';
   x+=d.width+gap;
 }
 return '<svg role="img" aria-label="Discos por lado ordenados de menor a mayor hacia la derecha" viewBox="0 0 '+width+' 205" xmlns="http://www.w3.org/2000/svg">'+
  '<rect x="20" y="'+(midY-5)+'" width="'+(width-29)+'" height="10" rx="5" fill="#8191a7"/>'+
  '<rect x="28" y="'+(midY-14)+'" width="15" height="28" rx="4" fill="#46586f"/>'+
  rects+
  '<rect x="'+collarX+'" y="'+(midY-23)+'" width="14" height="46" rx="4" fill="#4b5d75"/>'+
  '<text x="20" y="191" fill="#718096" font-size="13">Barra: 20 kg</text>'+
  '<text x="'+(width-15)+'" y="191" text-anchor="end" fill="#718096" font-size="13">'+fixed(plan.side)+' kg por lado</text></svg>';
}
function loadWidget(sorted){
 const selected=activeLifter(sorted);
 const load=selected?num(selected.t.kg):0;
 const plan=platePlan(load);
 return '<div class="load-widget"><div class="load-title"><span>CONFIGURACIÓN DE BARRA</span><button class="btn tiny light" data-go="plates">Editar discos</button></div>'+
 '<div class="load-weight">'+(selected&&load>=20?fixed(load)+' <small>kg</small>':'Sin carga')+'</div>'+
 '<div class="load-athlete">'+(selected?esc(selected.a.name)+' · Intento '+(round+1):'Selecciona un levantador')+'</div>'+
 plateGraphic(plan)+
 '<div class="load-caption">Discos de un lado de la barra; cargar el lado opuesto de forma simétrica.</div></div>';
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
function stationReviewPanel(){
 const assigned=state.athletes.filter(a=>a.stationGroup==='A'||a.stationGroup==='B').length;
 const status=state.groupsLocked?'Nómina confirmada · Grupos cerrados':'Distribución en revisión · Grupos editables desde Inscripciones';
 const card=(stage,sq,bp)=>'<div class="station-rotation-card"><strong>'+stage+'</strong>'+
  '<div><span>Tarima SQ · Sentadilla</span><b>Grupo '+sq+'</b></div>'+
  '<div><span>Tarima BP · Press banca</span><b>Grupo '+bp+'</b></div></div>';
 const rotations='<div class="station-rotation-grid">'+card('Etapa 1','A','B')+card('Etapa 2','B','A')+'</div>'+
  '<div class="station-deadlift-info">Etapa 3 · Peso muerto: <strong>una sola tarima, grupos A + B</strong></div>';
 const roster=g=>{
  const athletes=state.athletes.filter(a=>a.stationGroup===g).sort((a,b)=>a.name.localeCompare(b.name,'es'));
  const body=athletes.map(a=>'<tr><td>'+esc(athleteCode(a))+'</td><td><strong>'+esc(a.name)+'</strong></td><td>'+esc(group(a))+'</td><td>'+fixed(a.weight)+' kg</td><td>'+fixed(initial(a,'sq'))+' kg</td><td>'+fixed(initial(a,'bp'))+' kg</td></tr>');
  return '<div class="station-roster"><div class="station-roster-title"><strong>Grupo '+g+'</strong><span>'+athletes.length+' deportistas · SQ '+fixed(athletes.reduce((n,a)=>n+initial(a,'sq'),0))+' kg · BP '+fixed(athletes.reduce((n,a)=>n+initial(a,'bp'),0))+' kg</span></div>'+
    (body.length?table(['ID','Deportista','Categoría','Peso','SQ inicial','BP inicial'],body):'<p class="footnote station-empty">Sin participantes asignados a este grupo.</p>')+'</div>';
 };
 return panel('Tarimas SQ / BP · Revisión de grupos',
  '<div class="panelbody"><div class="station-review-intro"><div><strong>'+esc(status)+'</strong><p class="footnote">'+assigned+' de '+state.athletes.length+' deportistas asignados a un grupo.</p></div><button class="btn light" data-go="athletes">Gestionar grupos en Inscripciones</button></div>'+
  rotations+'<div class="station-roster-list">'+roster('A')+roster('B')+'</div></div>');
}
function settingsPage(){
 const s=state.settings;
 const weights=panel('Cortes de peso (kg)','<div class="panelbody"><form id="settingsForm" class="formgrid">'+[['femaleMinor','Escolar Menor · Mujeres'],['maleMinor','Escolar Menor · Hombres'],['femaleMajor','Escolar Mayor · Mujeres'],['maleMajor','Escolar Mayor · Hombres']].map(x=>'<label class="field">'+x[1]+'<input name="'+x[0]+'" type="number" min="1" step=".1" required value="'+s[x[0]]+'"></label>').join('')+'<div class="formactions"><button class="btn">Guardar límites</button></div></form></div>');
 const judges=panel('Jueces de la competencia','<div class="panelbody"><form id="judgesForm" class="judges-config-form">'+
 '<label class="field judges-count-label">Cantidad de jueces<select name="judgeCount" id="judgeCount">'+
 Array.from({length:MAX_JUDGES},(_,i)=>'<option value="'+(i+1)+'" '+(judgeCount()===i+1?'selected':'')+'>'+(i+1)+' juez'+(i?'es':'')+'</option>').join('')+
 '</select></label><p class="footnote">Registra nombre y apellido. En la mesa se verán las iniciales, por ejemplo: J. A.H.</p>'+
 '<div class="judge-entries">'+Array.from({length:MAX_JUDGES},(_,i)=>'<div class="judge-entry" data-judge-entry="'+i+'" '+(i>=judgeCount()?'hidden':'')+'>'+
 '<span class="judge-entry-number">Juez '+(i+1)+'</span>'+
 '<label class="field">Nombre<input name="judge_first_'+i+'" maxlength="70" placeholder="Ej. Alejandro" value="'+esc(state.judges?.[i]?.first||'')+'"></label>'+
 '<label class="field">Apellido<input name="judge_last_'+i+'" maxlength="70" placeholder="Ej. Huentelican" value="'+esc(state.judges?.[i]?.last||'')+'"></label>'+
 '<span class="judge-preview">'+esc(judgeLabel(i))+'</span></div>').join('')+'</div>'+
 '<div class="judges-actions"><button class="btn" type="submit">Guardar jueces</button></div></form></div>');
 return header('Configuración','Revisa los grupos de cada tarima y gestiona las categorías de peso y los jueces.')+
 stationReviewPanel()+liftTransferPanel()+weights+judges+
 '<div class="warning">Modificar la cantidad de jueces cambia la mayoría necesaria y puede actualizar resultados anteriores. Los votos originales se conservan en el respaldo local. Si se usan números pares de jueces, un empate se mostrará como tal y no se contabilizará como levantamiento válido.</div>'+
 '<div class="warning">Exalumnos no tienen divisiones de peso ni clasificación separada por sexo. Su premiación es abierta y utiliza exclusivamente el índice relativo.</div>';
}
function demo(){const names=['Agustín Vera','Joaquín Carrasco','Tomás Alarcón','Sebastián Soto','Benjamín Díaz','Mateo Torres','Antonia Aguilera','Valentina Rojas','Felipe Muñoz','Vicente Ruiz','Martina León','Ignacio Morales','Diego Valdés','Matías Vega','Lucas Riquelme','Francisca Silva','Camila Hernández','Nicolás Oyarzún','Javier Molina','Emilio Fuentes','Isidora Paredes','Cristóbal Andrade','Joaquín Pérez','Sofía Morales','Gabriel Castro','Francisco Cárcamo','Daniel Muñoz','Esteban Muñoz','Rodrigo Aguilar','Pablo Salinas','Andrés Bravo','Paula Vidal','Mauricio Núñez','Felipe Herrera','Carolina Silva'];const female=new Set([6,7,10,15,16,20,23,31]);state.groupsLocked=false;state.athletes=names.map((name,i)=>{let a={id:'demo-'+(i+1),name,group:i<12?'Escolar Menor':i<25?'Escolar Mayor':'Exalumnos',sex:female.has(i)?'F':'M',weight:Math.round((female.has(i)?47:57)+(i*11%43)+(i%3)*.7),lifts:newLifts()};MOV.forEach((m,k)=>{const base=Math.round((a.weight*(k===1?.65:k===2?1.25:1.05)+i%7*2)/2.5)*2.5;lifts(a,m[0]).forEach((t,j)=>{t.kg=base+j*2.5;t.votes=[true,true,(i+j+k)%5!==0]})});return a});save();render()}
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.id==='distributeGroups'){if(state.groupsLocked)return;if(state.athletes.some(a=>a.stationGroup)&&!confirm('¿Recalcular los grupos y sustituir asignaciones manuales?'))return;try{distributeGroups();save();render()}catch(err){alert(err.message)}return}
else if(b.id==='lockGroups'){if(state.groupsLocked)return;if(!state.athletes.length||state.athletes.some(a=>!['A','B'].includes(a.stationGroup))){alert('Asigna A o B a todos los participantes.');return}if(!confirm('¿Confirmar grupos y cerrar inscripciones?'))return;ensureIds();state.groupsLocked=true;save();render();return}
else if(b.id==='unlockGroups'){if(!state.groupsLocked)return;if(!confirm('¿Reabrir inscripciones y grupos?'))return;state.groupsLocked=false;save();render();return}
else if(b.id==='exportRoster'){rosterCsv();return}
else if(b.id==='exportRosterTeams'){exportRosterForTeams();return}
else if(b.dataset.exportResults!==undefined){exportLiftResults(b.dataset.exportResults);return}
else if(b.dataset.importResults!==undefined){const move=b.dataset.importResults;if(!['sq','bp'].includes(move))return;const file=document.getElementById('importLiftFile');file.dataset.movement=move;file.value='';file.click();return}
else if(b.dataset.judgeVote!==undefined){const a=state.athletes.find(a=>a.id===b.dataset.judgeVote);if(!a)return;if(!canUseAttempt(a,movement,round)){alert('Registra primero la carga del intento 2 para habilitar el intento 3.');return}const t=lifts(a,movement)[round];const j=Number(b.dataset.judgeIndex),choice=b.dataset.voteChoice==='true';if(!Array.isArray(t.votes))t.votes=[null,null,null];if(!Number.isInteger(j)||j<0||j>=judgeCount())return;
 const before=result(t);
 t.votes[j]=t.votes[j]===choice?null:choice;
 const after=result(t);
 syncNextLoads(a,movement);
 save();render();
 if(round<2&&before!==after&&(after==='Válido'||after==='Nulo')){
  const el=Array.from(document.querySelectorAll('[data-next-kg]')).find(x=>x.dataset.nextKg===a.id&&!x.disabled);
  if(el){el.focus({preventScroll:true});el.select()}
 }
}else if(b.dataset.view){view=b.dataset.view;editing=null;render()}else if(b.dataset.go){view=b.dataset.go;render()}else if(b.dataset.move){movement=b.dataset.move;activeLifterId=null;render()}else if(b.dataset.round){round=+b.dataset.round;activeLifterId=null;render()}else if(b.dataset.current){const a=state.athletes.find(a=>a.id===b.dataset.current);if(!a||!canUseAttempt(a,movement,round))return;activeLifterId=b.dataset.current;render()}else if(b.dataset.edit){if(state.groupsLocked)return;editing=b.dataset.edit;render()}else if(b.dataset.remove){if(state.groupsLocked)return;if(confirm('¿Eliminar participante y todos sus intentos?')){state.athletes=state.athletes.filter(a=>a.id!==b.dataset.remove);save();render()}}else if(b.id==='cancelEdit'){editing=null;render()}else if(b.id==='resetPlates'){if(confirm('¿Restablecer los pares y colores de ejemplo?')){state.plates=DEFAULT_PLATES.map(p=>({...p}));save();render()}}else if(b.id==='loadDemo'){if(state.groupsLocked)return;if(confirm('¿Reemplazar las inscripciones actuales por una simulación con 35 deportistas ficticios?'))demo()}else if(b.id==='clearAll'){if(state.groupsLocked)return;if(confirm('¿Eliminar permanentemente las inscripciones de este navegador?')){state.athletes=[];save();render()}}else if(b.id==='exportJSON'){const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='respaldo-powerlifting-2026.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}else if(b.id==='importJSON'){document.getElementById('importFile').click()}});
document.addEventListener('submit',e=>{e.preventDefault();const f=e.target,d=new FormData(f);if(f.id==='athleteForm'){if(state.groupsLocked)return;const name=String(d.get('name')||'').trim(),weight=Number(d.get('weight'));if(!name||weight<=0)return;let a=state.athletes.find(a=>a.id===editing);if(!a){a={id:'ath-'+Date.now()+'-'+Math.random().toString(36).slice(2),lifts:newLifts()};state.athletes.push(a)}Object.assign(a,{name,weight,group:String(d.get('group')),sex:String(d.get('sex'))});for(const m of MOV){const initial=Number(d.get('initial_'+m[0]));if(!Number.isFinite(initial)||initial<=0)return;lifts(a,m[0])[0].kg=initial}editing=null}else if(f.id==='settingsForm'){for(const k of Object.keys(state.settings))state.settings[k]=Number(d.get(k))||state.settings[k]}
else if(f.id==='judgesForm'){
 state.judgeCount=Math.max(1,Math.min(MAX_JUDGES,Math.floor(Number(d.get('judgeCount'))||3)));
 state.judges=DEFAULT_JUDGES().map((j,i)=>({
  first:String(d.get('judge_first_'+i)||'').trim().slice(0,70),
  last:String(d.get('judge_last_'+i)||'').trim().slice(0,70)
 }));
}
save();render()});
document.addEventListener('change',e=>{const x=e.target;if(x.id==='stationGroupSelect'){const g=x.value;if(!['A','B','Todos'].includes(g))return;stationFilters[movement]=g;activeLifterId=null;render();return}else if(x.dataset.stationGroup!==undefined){if(state.groupsLocked)return;const a=state.athletes.find(a=>a.id===x.dataset.stationGroup);if(!a)return;a.stationGroup=['A','B'].includes(x.value)?x.value:'';save();render();return}else if(x.id==='judgeCount'){
 const n=Math.max(1,Math.min(MAX_JUDGES,Math.floor(Number(x.value)||3)));
 document.querySelectorAll('[data-judge-entry]').forEach(el=>{el.hidden=Number(el.dataset.judgeEntry)>=n});
}else if(x.dataset.pairs!==undefined||x.dataset.color!==undefined){const i=Number(x.dataset.pairs??x.dataset.color);const p=state.plates[i];if(!p)return;if(x.dataset.pairs!==undefined)p.pairs=Math.max(0,Math.min(100,Math.floor(Number(x.value)||0)));else if(/^#[a-fA-F0-9]{6}$/.test(x.value))p.color=x.value;save();render()}else if(x.dataset.nextKg!==undefined){
 const a=state.athletes.find(a=>a.id===x.dataset.nextKg);
 if(!a||round>=2)return;
 const current=lifts(a,movement)[round],next=lifts(a,movement)[round+1];
 if(!['Válido','Nulo'].includes(result(current))||attemptHasVotes(next)){render();return}
 const minimum=minimumForAttempt(a,movement,round+1);
 const kg=Number(x.value);
 if(!x.value.trim()||!Number.isFinite(kg)||kg<minimum||kg>800||Math.abs(kg*2-Math.round(kg*2))>1e-6){
  alert('La carga del intento '+(round+2)+' debe ser al menos '+fixed(minimum)+' kg, como máximo 800 kg y en incrementos de 0,5 kg.');
  render();return;
 }
 next.kg=kg;
 next.nextLoadManual=true;
 syncNextLoads(a,movement);
 save();render();
}else if(x.dataset.kg||x.dataset.vote){const a=state.athletes.find(a=>a.id===(x.dataset.kg||x.dataset.vote));if(!a)return;const t=lifts(a,movement)[round];if(!canUseAttempt(a,movement,round)){alert('Registra primero la carga del intento 2 para habilitar el intento 3.');render();return}if(x.dataset.kg){
  const min=minimumForAttempt(a,movement,round);
  const requested=x.value===''?null:Number(x.value);
  if(requested!==null&&(!Number.isFinite(requested)||requested<min)){
    alert('La carga mínima para el intento '+(round+1)+' es '+fixed(min)+' kg. No se puede reducir el peso del intento anterior.');
    t.kg=min;
  }else if(requested===null&&round>0&&num(lifts(a,movement)[round-1].kg)>=20){
    t.kg=min;
  }else t.kg=requested;
  syncNextLoads(a,movement);
 }else t.votes[+x.dataset.judge]=x.value===''?null:x.value==='true';
 save();render()}else if(x.id==='importLiftFile'){
 const f=x.files?.[0],m=x.dataset.movement;
 if(!f)return;
 f.text().then(content=>{
  try{
   if(f.size>5*1024*1024)throw Error('El archivo CSV excede 5 MB.');
   const prepared=prepareLiftResultsImport(content,m);
   const movementName=m==='sq'?'sentadilla':'press banca';
   if(!confirm('Se importarán '+prepared.count+' deportistas y '+prepared.attempts+' intentos de '+movementName+'.\n\nSolo se reemplazarán los resultados de esta prueba; la nómina y los otros movimientos quedarán intactos.\n\n¿Confirmar importación de '+f.name+'?'))return;
   applyLiftResultsImport(prepared);save();activeLifterId=null;render();
   alert('Resultados de '+movementName+' importados correctamente para '+prepared.count+' deportistas.');
  }catch(err){alert('No se importó ningún resultado: '+err.message)}
 }).finally(()=>{x.value=''});
}else if(x.id==='importFile'){const file=x.files?.[0];if(!file)return;file.text().then(s=>{try{const d=JSON.parse(s);if(!Array.isArray(d.athletes)||!d.settings)throw Error('Formato incorrecto');if(!confirm('¿Reemplazar todos los datos locales por el respaldo?'))return;state=normalizeJudges(d);state.plates=normalizePlates(state.plates);save();render()}catch(err){alert('No se pudo importar: '+err.message)}finally{x.value=''}})}});
render();