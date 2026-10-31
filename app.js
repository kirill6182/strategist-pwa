'use strict';
const KEY='strategist:v1',$=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=()=>Math.random().toString(36).slice(2,10);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const today=()=>new Date(Date.now()-new Date().getTimezoneOffset()*6e4).toISOString().slice(0,10);
const buzz=p=>{try{navigator.vibrate&&navigator.vibrate(p)}catch(e){}};

/* ---------- данные ---------- */
const st=(name,icon,value,hint)=>({id:uid(),name,icon,value,hint});
const ef=(name,description='')=>({id:uid(),name,description});
const demo=()=>({name:'Алекс',className:'Стратег',level:1,xp:0,
  stats:[st('Дисциплина','🛡️',6,'Делать нужное, даже когда не хочется. Даёт стабильность.'),
    st('Энергия','⚡',5,'Силы тела и головы. Даёт запас хода.'),
    st('Фокус','🎯',4,'Удержание внимания на одной задаче. Даёт скорость.'),
    st('Эмоц. устойчивость','🧘',5,'Спокойствие под давлением. Даёт ясные решения.'),
    st('Коммуникация','💬',7,'Умение договариваться. Даёт союзников.'),
    st('Стратег. мышление','♟️',6,'Видеть картину целиком. Даёт верные приоритеты.')],
  buffs:[ef('Утренняя прогулка','+энергия на весь день'),ef('Поддержка команды')],
  debuffs:[ef('Недосып','−фокус, −устойчивость'),ef('Бесконечная лента новостей')],
  strengths:['Быстро учусь','Умею слушать','Не боюсь сложных задач'],
  weaknesses:['Откладываю неприятное','Берусь за всё сразу'],
  mission:{goal:'Запустить личный проект до конца квартала',successCriteria:'Рабочая версия у 5 пользователей',reward:'Неделя отпуска без ноутбука'},
  diary:[{id:uid(),date:today(),event:'Сорвался дедлайн из-за мультизадачности',statDelta:'Фокус -1',effect:'Дебафф: перегрузка'}]});

function normalize(d){
  if(!d||typeof d!=='object')throw new Error('неверный формат файла');
  const name=String(d.name||'').trim();
  if(!name)throw new Error('имя не может быть пустым');
  if(!Array.isArray(d.stats)||!d.stats.length)throw new Error('нет статов');
  const eff=a=>(Array.isArray(a)?a:[]).map(e=>({id:String(e.id||uid()),name:String(e.name),description:String(e.description||'')}));
  const lst=a=>(Array.isArray(a)?a:[]).map(String);
  const m=d.mission||{};
  return {name,className:String(d.className||'Стратег'),level:clamp(Math.round(+d.level)||1,1,1e6),xp:clamp(Math.round(+d.xp)||0,0,99),
    stats:d.stats.map(s=>({id:String(s.id||uid()),name:String(s.name),icon:String(s.icon||'⭐'),value:clamp(Math.round(+s.value)||5,1,10),hint:String(s.hint||'')})),
    buffs:eff(d.buffs),debuffs:eff(d.debuffs),strengths:lst(d.strengths),weaknesses:lst(d.weaknesses),
    mission:{goal:String(m.goal||''),successCriteria:String(m.successCriteria||''),reward:String(m.reward||'')},
    diary:(Array.isArray(d.diary)?d.diary:[]).map(e=>({id:String(e.id||uid()),date:String(e.date||''),event:String(e.event),statDelta:String(e.statDelta||''),effect:String(e.effect||'')}))};
}
function load(){try{const r=localStorage.getItem(KEY);return r?normalize(JSON.parse(r)):demo()}catch(e){return demo()}}
let S=load();
function save(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){toast('Не удалось сохранить: память браузера недоступна')}}

/* ---------- отрисовка ---------- */
const KINDS={buffs:['✨ Баффы','Добавь свой первый бафф','✨',1],debuffs:['⚠️ Дебаффы','Пока пусто. Отметь, что тебя тормозит','⚠️',1],
  strengths:['✅ Сильные стороны','Запиши первую сильную сторону','✅',0],weaknesses:['❌ Слабые стороны','Назови первую слабую сторону','❌',0]};
