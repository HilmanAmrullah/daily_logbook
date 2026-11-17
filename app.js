const $ = id => document.getElementById(id);
const STORE_KEY = "dailyLogbookITSupport_v1";
const fields = ["date","ticket","reporter","location","category","task","priority","action","status","startTime","endTime","result","followup","evidence","notes"];
const today = new Date();
const localDate = d => new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10);
let tasks = [];
let currentPage = 1;
const pageSize = 8;
let sortNewest = true;

try { tasks = JSON.parse(localStorage.getItem(STORE_KEY) || "[]"); if (!Array.isArray(tasks)) tasks = []; }
catch { tasks = []; }

$("date").value = localDate(today);
$("period").value = localDate(today).slice(0,7);
["staffName","department","workLocation"].forEach(id => {
  const key = {staffName:"dailyLogbookStaff",department:"dailyLogbookDepartment",workLocation:"dailyLogbookLocation"}[id];
  $(id).value = localStorage.getItem(key) || "";
});

function minutesBetween(start,end) {
  if (!start || !end) return 0;
  const [sh,sm] = start.split(":").map(Number), [eh,em] = end.split(":").map(Number);
  let diff = eh*60+em-(sh*60+sm);
  if (diff < 0) diff += 1440;
  return diff;
}
function updateDuration() {
  const start=$("startTime").value, end=$("endTime").value;
  $("durationPreview").value = start && end ? minutesBetween(start,end)+" menit" : "—";
}
$("startTime").addEventListener("input",updateDuration);
$("endTime").addEventListener("input",updateDuration);

