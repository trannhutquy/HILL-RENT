// ====== BACKEND TIỀN TRỌ - NHIỀU PHÒNG ======
// Dán vào: Sheet > Tiện ích mở rộng > Apps Script. Mỗi phòng có một mã riêng (không còn KEY chung).
const TZ = 'GMT+7';
const HEAD = ['id','name','total','payer','mode','val','date','note','room','period'];

function sheet_(n, head, txt){
  const ss = SpreadsheetApp.getActive(); let s = ss.getSheetByName(n);
  if(!s){ s = ss.insertSheet(n); s.appendRow(head); (txt||[]).forEach(c=>s.getRange(c+':'+c).setNumberFormat('@')); s.setFrozenRows(1); }
  return s;
}
const dat_ = () => sheet_('DuLieu', HEAD, ['A','G','H','I','J']);
const his_ = () => sheet_('LichSu', ['room','pid','label','closed','n0','n1','count','total','o0','o1'], ['A','B','C','D']);
const rem_ = () => sheet_('NhacHen', ['id','title','type','val','time','bal','on','last','room'], ['A','D','E','H','I']);
const tok_ = () => sheet_('Tokens', ['dev','token','ts','room'], ['D']);
const rom_ = () => sheet_('Phong', ['room','month','n0','n1','created'], ['A','B']);