function paintXP(){$('#lvl').textContent='LVL '+S.level;$('#xpfill').style.width=S.xp+'%';$('#xptxt').textContent='XP '+S.xp+'/100'}
function drawHead(){$('#name').value=S.name;$('#cls').textContent='♟️ '+S.className;paintXP()}
const segs=v=>Array.from({length:10},(_,i)=>`<i class="${i<v?'on':''}"></i>`).join('');
function drawStats(){
  $('#stats').innerHTML='<h2>📊 Базовые статы</h2><p class="hint">Нажми на стат, чтобы добавить 1. Долгое нажатие (или правый клик) убирает 1.</p><div class="grid">'
  +S.stats.map(s=>`<div class="stat" role="button" tabindex="0" data-id="${s.id}" title="${esc(s.hint)}"><div class="top"><span>${esc(s.icon)} ${esc(s.name)}</span><b class="mono">${s.value}<small>/10</small></b></div><div class="segs">${segs(s.value)}</div><small>${esc(s.hint)}</small></div>`).join('')+'</div>';
}
function bump(id,d){
  const s=S.stats.find(x=>x.id===id);if(!s)return;
  const v=clamp(s.value+d,1,10);if(v===s.value){buzz(30);return}
  s.value=v;save();const el=document.querySelector(`.stat[data-id="${id}"]`);
  if(el){el.querySelector('b').firstChild.nodeValue=v;el.querySelectorAll('.segs i').forEach((x,i)=>x.classList.toggle('on',i<v))}
  buzz(12);
}
function drawKind(k){
  const [t,e,ic,fx]=KINDS[k],a=S[k],del=i=>`<button class="ico" data-act="del" data-k="${k}" data-i="${i}" aria-label="Удалить">✕</button>`;
  $('#'+k).innerHTML=`<h2>${t}</h2>`+(a.length?'':`<div class="empty"><b>${ic}</b>${e}</div>`)
  +a.map((x,i)=>fx?`<div class="item ${k}"><div><b>${esc(x.name)}</b>${x.description?`<small>${esc(x.description)}</small>`:''}</div>${del(i)}</div>`
    :`<div class="item ${k}"><input value="${esc(x)}" data-k="${k}" data-i="${i}" aria-label="${t}" maxlength="80">${del(i)}</div>`).join('')
  +`<form class="add" data-f="${k}"><input name="a" placeholder="Новая запись" maxlength="80" required>${fx?'<input name="b" placeholder="Описание (необязательно)" maxlength="120">':''}<button class="pri">＋ Добавить</button></form>`;
}
function drawMission(){
  const m=S.mission;
  $('#mission').innerHTML=`<h2>🎯 Текущая миссия</h2><label>Цель<textarea data-m="goal" rows="2">${esc(m.goal)}</textarea></label><label>Критерий «выполнено»<input data-m="successCriteria" value="${esc(m.successCriteria)}"></label><label>Награда<input data-m="reward" value="${esc(m.reward)}"></label>`;
}
function drawDiary(){
  const rows=[...S.diary].sort((a,b)=>b.date.localeCompare(a.date));
  $('#diary').innerHTML='<h2>📅 Дневник стратега</h2>'+(rows.length
    ?`<div class="tw"><table><tr><th>Дата</th><th>Событие</th><th>Стат ±</th><th>Бафф / дебафф</th><th></th></tr>${rows.map(d=>`<tr><td class="mono">${esc(d.date)}</td><td>${esc(d.event)}</td><td class="mono">${esc(d.statDelta)}</td><td>${esc(d.effect)}</td><td><button class="ico" data-act="deld" data-id="${d.id}" aria-label="Удалить запись">✕</button></td></tr>`).join('')}</table></div>`
    :'<div class="empty"><b>📜</b>Запиши первое событие</div>')
  +`<form class="add dform" data-f="diary"><input type="date" name="date" value="${today()}" required><input name="event" placeholder="Событие от третьего лица" maxlength="160" required><select name="stat" aria-label="Стат"><option value="">Стат не меняется</option>${S.stats.map(s=>`<option value="${s.id}">${esc(s.icon)} ${esc(s.name)}</option>`).join('')}</select><select name="delta" aria-label="Изменение">${[-3,-2,-1,1,2,3].map(n=>`<option ${n==1?'selected':''}>${n>0?'+'+n:n}</option>`).join('')}</select><input name="effect" placeholder="Бафф или дебафф" maxlength="80"><button class="pri">＋ Записать</button></form>`;
}
function drawAll(){drawHead();drawStats();Object.keys(KINDS).forEach(drawKind);drawMission();drawDiary()}