function escapeHTML(value="") {
  return String(value).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
function statusClass(status) {
  if(status==="Selesai") return "done";
  if(status==="Dalam Proses") return "progress";
  if(status==="Menunggu") return "wait";
  return "";
}
function notify(message) {
  const toast=$("appToast"); toast.textContent=message; toast.classList.add("show");
  clearTimeout(notify.timer); notify.timer=setTimeout(()=>toast.classList.remove("show"),2600);
}
function persist(message) {
  try {
    localStorage.setItem(STORE_KEY,JSON.stringify(tasks));
    if(message) notify(message);
    render();
    return true;
  } catch (error) {
    console.error("Gagal menyimpan logbook:", error);
    notify("Data gagal disimpan di browser. Cek izin penyimpanan atau kapasitas browser.");
    return false;
  }
}
function injectInteractiveUI() {
  const log=document.querySelector(".log-section");
  const toolbar=document.querySelector(".toolbar");
  const tools=document.createElement("div");
  tools.className="interactive-tools";
  tools.innerHTML=`
    <div class="tool-panel">
      <h3>Filter & Pengelolaan Data</h3>
      <div class="filter-grid">
        <label>Dari tanggal<input type="date" id="fromDate"></label>
        <label>Sampai tanggal<input type="date" id="toDate"></label>
        <label>Filter kategori<select id="categoryFilter"><option value="">Semua Kategori</option></select></label>
        <label>Urutkan tanggal<select id="sortOrder"><option value="new">Terbaru</option><option value="old">Terlama</option></select></label>
      </div>
      <div class="tool-actions">
        <button class="btn secondary" id="clearFilters" type="button">Reset Filter</button>
        <button class="btn secondary" id="backupButton" type="button">Backup JSON</button>
        <button class="btn secondary" id="restoreButton" type="button">Import JSON</button>
        <button class="btn secondary" id="clearDataButton" type="button">Hapus Semua Data</button>
        <input id="restoreFile" type="file" accept="application/json,.json" hidden>
      </div>
    </div>
    <div class="tool-panel">
      <h3>Aktivitas Berdasarkan Kategori</h3>
      <div id="categoryChart" class="chart-list"><p class="table-note">Belum ada data.</p></div>
    </div>`;
  log.insertBefore(tools,toolbar);
  const pagination=document.createElement("div"); pagination.id="pagination"; pagination.className="pagination";
  log.querySelector(".table-wrap").after(pagination);
  document.body.insertAdjacentHTML("beforeend",`
    <div id="appToast" class="toast" role="status" aria-live="polite"></div>
    <div id="detailBackdrop" class="modal-backdrop" role="dialog" aria-modal="true" aria-label="Detail task">
      <div class="detail-modal"><div class="modal-head"><h3>Detail Task</h3><button class="modal-close" id="closeDetail" type="button">Tutup ✕</button></div><div id="detailContent"></div></div>
    </div>`);
  const categoryFilter=$("categoryFilter");
  [...new Set(["Hardware","Software","Jaringan","Printer","Email / Akun","Instalasi","Maintenance","Cleaning","Akses / Permission","Lainnya",...tasks.map(t=>t.category)].filter(Boolean))].forEach(c=>categoryFilter.add(new Option(c,c)));
}
injectInteractiveUI();

function filteredTasks() {
  const q=$("searchInput").value.trim().toLowerCase(), status=$("statusFilter").value, category=$("categoryFilter").value;
  const from=$("fromDate").value, to=$("toDate").value;
  return tasks.filter(t=>
    (!status||t.status===status) && (!category||t.category===category) &&
    (!from||t.date>=from) && (!to||t.date<=to) &&
    fields.some(k=>String(t[k]||"").toLowerCase().includes(q))
  ).sort((a,b)=>sortNewest ? String(b.date).localeCompare(String(a.date)) : String(a.date).localeCompare(String(b.date)));
}
function renderChart() {
  const counts={}; tasks.forEach(t=>counts[t.category||"Lainnya"]=(counts[t.category||"Lainnya"]||0)+1);
  const entries=Object.entries(counts).sort((a,b)=>b[1]-a[1]);
  const max=Math.max(1,...entries.map(x=>x[1]));
  $("categoryChart").innerHTML=entries.length?entries.map(([name,count])=>`
    <div class="chart-row"><span>${escapeHTML(name)}</span><div class="chart-track"><div class="chart-fill" style="width:${count/max*100}%"></div></div><span class="chart-count">${count}</span></div>`).join(""):'<p class="table-note">Belum ada data kategori.</p>';
}
function render() {
  const filtered=filteredTasks();
  const done=tasks.filter(t=>t.status==="Selesai").length;
  $("totalCount").textContent=tasks.length;
  $("doneCount").textContent=done;
  $("progressCount").textContent=tasks.filter(t=>t.status==="Dalam Proses").length;
  $("totalDuration").textContent=tasks.reduce((n,t)=>n+(Number(t.duration)||0),0);
  $("preparedBy").textContent=$("staffName").value||"IT Support";

  const pages=Math.max(1,Math.ceil(filtered.length/pageSize));
  currentPage=Math.min(currentPage,pages);
  const start=(currentPage-1)*pageSize;
  const visible=filtered.slice(start,start+pageSize);
  $("taskRows").innerHTML=visible.length?visible.map(t=>`
    <tr>
      <td>${escapeHTML(t.date)}</td><td>${escapeHTML(t.ticket||"-")}</td>
      <td>${escapeHTML(t.reporter)}</td><td>${escapeHTML(t.category)}</td><td>${escapeHTML(t.task)}</td>
      <td><span class="pill ${["Tinggi","Kritis"].includes(t.priority)?"high":""}">${escapeHTML(t.priority)}</span></td>
      <td><select class="quick-status" data-status-id="${escapeHTML(t.id)}" aria-label="Ubah status">${["Belum Diproses","Dalam Proses","Menunggu","Selesai","Tidak Dapat Diselesaikan"].map(s=>`<option ${t.status===s?"selected":""}>${s}</option>`).join("")}</select></td>
      <td>${escapeHTML(t.startTime||"-")} – ${escapeHTML(t.endTime||"-")}</td><td>${Number(t.duration)||0} mnt</td>
      <td>${escapeHTML(t.result||"-")}${t.evidence?'<br><a href="'+escapeHTML(t.evidence)+'" target="_blank" rel="noopener">Bukti</a>':""}</td>
      <td><div class="row-actions"><button class="mini-btn view" data-view="${escapeHTML(t.id)}" type="button">Detail</button><button class="mini-btn" data-edit="${escapeHTML(t.id)}" type="button">Edit</button><button class="mini-btn delete" data-delete="${escapeHTML(t.id)}" type="button">Hapus</button></div></td>
    </tr>`).join(""):'<tr><td colspan="11" class="empty">Tidak ada data yang cocok.</td></tr>';
  $("pagination").innerHTML=`<span>Menampilkan ${filtered.length?start+1:0}–${Math.min(start+pageSize,filtered.length)} dari ${filtered.length} task</span><div class="pagination-controls"><button id="prevPage" ${currentPage<=1?"disabled":""}>Sebelumnya</button><strong>Halaman ${currentPage} / ${pages}</strong><button id="nextPage" ${currentPage>=pages?"disabled":""}>Berikutnya</button></div>`;
  renderChart();
}
function resetForm() {
  $("taskForm").reset(); $("editId").value=""; $("date").value=localDate(today);
  $("durationPreview").value="—"; $("saveButton").textContent="Simpan Task";
}
$("taskForm").addEventListener("submit",e=>{
  e.preventDefault();
  if($("endTime").value && !$("startTime").value){notify("Isi jam mulai terlebih dahulu.");return;}
  const id=$("editId").value||String(Date.now());
  const record={id}; fields.forEach(k=>record[k]=$(k).value.trim());
  record.duration=minutesBetween(record.startTime,record.endTime);
  const index=tasks.findIndex(t=>t.id===id);
  if(index>=0) tasks[index]=record; else tasks.unshift(record);
  const saved = persist(index>=0?"Task berhasil diperbarui.":"Task berhasil ditambahkan.");
  if(saved) {
    resetForm();
    currentPage=1;
    render();
  }
});
$("resetButton").addEventListener("click",resetForm);
$("taskRows").addEventListener("click",e=>{
  const edit=e.target.dataset.edit, del=e.target.dataset.delete, view=e.target.dataset.view;
  if(edit){
    const t=tasks.find(x=>x.id===edit); if(!t)return;
    fields.forEach(k=>$(k).value=t[k]||"");
    $("editId").value=t.id; updateDuration(); $("saveButton").textContent="Update Task";
    $("taskForm").scrollIntoView({behavior:"smooth",block:"start"});
  }
  if(del&&confirm("Yakin ingin menghapus task ini?")){
    tasks=tasks.filter(t=>t.id!==del); persist("Task berhasil dihapus.");
  }
  if(view){const t=tasks.find(x=>x.id===view);if(t)showDetail(t);}
});
$("taskRows").addEventListener("change",e=>{
  const id=e.target.dataset.statusId;if(!id)return;
  const task=tasks.find(t=>t.id===id);if(task){task.status=e.target.value;persist("Status task diperbarui.");}
});
function showDetail(t) {
  const labels={date:"Tanggal",ticket:"Ticket ID",reporter:"Pelapor / Perangkat",location:"Departemen / Lokasi",category:"Kategori",task:"Permasalahan / Task",priority:"Prioritas",action:"Tindakan / Troubleshooting",status:"Status",startTime:"Jam Mulai",endTime:"Jam Selesai",duration:"Durasi (menit)",result:"Hasil Penyelesaian",followup:"Follow-up",evidence:"Link Bukti",notes:"Catatan"};
  $("detailContent").innerHTML='<div class="detail-grid">'+Object.entries(labels).map(([key,label])=>`<div class="detail-item ${["task","action","result","followup","notes","evidence"].includes(key)?"wide":""}"><span>${label}</span><strong>${key==="evidence"&&t[key]?'<a href="'+escapeHTML(t[key])+'" target="_blank" rel="noopener">'+escapeHTML(t[key])+'</a>':escapeHTML(t[key]||"-")}</strong></div>`).join("")+'</div>';
  $("detailBackdrop").classList.add("open");
}
$("closeDetail").addEventListener("click",()=>$("detailBackdrop").classList.remove("open"));
$("detailBackdrop").addEventListener("click",e=>{if(e.target.id==="detailBackdrop")e.currentTarget.classList.remove("open");});
document.addEventListener("keydown",e=>{if(e.key==="Escape")$("detailBackdrop").classList.remove("open");});
["searchInput","statusFilter","categoryFilter","fromDate","toDate"].forEach(id=>$(id).addEventListener(id==="searchInput"?"input":"change",()=>{currentPage=1;render();}));
$("sortOrder").addEventListener("change",e=>{sortNewest=e.target.value==="new";render();});
$("clearFilters").addEventListener("click",()=>{["searchInput","statusFilter","categoryFilter","fromDate","toDate"].forEach(id=>$(id).value="");$("sortOrder").value="new";sortNewest=true;currentPage=1;render();});
$("pagination").addEventListener("click",e=>{if(e.target.id==="prevPage")currentPage--;if(e.target.id==="nextPage")currentPage++;render();});
$("staffName").addEventListener("input",()=>{localStorage.setItem("dailyLogbookStaff",$("staffName").value);$("preparedBy").textContent=$("staffName").value||"IT Support";});
$("department").addEventListener("input",()=>localStorage.setItem("dailyLogbookDepartment",$("department").value));
$("workLocation").addEventListener("input",()=>localStorage.setItem("dailyLogbookLocation",$("workLocation").value));

function downloadFile(name,content,type) {
  const blob=new Blob([content],{type});const url=URL.createObjectURL(blob);
  const a=document.createElement("a");a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
$("exportButton").addEventListener("click",()=>{
  const headers=["Tanggal","Ticket ID","Nama Pelapor","Departemen / Lokasi","Kategori","Permasalahan / Task","Prioritas","Tindakan / Troubleshooting","Status","Jam Mulai","Jam Selesai","Durasi (Menit)","Hasil Penyelesaian","Follow-up","Link Bukti","Catatan"];
  const rows=tasks.map(t=>[t.date,t.ticket,t.reporter,t.location,t.category,t.task,t.priority,t.action,t.status,t.startTime,t.endTime,t.duration,t.result,t.followup,t.evidence,t.notes]);
  const csv=[headers,...rows].map(r=>r.map(v=>'"'+String(v??"").replace(/"/g,'""')+'"').join(",")).join("\r\n");
  downloadFile("daily-logbook-it-support.csv","\ufeff"+csv,"text/csv;charset=utf-8");notify("File CSV berhasil dibuat.");
});
$("backupButton").addEventListener("click",()=>{
  const backup={app:"Daily Logbook IT Support",version:1,exportedAt:new Date().toISOString(),tasks,identity:{staffName:$("staffName").value,department:$("department").value,workLocation:$("workLocation").value}};
  downloadFile("backup-daily-logbook.json",JSON.stringify(backup,null,2),"application/json");notify("Backup JSON berhasil dibuat.");
});
$("restoreButton").addEventListener("click",()=>$("restoreFile").click());
$("restoreFile").addEventListener("change",async e=>{
  const file=e.target.files[0];if(!file)return;
  try{
    const data=JSON.parse(await file.text());const imported=Array.isArray(data)?data:data.tasks;
    if(!Array.isArray(imported)||!imported.every(t=>t&&typeof t==="object"&&t.date&&t.task)){throw new Error("Format file tidak sesuai");}
    if(!confirm("Import akan mengganti seluruh data logbook saat ini. Lanjutkan?"))return;
    tasks=imported.map((t,i)=>({...t,id:String(t.id||Date.now()+i)}));
    persist("Data backup berhasil di-import.");
  }catch(err){notify("Gagal import: "+err.message);}
  finally{e.target.value="";}
});
$("clearDataButton").addEventListener("click",()=>{
  if(!tasks.length){notify("Belum ada data untuk dihapus.");return;}
  if(confirm("Hapus SEMUA data task dari browser ini? Export backup terlebih dahulu jika diperlukan.")){
    tasks=[];persist("Semua data task telah dihapus.");currentPage=1;
  }
});
$("printButton").addEventListener("click",()=>window.print());
render();
