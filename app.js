(() => {
"use strict";
const $ = id => document.getElementById(id);
const KEY = "dailyLogbookITSupport_v2";
const fields = ["date","ticket","reporter","location","category","priority","status","startTime","endTime","task","action","result","followup","evidence","notes"];
let records = [];
let storageReady = true;
const today = new Date();
const dateString = d => new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10);
const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function message(text, error=false){$("formMessage").textContent=text;$("formMessage").style.color=error?"#b42318":"#1769aa";}
function readStorage(){
 try{const raw=localStorage.getItem(KEY);const parsed=raw?JSON.parse(raw):[];records=Array.isArray(parsed)?parsed:[];}
 catch(e){records=[];storageReady=false;message("Browser tidak mengizinkan akses penyimpanan. Aktifkan izin site storage lalu muat ulang.",true);}
}
function saveStorage(){
 try{localStorage.setItem(KEY,JSON.stringify(records));storageReady=true;return true;}
 catch(e){storageReady=false;message("Gagal menyimpan data. Penyimpanan browser penuh atau diblokir. Data form tidak dihapus.",true);return false;}
}
function duration(a,b){if(!a||!b)return 0;const [h1,m1]=a.split(":").map(Number),[h2,m2]=b.split(":").map(Number);let n=h2*60+m2-(h1*60+m1);return n<0?n+1440:n;}
function updateDuration(){$("durationPreview").value=$("startTime").value&&$("endTime").value?duration($("startTime").value,$("endTime").value)+" menit":"—";}
function resetForm(){$("taskForm").reset();$("editId").value="";$("date").value=dateString(new Date());$("durationPreview").value="—";$("saveButton").textContent="Simpan Aktivitas";$("formHeading").textContent="Input Aktivitas";message("");}
function filtered(){const q=$("searchInput").value.trim().toLowerCase(),s=$("statusFilter").value;return records.filter(r=>(!s||r.status===s)&&fields.some(k=>String(r[k]||"").toLowerCase().includes(q))).sort((a,b)=>(b.createdAt||"").localeCompare(a.createdAt||""));}
function render(){
 const done=records.filter(r=>r.status==="Selesai").length;
 $("totalCount").textContent=records.length;$("doneCount").textContent=done;$("progressCount").textContent=records.filter(r=>r.status==="Dalam Proses").length;
 $("totalDuration").innerHTML=records.reduce((n,r)=>n+(Number(r.duration)||0),0)+' <small>menit</small>';
 const rows=filtered();$("recordCount").textContent=rows.length+" aktivitas";
 $("taskRows").innerHTML=rows.length?rows.map(r=>'<tr><td>'+escapeHTML(r.date)+'</td><td>'+escapeHTML(r.ticket||"—")+'</td><td>'+escapeHTML(r.reporter)+'</td><td>'+escapeHTML(r.category)+'</td><td>'+escapeHTML(r.task)+'</td><td><span class="pill '+(r.status==="Selesai"?"done":r.status==="Dalam Proses"?"progress":r.status==="Menunggu"?"wait":"")+'">'+escapeHTML(r.status)+'</span></td><td>'+Number(r.duration||0)+' mnt</td><td><div class="row-actions"><button class="mini" data-edit="'+escapeHTML(r.id)+'" type="button">Edit</button><button class="mini delete" data-delete="'+escapeHTML(r.id)+'" type="button">Hapus</button></div></td></tr>').join(""):'<tr><td colspan="8" class="empty">Belum ada aktivitas yang cocok.</td></tr>';
}
$("taskForm").addEventListener("submit",e=>{
 e.preventDefault();
 if(!storageReady){message("Penyimpanan belum siap. Muat ulang halaman dan coba lagi.",true);return;}
 if($("endTime").value&&!$("startTime").value){message("Isi jam mulai terlebih dahulu.",true);return;}
 const id=$("editId").value||("log-"+Date.now()+"-"+Math.random().toString(36).slice(2,8));
 const item={id,createdAt:new Date().toISOString()};
 fields.forEach(k=>item[k]=$(k).value.trim());
 item.duration=duration(item.startTime,item.endTime);
 const index=records.findIndex(r=>r.id===id);
 if(index>=0){item.createdAt=records[index].createdAt||item.createdAt;records[index]=item;}else records.unshift(item);
 if(saveStorage()){render();resetForm();message(index>=0?"Aktivitas berhasil diperbarui.":"Aktivitas berhasil disimpan.");}
});
$("resetButton").addEventListener("click",resetForm);
$("taskRows").addEventListener("click",e=>{
 const edit=e.target.dataset.edit,del=e.target.dataset.delete;
 if(edit){const r=records.find(x=>x.id===edit);if(!r)return;fields.forEach(k=>$(k).value=r[k]||"");$("editId").value=r.id;$("saveButton").textContent="Update Aktivitas";$("formHeading").textContent="Edit Aktivitas";updateDuration();$("taskForm").scrollIntoView({behavior:"smooth",block:"start"});}
 if(del&&confirm("Hapus aktivitas ini?")){const previous=records;records=records.filter(x=>x.id!==del);if(!saveStorage())records=previous;render();}
});
["searchInput","statusFilter"].forEach(id=>$(id).addEventListener("input",render));
["startTime","endTime"].forEach(id=>$(id).addEventListener("input",updateDuration));
["staffName","department","workLocation","period"].forEach(id=>{const k="logbook_"+id;$(id).value=localStorage.getItem(k)||"";$(id).addEventListener("change",()=>{try{localStorage.setItem(k,$(id).value);}catch(e){message("Identitas tidak dapat disimpan di browser.",true);}});});
function download(name,data,type){const blob=new Blob([data],{type});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
$("exportButton").addEventListener("click",()=>{const head=["Tanggal","Ticket ID","Pelapor/Perangkat","Departemen/Lokasi","Kategori","Prioritas","Status","Jam Mulai","Jam Selesai","Durasi","Aktivitas","Tindakan","Hasil","Follow-up","Bukti","Catatan"];const data=records.map(r=>[r.date,r.ticket,r.reporter,r.location,r.category,r.priority,r.status,r.startTime,r.endTime,r.duration,r.task,r.action,r.result,r.followup,r.evidence,r.notes]);const csv=[head,...data].map(row=>row.map(v=>'"'+String(v??"").replace(/"/g,'""')+'"').join(",")).join("\r\n");download("daily-logbook.csv","\ufeff"+csv,"text/csv;charset=utf-8");});
$("backupButton").addEventListener("click",()=>download("backup-daily-logbook.json",JSON.stringify({records,identity:{staffName:$("staffName").value,department:$("department").value,workLocation:$("workLocation").value}},null,2),"application/json"));
$("clearButton").addEventListener("click",()=>{if(!records.length){message("Belum ada data untuk dihapus.");return;}if(confirm("Hapus seluruh aktivitas yang tersimpan di browser ini?")){const old=records;records=[];if(saveStorage()){render();resetForm();message("Semua aktivitas berhasil dihapus.");}else records=old;}});
$("printButton").addEventListener("click",()=>window.print());
$("date").value=dateString(today);$("period").value=dateString(today).slice(0,7);
readStorage();render();
})();