/* ---------- события ---------- */
let tt;function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),2800)}
$('#name').addEventListener('change',e=>{const v=e.target.value.trim();if(!v){e.target.value=S.name;toast('Имя не может быть пустым');return}S.name=v;save()});
document.addEventListener('change',e=>{
  const t=e.target;
  if(t.dataset.m){S.mission[t.dataset.m]=t.value.trim();save()}
  else if(t.dataset.i!==undefined&&t.dataset.k){const v=t.value.trim(),k=t.dataset.k,i=+t.dataset.i;if(v)S[k][i]=v;else{S[k].splice(i,1);drawKind(k)}save()}
});
document.addEventListener('submit',e=>{
  e.preventDefault();const f=e.target,k=f.dataset.f,d=new FormData(f);
  if(k==='diary'){
    const ev=d.get('event').trim();if(!ev){toast('Опиши событие');return}
    let sd='—';const s=S.stats.find(x=>x.id===d.get('stat')),dl=parseInt(d.get('delta'),10);
    if(s){sd=`${s.name} ${dl>0?'+':''}${dl}`;bump(s.id,dl)}
    S.diary.push({id:uid(),date:d.get('date'),event:ev,statDelta:sd,effect:(d.get('effect')||'').trim()});save();drawDiary();return;
  }
  const a=d.get('a').trim();if(!a){toast('Пустую запись добавить нельзя');return}
  S[k].push(KINDS[k][3]?{id:uid(),name:a,description:(d.get('b')||'').trim()}:a);save();drawKind(k);
});
document.addEventListener('click',e=>{
  const b=e.target.closest('[data-act]');if(!b)return;const a=b.dataset.act;
  if(a==='xp'){S.xp+=5+Math.floor(Math.random()*6);if(S.xp>=100){S.level++;S.xp=0;toast('Новый уровень: '+S.level+' 🎉');buzz([30,40,30])}save();paintXP()}
  else if(a==='del'){S[b.dataset.k].splice(+b.dataset.i,1);save();drawKind(b.dataset.k)}
  else if(a==='deld'){S.diary=S.diary.filter(x=>x.id!==b.dataset.id);save();drawDiary()}
  else if(a==='settings')$('#dlg').showModal();
  else if(a==='close')$('#dlg').close();
  else if(a==='export'){const l=document.createElement('a');l.href=URL.createObjectURL(new Blob([JSON.stringify(S,null,2)],{type:'application/json'}));l.download=`strategist_${today()}.json`;l.click();setTimeout(()=>URL.revokeObjectURL(l.href),1e3)}
  else if(a==='import')$('#file').click();
  else if(a==='reset'&&confirm('Сбросить персонажа к демо-данным? Текущие данные будут удалены.')){S=demo();save();drawAll();$('#dlg').close();toast('Демо-данные восстановлены')}
  else if(a==='install'&&deferred){deferred.prompt();deferred=null;b.hidden=true}
});
$('#file').addEventListener('change',e=>{
  const f=e.target.files[0];if(!f)return;const r=new FileReader();
  r.onload=()=>{try{S=normalize(JSON.parse(r.result));save();drawAll();toast('Импорт выполнен')}catch(x){toast('Не удалось импортировать: '+x.message)}};
  r.readAsText(f);e.target.value='';
});

/* статы: клик +1, долгое нажатие / правый клик −1, клавиатура: Enter/+ и − */
let lp,fired=false,cur=null,ptype='mouse';
document.addEventListener('pointerdown',e=>{
  ptype=e.pointerType;const el=e.target.closest('.stat');if(!el||e.button===2)return;
  cur=el;fired=false;clearTimeout(lp);
  if(ptype!=='mouse')lp=setTimeout(()=>{fired=true;bump(el.dataset.id,-1)},500);
});
document.addEventListener('pointerup',e=>{
  clearTimeout(lp);const el=e.target.closest('.stat');
  if(el&&el===cur&&!fired&&e.button===0)bump(el.dataset.id,1);cur=null;
});
document.addEventListener('pointercancel',()=>{clearTimeout(lp);cur=null});
document.addEventListener('contextmenu',e=>{const el=e.target.closest('.stat');if(!el)return;e.preventDefault();if(ptype==='mouse')bump(el.dataset.id,-1)});
document.addEventListener('keydown',e=>{
  const el=e.target.closest&&e.target.closest('.stat');if(!el)return;
  if(['Enter',' ','+'].includes(e.key)){e.preventDefault();bump(el.dataset.id,1)}
  else if(['-','Backspace'].includes(e.key)){e.preventDefault();bump(el.dataset.id,-1)}
});

/* установка как приложение + офлайн */
let deferred;
addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferred=e;$('#inst').hidden=false});
if('serviceWorker' in navigator)addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));

drawAll();