function out_(o){ return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function day_(v){ return v instanceof Date ? Utilities.formatDate(v,TZ,'yyyy-MM-dd') : String(v); }
function tm_(v){ return v instanceof Date ? Utilities.formatDate(v,TZ,'HH:mm') : String(v); }
function money_(n){ return String(Math.round(+n||0)).replace(/\B(?=(\d{3})+(?!\d))/g,'.')+' đ'; }
const chr_ = () => sheet_('TrucNhat', ['id','title','every','start','who0','time','notify','last','doneKey','doneBy','cnt0','cnt1','room'], ['A','D','F','H','I','M']);
function dnum_(s){ const p=String(s).split('-'); return Date.UTC(+p[0],+p[1]-1,+p[2])/864e5; }
function dstr_(n){ return new Date(n*864e5).toISOString().slice(0,10); }
function cyc_(c,today){ const L=+c.every||1, a=dnum_(c.start), k=Math.floor((dnum_(today)-a)/L); return {k, start:dstr_(a+k*L), who:(((+c.who0+k)%2)+2)%2}; }
function readChores_(room){
  return chr_().getDataRange().getValues().slice(1).filter(r=>r[0]!==''&&String(r[12])===room)
    .map(r=>({id:Number(r[0]),title:String(r[1]),every:+r[2]||1,start:day_(r[3]),who0:+r[4]||0,time:tm_(r[5]),notify:+r[6]||0,doneKey:day_(r[8]),doneBy:r[9]===''?-1:+r[9],cnt:[+r[10]||0,+r[11]||0]}));
}
function chRow_(s,id,room){
  const n=s.getLastRow(); if(n<2) return 0; const v=s.getRange(1,1,n,13).getValues();
  for(let i=1;i<n;i++) if(String(v[i][0])===String(id)&&String(v[i][12])===room) return i+1;
  return 0;
}
function shareOf_(it){
  const t=Math.max(0,+it.total||0), v=+it.val||0;
  switch(it.mode){ case 'equal':return t/2; case 'pct':return t*Math.max(0,Math.min(v,100))/100; case 'fixed':return Math.max(0,Math.min(v,t)); case 'full': case 'pay':return t; default:return 0; }
}
function newCode_(){ return Utilities.getUuid().replace(/-/g,'').slice(0,16).toUpperCase().match(/.{4}/g).join('-'); }

// ---------- Phòng ----------
function roomRow_(code){
  code = String(code||'').trim().toUpperCase(); if(!code) return 0;
  const s = rom_(), n = s.getLastRow(); if(n<2) return 0;
  const v = s.getRange(2,1,n-1,1).getValues();
  for(let i=0;i<v.length;i++) if(String(v[i][0])===code) return i+2;
  return 0;
}
function names_(room){ const p=rom_().getRange(roomRow_(room),1,1,5).getValues()[0]; return [String(p[2]||'Người 1'),String(p[3]||'Người 2')]; }
function setSet_(room,st){ rom_().getRange(roomRow_(room),2,1,3).setValues([[st.month||'',st.names[0],st.names[1]]]); }

function read_(room){
  const rr = roomRow_(room); if(!rr) return null;
  const p = rom_().getRange(rr,1,1,5).getValues()[0];
  const rows = dat_().getDataRange().getValues().slice(1).filter(r=>r[0]!==''&&String(r[8])===room);
  const mk = r=>({id:Number(r[0]),name:String(r[1]),total:Number(r[2]),payer:Number(r[3]),mode:String(r[4]),val:Number(r[5]),date:day_(r[6]),note:String(r[7])});
  const items = rows.filter(r=>String(r[9]||'')==='').map(mk);
  const hist = his_().getDataRange().getValues().slice(1).filter(r=>String(r[0])===room)
    .map(r=>({pid:String(r[1]),label:String(r[2]),closed:day_(r[3]),names:[String(r[4]),String(r[5])],count:+r[6],total:+r[7],o:[+r[8],+r[9]]})).reverse();
  return { room, items, hist, chores:readChores_(room), rem:readRem_(room), settings:{ month:String(p[1]), names:[String(p[2]||'Người 1'),String(p[3]||'Người 2')] } };
}
function toRow_(it,room){ return [String(it.id),it.name||'',Math.max(0,+it.total||0),+it.payer||0,it.mode||'equal',Math.max(0,+it.val||0),it.date||'',it.note||'',room,'']; }
function rowOf_(s,id,room){
  const n=s.getLastRow(); if(n<2) return 0;
  const v=s.getRange(1,1,n,Math.min(10,s.getLastColumn())).getValues();
  for(let i=1;i<n;i++) if(String(v[i][0])===String(id)&&String(v[i][8])===room&&String(v[i][9]||'')==='') return i+1;
  return 0;
}
function rowAny_(s,id,room){
  const n=s.getLastRow(); if(n<2) return 0;
  const v=s.getRange(1,1,n,Math.min(10,s.getLastColumn())).getValues();
  for(let i=1;i<n;i++) if(String(v[i][0])===String(id)&&String(v[i][8])===room) return i+1;
  return 0;
}
function hRow_(s,id,room){
  const n=s.getLastRow(); if(n<2) return 0;
  const v=s.getRange(1,1,n,s.getLastColumn()).getValues();
  for(let i=1;i<n;i++) if(String(v[i][0])===String(id)&&String(v[i][8])===room) return i+1;
  return 0;
}
function addItems_(room,items){
  if(!items.length) return; const s=dat_();
  s.getRange(s.getLastRow()+1,1,items.length,10).setValues(items.map(it=>toRow_(it,room)));
}

function doGet(e){
  const room = String(e.parameter.room||'').trim().toUpperCase();
  return out_(read_(room) || {error:'Sai mã phòng'});
}
function doPost(e){
  let b;
  try{ b = JSON.parse((e&&e.postData&&e.postData.contents)||'{}'); }
  catch(err){ return out_({error:'Dữ liệu gửi lên không hợp lệ'}); }
  if(!b||typeof b!=='object'||Array.isArray(b)) return out_({error:'Dữ liệu gửi lên không hợp lệ'});
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try{
    let room = String(b.room||'').trim().toUpperCase(), note = null, invite = null, detail = null;
    if(b.op==='create'){
      room = newCode_(); const nm = b.names||['Người 1','Người 2'];
      rom_().appendRow([room,String(b.month||''),nm[0],nm[1],new Date()]);
      addItems_(room,b.items||[]);
    } else if(b.op==='join'){
      // Mã mời 6 số: sống 15 phút, đổi lấy mã phòng thật. Giới hạn 30 lần sai/phút cho toàn hệ thống.
      const c=CacheService.getScriptCache(), k='jf'+Math.floor(Date.now()/60000), n=+c.get(k)||0;
      if(n>=30) return out_({error:'Thử quá nhiều lần, đợi 1 phút rồi thử lại'});
      const r=c.get('inv'+String(b.code||'').replace(/\D/g,''));
      if(!r||!roomRow_(r)){ c.put(k,String(n+1),120); return out_({error:'Mã mời sai hoặc đã hết hạn'}); }
      return out_(read_(r));
    } else {
      if(!roomRow_(room)) return out_({error:'Sai mã phòng'});
      const s = dat_();
      if(b.op==='upsert'){
        const row=rowOf_(s,b.item.id,room);
        if(!row&&rowAny_(s,b.item.id,room)) return out_({error:'Khoản này đã thuộc kỳ đã chốt nên không sửa được'});
        const v=toRow_(b.item,room);
        if(row) s.getRange(row,1,1,10).setValues([v]); else s.appendRow(v);
        const nm=names_(room), pi=+b.item.payer||0;
        note = b.item.mode==='pay' ? ['Đã trả tiền', nm[pi]+' đã chuyển '+money_(b.item.total)+' cho '+nm[1-pi]]
          : [row?'Sửa khoản chi':'Khoản mới', nm[pi]+' chi '+money_(b.item.total)+' - '+(b.item.name||'')];
      } else if(b.op==='del'){
        const row=rowOf_(s,b.id,room);
        if(row){ const o=s.getRange(row,1,1,9).getValues()[0]; s.deleteRow(row); note=['Xoá khoản chi',String(o[1])+' ('+money_(o[2])+')']; }
      } else if(b.op==='settings'){
        setSet_(room,b.settings);
      } else if(b.op==='bulk'){
        const d=s.getDataRange().getValues();
        for(let i=d.length-1;i>=1;i--) if(String(d[i][8])===room&&String(d[i][9]||'')==='') s.deleteRow(i+1);
        addItems_(room,b.items||[]); setSet_(room,b.settings);
      } else if(b.op==='close'){
        const d=s.getDataRange().getValues(), idx=[], o=[0,0]; let total=0;
        for(let i=1;i<d.length;i++) if(String(d[i][8])===room&&String(d[i][9]||'')===''&&d[i][0]!==''){
          idx.push(i); const it={total:+d[i][2],payer:+d[i][3],mode:String(d[i][4]),val:+d[i][5]};
          o[1-it.payer]+=shareOf_(it); if(it.mode!=='pay') total+=it.total;
        }
        if(!idx.length) return out_({error:'Kỳ này chưa có khoản nào để chốt'});
        const pid=String(Date.now()), nm=names_(room), net=o[1]-o[0], today=Utilities.formatDate(new Date(),TZ,'yyyy-MM-dd');
        const label=String(b.label||'').trim()||('Kỳ '+today);
        s.getRange(1,10).setValue('period'); s.getRange('J:J').setNumberFormat('@');
        const col=s.getRange(1,10,d.length,1).getValues(); idx.forEach(i=>{col[i][0]=pid;}); s.getRange(1,10,d.length,1).setValues(col);
        his_().appendRow([room,pid,label,today,nm[0],nm[1],idx.length,total,o[0],o[1]]);
        if(Math.abs(net)>=1) addItems_(room,[{id:Date.now()+1,name:'Nợ kỳ trước ('+label+')',total:Math.round(Math.abs(net)),payer:net>0?0:1,mode:'full',val:0,date:today,note:''}]);
        note=['Đã chốt kỳ',label];
      } else if(b.op==='periodItems'){
        const pid=String(b.pid||'');
        detail={pid, items:s.getDataRange().getValues().slice(1).filter(r=>r[0]!==''&&String(r[8])===room&&pid&&String(r[9]||'')===pid)
          .map(r=>({name:String(r[1]),total:Number(r[2]),payer:Number(r[3]),mode:String(r[4]),date:day_(r[6]),note:String(r[7])}))};
      } else if(b.op==='choreSave'){
        const cs=chr_(), c=b.chore, row=chRow_(cs,c.id,room), f=p=>Utilities.formatDate(new Date(),TZ,p);
        const base=[String(c.id),c.title||'',+c.every||1,String(c.start),+c.who0||0,String(c.time||'07:00'),+c.notify?1:0];
        if(row) cs.getRange(row,1,1,7).setValues([base]);
        else cs.appendRow(base.concat([(String(c.time||'07:00')<=f('HH:mm'))?f('yyyy-MM-dd'):'','','',0,0,room]));
      } else if(b.op==='choreDel'){
        const cs=chr_(), row=chRow_(cs,b.id,room); if(row) cs.deleteRow(row);
      } else if(b.op==='choreSwap'){
        const cs=chr_(), row=chRow_(cs,b.id,room); if(row){ const cell=cs.getRange(row,5); cell.setValue(1-(+cell.getValue()||0)); cs.getRange(row,9,1,2).setValues([['','']]); }
      } else if(b.op==='choreDone'){
        const cs=chr_(), row=chRow_(cs,b.id,room);
        if(row){
          const v=cs.getRange(row,1,1,13).getValues()[0], key=String(b.key||''), by=+b.by, cnt=[+v[10]||0,+v[11]||0], pk=day_(v[8]), pb=v[9]===''?-1:+v[9];
          if(pk&&pk===key&&pb>=0) cnt[pb]=Math.max(0,cnt[pb]-1);
          if(by>=0){ cs.getRange(row,9,1,4).setValues([[key,by,cnt[0]+(by===0?1:0),cnt[1]+(by===1?1:0)]]); note=['Đã xong việc nhà',names_(room)[by]+' đã làm: '+String(v[1])]; }
          else cs.getRange(row,9,1,4).setValues([['','',cnt[0],cnt[1]]]);
        }
      } else if(b.op==='remSave'){
        const f=p=>Utilities.formatDate(new Date(),TZ,p), r=b.rem;
        rem_().appendRow([String(r.id),r.title,r.type,String(r.val),String(r.time),+r.bal?1:0,1,(String(r.time)<=f('HH:mm'))?f('yyyy-MM-dd'):'',room]);
      } else if(b.op==='remDel'){
        const rs=rem_(), row=hRow_(rs,b.id,room); if(row) rs.deleteRow(row);
      } else if(b.op==='token'){
        saveToken_(room,b.dev,b.token);
      } else if(b.op==='leave'){
        dropTokens_(room,b.dev);
      } else if(b.op==='invite'){
        const c=CacheService.getScriptCache(); let code;
        do{ code=String(Math.floor(100000+Math.random()*900000)); }while(c.get('inv'+code));
        c.put('inv'+code,room,900); invite=code;
      } else if(b.op==='health'){
        let trigger=false; try{ trigger=ScriptApp.getProjectTriggers().some(t=>t.getHandlerFunction()==='kiemTraNhacHen'); }catch(e){}
        let sa=false; try{ sa=!!JSON.parse(PropertiesService.getScriptProperties().getProperty('SA')||'null'); }catch(e){}
        const d=tok_().getDataRange().getValues();
        const tokens=d.slice(1).filter(r=>r[1]&&String(r[3])===room).length;
        return out_({health:{trigger,sa,tokens}});
      } else if(b.op==='testpush'){
        const n=push_(room,b.dev,'Thử thông báo','Nếu bạn thấy tin này, thông báo đẩy đang hoạt động.');
        return out_({test:{sent:n||0}});
      }
    }
    SpreadsheetApp.flush();
    if(note) push_(room,b.dev,note[0],note[1]);
    const res = read_(room); if(invite) res.invite = invite; if(detail) res.detail = detail;
    return out_(res);
  } finally { lock.releaseLock(); }
}

// ---------- Thông báo đẩy (Firebase) - cần Script property "SA" ----------
function saveToken_(room,dev,token){
  const s=tok_(), d=s.getDataRange().getValues();
  for(let i=1;i<d.length;i++) if(d[i][0]===dev||d[i][1]===token){ s.getRange(i+1,1,1,4).setValues([[dev,token,new Date(),room]]); return; }
  s.appendRow([dev,token,new Date(),room]);
}
function dropTokens_(room,dev){
  const s=tok_(), d=s.getDataRange().getValues();
  for(let i=d.length-1;i>=1;i--) if(d[i][0]===dev&&String(d[i][3])===room) s.deleteRow(i+1);
}
function b64_(x){ return Utilities.base64EncodeWebSafe(x).replace(/=+$/,''); }
function accessToken_(sa){
  const c=CacheService.getScriptCache(), k=c.get('fcmtok'); if(k) return k;
  const now=Math.floor(Date.now()/1000);
  const hd=b64_(JSON.stringify({alg:'RS256',typ:'JWT'}));
  const cl=b64_(JSON.stringify({iss:sa.client_email,scope:'https://www.googleapis.com/auth/firebase.messaging',aud:'https://oauth2.googleapis.com/token',iat:now,exp:now+3600}));
  const sig=b64_(Utilities.computeRsaSha256Signature(hd+'.'+cl,sa.private_key));
  const r=UrlFetchApp.fetch('https://oauth2.googleapis.com/token',{method:'post',payload:{grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',assertion:hd+'.'+cl+'.'+sig}});
  const t=JSON.parse(r.getContentText()).access_token; c.put('fcmtok',t,3000); return t;
}
function push_(room,dev,title,body,all){
  try{
    const sa=JSON.parse(PropertiesService.getScriptProperties().getProperty('SA')||'null'); if(!sa) return 0;
    const s=tok_(), d=s.getDataRange().getValues(), targets=[];
    for(let i=1;i<d.length;i++) if(d[i][1] && String(d[i][3])===room && (all||d[i][0]!==dev)) targets.push({row:i+1,token:d[i][1]});
    if(!targets.length) return 0;
    const at=accessToken_(sa), dead=[];
    targets.forEach(t=>{
      const r=UrlFetchApp.fetch('https://fcm.googleapis.com/v1/projects/'+sa.project_id+'/messages:send',{method:'post',contentType:'application/json',
        headers:{Authorization:'Bearer '+at},muteHttpExceptions:true,
        payload:JSON.stringify({message:{token:t.token,data:{title:title,body:body},webpush:{headers:{Urgency:'high',TTL:'86400'}}}})});
      if(r.getResponseCode()===404||/UNREGISTERED/.test(r.getContentText())) dead.push(t.row);
    });
    dead.sort((a,b)=>b-a).forEach(r=>s.deleteRow(r));
    return targets.length;
  }catch(e){ console.error(e); return 0; }
}

// ---------- Nhắc hẹn ----------
function readRem_(room){
  return rem_().getDataRange().getValues().slice(1).filter(r=>r[0]!==''&&String(r[8])===room&&+r[6]!==0)
    .map(r=>({id:Number(r[0]),title:String(r[1]),type:String(r[2]),val:day_(r[3]),time:tm_(r[4]),bal:+r[5]||0,on:+r[6]||0}));
}
function balText_(room){
  const d=read_(room), n=d.settings.names, o=[0,0];
  d.items.forEach(it=>{ o[1-it.payer]+=shareOf_(it); });
  const net=o[1]-o[0];
  if(Math.abs(net)<1) return 'Hiện không ai nợ ai';
  return n[net>0?1:0]+' cần chuyển cho '+n[net>0?0:1]+' '+money_(Math.abs(net));
}
function kiemTraTrucNhat_(day,hm){
  const s=chr_(), d=s.getDataRange().getValues(); if(d.length<2) return;
  for(let i=1;i<d.length;i++){
    const r=d[i]; if(r[0]===''||+r[6]!==1||!roomRow_(r[12])) continue;
    if(day_(r[7])===day || tm_(r[5])>hm) continue;
    const c=cyc_({every:r[2],start:day_(r[3]),who0:r[4]},day); if(c.start!==day) continue;
    push_(String(r[12]),null,'Đến lượt '+names_(String(r[12]))[c.who]+' trực nhật',String(r[1]));
    s.getRange(i+1,8).setValue(day);
  }
}
function kiemTraNhacHen(){
  kiemTraNhacHenCu_();
  const now=new Date(), f=p=>Utilities.formatDate(now,TZ,p);
  kiemTraTrucNhat_(f('yyyy-MM-dd'),f('HH:mm'));
}
function kiemTraNhacHenCu_(){
  const s=rem_(), d=s.getDataRange().getValues(); if(d.length<2) return;
  const now=new Date(), f=p=>Utilities.formatDate(now,TZ,p);
  const day=f('yyyy-MM-dd'), hm=f('HH:mm'), dom=+f('d'), dow=+f('u')%7, dim=new Date(+f('yyyy'),+f('M'),0).getDate();
  for(let i=1;i<d.length;i++){
    const r=d[i]; if(r[0]===''||+r[6]!==1||!roomRow_(r[8])) continue;
    const t=tm_(r[4]), val=day_(r[3]);
    if(day_(r[7])===day || t>hm) continue;
    const ok = r[2]==='month' ? dom===Math.min(+val,dim) : r[2]==='week' ? dow===+val : val===day;
    if(!ok) continue;
    push_(String(r[8]),null,String(r[1]),+r[5]?balText_(String(r[8])):'Đã đến giờ nhắc hẹn');
    s.getRange(i+1,8).setValue(day);
    if(r[2]==='once') s.getRange(i+1,7).setValue(0);
  }
}
function taoBoHen(){
  ScriptApp.getProjectTriggers().filter(t=>t.getHandlerFunction()==='kiemTraNhacHen').forEach(t=>ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('kiemTraNhacHen').timeBased().everyMinutes(10).create();
}

// ---------- CHẠY 1 LẦN: chuyển dữ liệu cũ (1 nhóm) vào hệ thống phòng ----------
function chuyenDuLieuCu(){
  const ss=SpreadsheetApp.getActive(), c=ss.getSheetByName('CaiDat');
  if(!c) throw new Error('Không thấy tab CaiDat');
  if(rom_().getLastRow()>1) throw new Error('Đã có phòng, không chuyển lại');
  const v=c.getRange('A1:B3').getValues(), code=newCode_();
  rom_().appendRow([code,String(v[0][1]),String(v[1][1]||'Người 1'),String(v[2][1]||'Người 2'),new Date()]);
  [['DuLieu',9],['NhacHen',9],['Tokens',4]].forEach(a=>{
    const s=ss.getSheetByName(a[0]); if(!s) return;
    s.getRange(1,a[1]).setValue('room');
    const n=s.getLastRow()-1; if(n<1) return;
    const r=s.getRange(2,a[1],n,1); r.setNumberFormat('@'); r.setValues(Array.from({length:n},()=>[code]));
  });
  Logger.log('MÃ PHÒNG: '+code);
  return code;
}
