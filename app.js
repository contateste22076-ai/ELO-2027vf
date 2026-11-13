// ELO 2027 — formulário público + painel administrativo Supabase
(() => {
  "use strict";
  const SUPABASE_URL = "https://gcvrbqemytdwdhuyawkm.supabase.co";
  const SUPABASE_KEY = "sb_publishable_dxvP_l8-1J7OmjbtkhsFaQ_VJtcwD1Z";
  const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  const $ = id => document.getElementById(id);
  const form = $("suggestionForm"), adminPanel = $("admin-panel"), login = $("login-form"), dashboard = $("dashboard");
  let respostas = [];

  $("admin-open").addEventListener("click", () => { adminPanel.classList.remove("hidden"); window.scrollTo({top:adminPanel.offsetTop-10,behavior:"smooth"}); });
  $("back-form").addEventListener("click", () => { adminPanel.classList.add("hidden"); });

  form.addEventListener("submit", async e => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const status = $("status");
    const nome = $("name").value.trim();
    const turma = $("classroom").value.trim();
    const categoria = $("category").value;
    const ideia = $("idea").value.trim();
    const extra = $("extra").value.trim();
    const suggestion = `Categoria: ${categoria}\n\nSugestão: ${ideia}${extra ? `\n\nInformação adicional: ${extra}` : ""}`;
    btn.disabled = true; btn.textContent = "Enviando..."; status.textContent = "";
    try {
      const {error} = await db.from("elo_responses").insert([{student_name:nome || null,class_name:turma || null,suggestion}]);
      if (error) {
        status.textContent = error.code === "23505" ? "Já existe uma resposta com esse nome e turma." : "Não foi possível enviar. Tente novamente.";
        console.error(error); return;
      }
      form.reset(); status.textContent = "Sugestão enviada com sucesso! Obrigado por participar do ELO 2027.";
    } catch(err) { console.error(err); status.textContent = "Erro de conexão. Tente novamente."; }
    finally { btn.disabled = false; btn.textContent = "Enviar sugestão"; }
  });

  login.addEventListener("submit", async e => {
    e.preventDefault(); const btn=login.querySelector('button[type="submit"]'); btn.disabled=true;
    try {
      const {error}=await db.auth.signInWithPassword({email:$("admin-email").value.trim(),password:$("admin-password").value});
      if(error){$("login-status").textContent="E-mail ou senha inválidos.";return;}
      $("login-status").textContent=""; login.classList.add("hidden"); dashboard.classList.remove("hidden"); await carregarRespostas();
    } catch(err){console.error(err);$("login-status").textContent="Erro ao entrar. Tente novamente.";}
    finally{btn.disabled=false;}
  });

  async function carregarRespostas(){
    const tbody=$("responses"); tbody.replaceChildren(); tbody.innerHTML="<tr><td colspan='4'>Carregando...</td></tr>";
    const {data,error}=await db.from("elo_responses").select("student_name,class_name,suggestion,created_at").order("created_at",{ascending:false});
    if(error){tbody.innerHTML="<tr><td colspan='4'>Erro ao carregar respostas. Verifique as permissões da tabela.</td></tr>";console.error(error);return;}
    respostas=data||[]; $("total-count").textContent=respostas.length; tbody.replaceChildren();
    if(!respostas.length){tbody.innerHTML="<tr><td colspan='4'>Nenhuma resposta recebida.</td></tr>";return;}
    for(const r of respostas){const tr=document.createElement("tr");[r.student_name||"Não informado",r.class_name||"Não informada",new Date(r.created_at).toLocaleString("pt-BR"),r.suggestion||""].forEach(v=>{const td=document.createElement("td");td.textContent=v;tr.appendChild(td);});tbody.appendChild(tr);}
  }

  $("export-csv").addEventListener("click",()=>{
    if(!respostas.length)return;
    const rows=[["Nome","Turma","Data","Categoria e sugestão"],...respostas.map(r=>[r.student_name||"",r.class_name||"",new Date(r.created_at).toLocaleString("pt-BR"),r.suggestion||""])];
    const csv="\uFEFF"+rows.map(row=>row.map(v=>'"'+String(v??"").replace(/"/g,'""')+'"').join(";")).join("\r\n");
    const url=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));const a=document.createElement("a");a.href=url;a.download="respostas-elo-2027.csv";a.click();URL.revokeObjectURL(url);
  });
  $("logout").addEventListener("click",async()=>{await db.auth.signOut();dashboard.classList.add("hidden");login.classList.remove("hidden");login.reset();});
  db.auth.getSession().then(async({data,error})=>{if(!error&&data.session){login.classList.add("hidden");dashboard.classList.remove("hidden");await carregarRespostas();}});
})();
