const $ = id => document.getElementById(id);
const STORE_KEY = "dailyLogbookITSupport_v1";
let tasks = JSON.parse(localStorage.getItem(STORE_KEY) || "[]");
const fields = ["date","ticket","reporter","location","category","task","priority","action","status","startTime","endTime","result","followup","evidence","notes"];
const today = new Date();
$("date").value = today.toISOString().slice(0,10);
$("period").value = today.toISOString().slice(0,7);
function minutesBetween(start,end){if(!start||!end)return 0;const [sh,sm]=start.split(":").map(Number),[eh,em]=end.split(":").map(Number);let diff=eh*60+em-(sh*60+sm);if(diff<0)diff+=1440;return diff}
function updateDuration(){const m=minutesBetween($("startTime").value,$("endTime").value);$("durationPreview").value=m+" menit"}
$("startTime").addEventListener("input",updateDuration);$("endTime").addEventListener("input",updateDuration);
function persist(){localStorage.setItem(STORE_KEY,JSON.stringify(tasks));render()}
function escapeHTML(value=""){return String(value).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function statusClass(status){if(status==="Selesai")return "done";if(status==="Dalam Proses")return "progress";if(status==="Menunggu")return "wait";return ""}
function render(){
 const q=$("searchInput").value.toLowerCase(),filter=$("statusFilter").value;
 const shown=tasks.filter(t=>(!filter||t.status===filter)&&fields.some(k=>String(t[k]||"").toLowerCase().includes(q)));
 $("totalCount").textContent=tasks.length;$("doneCount").textContent=tasks.filter(t=>t.status==="Selesai").length;$("progressCount").textContent=tasks.filter(t=>t.status==="Dalam Proses").length;$("totalDuration").textContent=tasks.reduce((n,t)=>n+(t.duration||0),0);
 $("preparedBy").textContent=$("staffName").value||"IT Support";
 $("taskRows").innerHTML=shown.length?shown.map(t=>`<tr>
 <td>${escapeHTML(t.date)}</td><td>${escapeHTML(t.ticket||"-")}</td><td>${escapeHTML(t.reporter)}</td><td>${escapeHTML(t.category)}</td><td>${escapeHTML(t.task)}</td>
 <td><span class="pill ${t.priority==="Tinggi"||t.priority==="Kritis"?"high":""}">${escapeHTML(t.priority)}</span></td>
 <td><span class="pill ${statusClass(t.status)}">${escapeHTML(t.status)}</span></td><td>${escapeHTML(t.startTime||"-")} – ${escapeHTML(t.endTime||"-")}</td><td>${t.duration||0} mnt</td>
 <td>${escapeHTML(t.result||"-")}${t.evidence?`<br><a href="${escapeHTML(t.evidence)}" target="_blank" rel="noopener">Bukti</a>`:""}</td>
 <td><div class="row-actions"><button class="mini-btn" data-edit="${t.id}">Edit</button><button class="mini-btn delete" data-delete="${t.id}">Hapus</button></div></td></tr>`).join(""):'<tr><td colspan="11" class="empty">Tidak ada data yang cocok.</td></tr>';
}
$("taskForm").addEventListener("submit",e=>{e.preventDefault();const id=$("editId").value||String(Date.now());const record={id};fields.forEach(k=>record[k]=$(k).value.trim());record.duration=minutesBetween(record.startTime,record.endTime);const index=tasks.findIndex(t=>t.id===id);if(index>=0)tasks[index]=record;else tasks.unshift(record);persist();resetForm()});
function resetForm(){$("taskForm").reset();$("editId").value="";$("date").value=today.toISOString().slice(0,10);$("durationPreview").value="0 menit";$("saveButton").textContent="Simpan Task"}
$("resetButton").addEventListener("click",resetForm);
$("taskRows").addEventListener("click",e=>{const edit=e.target.dataset.edit,del=e.target.dataset.delete;if(edit){const t=tasks.find(x=>x.id===edit);if(!t)return;fields.forEach(k=>$(k).value=t[k]||"");$("editId").value=t.id;$("durationPreview").value=(t.duration||0)+" menit";$("saveButton").textContent="Update Task";window.scrollTo({top:$("taskForm").getBoundingClientRect().top+window.scrollY-20,behavior:"smooth"})}if(del&&confirm("Hapus task ini?")){tasks=tasks.filter(t=>t.id!==del);persist()}});
$("searchInput").addEventListener("input",render);$("statusFilter").addEventListener("change",render);
$("staffName").addEventListener("input",()=>{localStorage.setItem("dailyLogbookStaff", $("staffName").value);$("preparedBy").textContent=$("staffName").value||"IT Support"});
$("department").addEventListener("input",()=>localStorage.setItem("dailyLogbookDepartment",$("department").value));
$("workLocation").addEventListener("input",()=>localStorage.setItem("dailyLogbookLocation",$("workLocation").value));
["staffName","department","workLocation"].forEach(id=>{const key={staffName:"dailyLogbookStaff",department:"dailyLogbookDepartment",workLocation:"dailyLogbookLocation"}[id];$(id).value=localStorage.getItem(key)||""});
$("exportButton").addEventListener("click",()=>{const headers=["Tanggal","Ticket ID","Nama Pelapor","Departemen / Lokasi","Kategori","Permasalahan / Task","Prioritas","Tindakan / Troubleshooting","Status","Jam Mulai","Jam Selesai","Durasi (Menit)","Hasil Penyelesaian","Follow-up","Link Bukti","Catatan"];const keys=fields;const rows=tasks.map(t=>[t.date,t.ticket,t.reporter,t.location,t.category,t.task,t.priority,t.action,t.status,t.startTime,t.endTime,t.duration,t.result,t.followup,t.evidence,t.notes]);const csv=[headers,...rows].map(r=>r.map(v=>'"'+String(v??"").replace(/"/g,'""')+'"').join(",")).join("\r\n");const blob=new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="daily-logbook-it-support.csv";a.click();URL.revokeObjectURL(a.href)});
$("printButton").addEventListener("click",()=>window.print());
render();