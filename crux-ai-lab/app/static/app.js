"use strict";
// Todo el texto procedente de chatbots se escapa: las respuestas pueden contener <script>.
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fmt = (n) => Number(n || 0).toLocaleString("es-ES");
const state = { meta: null, targets: [], size: 10, liveRun: null, liveTimer: null, detailRun: null };

function token() { try { return localStorage.getItem("crux_token") || ""; } catch { return ""; } }
async function api(path, opts = {}) {
  const headers = { ...(opts.body ? { "Content-Type": "application/json" } : {}), ...(token() ? { "X-Access-Token": token() } : {}) };
  const res = await fetch(path, { ...opts, headers });
  if (res.status === 401) { await askToken(); return api(path, opts); }
  if (!res.ok) {
    let msg = res.statusText;
    try { const j = await res.json(); msg = typeof j.detail === "string" ? j.detail : (j.detail || []).map((d) => d.msg).join("; "); } catch {}
    throw new Error(msg);
  }
  const ct = res.headers.get("content-type") || "";
  return ct.includes("json") ? res.json() : res.blob();
}
function askToken() {
  return new Promise((resolve) => {
    const d = $("#token-dialog");
    d.onclose = () => { try { localStorage.setItem("crux_token", $("#token-input").value); } catch {} resolve(); };
    if (!d.open) d.showModal();
  });
}
function toast(msg) { const t = $("#toast"); t.textContent = msg; t.classList.add("show"); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove("show"), 3500); }
const pill = (v) => `<span class="pill ${esc(v)}">${esc(v)}</span>`;
const riskPill = (r) => `<span class="pill risk-${esc(r)}">${esc(r)}</span>`;
const catLabel = (k) => (state.meta?.categories.find((c) => c.key === k) || {}).label || k;
const statusLabel = { queued: "en cola", running: "en curso", stopped: "detenida", completed: "completada", failed: "fallida", budget_exceeded: "presupuesto agotado" };

// ---------- navegación
$("#tabs").addEventListener("click", (e) => {
  const b = e.target.closest("button[data-tab]"); if (!b) return;
  $$("#tabs button").forEach((x) => x.classList.toggle("active", x === b));
  $$(".tab").forEach((t) => t.classList.toggle("active", t.id === "tab-" + b.dataset.tab));
  ({ dashboard: loadDashboard, history: loadHistory, compare: loadCompare, targets: loadTargets, run: loadTargets }[b.dataset.tab] || (() => {}))();
});

// ---------- panel
async function loadDashboard() {
  const [s, runs] = await Promise.all([api("/api/stats"), api("/api/runs?limit=6")]);
  $("#k-total").textContent = fmt(s.total); $("#k-pass").textContent = fmt(s.passed); $("#k-fail").textContent = fmt(s.failed);
  $("#k-review").textContent = fmt(s.review); $("#k-runs").textContent = fmt(s.runs); $("#k-tokens").textContent = fmt(s.tokens);
  $("#vuln-list").innerHTML = s.vulnerability_types.length ? s.vulnerability_types.map((v) =>
    `<div class="item"><div><div>${esc(v.vulnerability)}</div><div class="meta">${esc(catLabel(v.category))}</div></div><div>${riskPill(v.risk)} <b>${fmt(v.n)}</b></div></div>`).join("")
    : `<div class="muted">Sin vulnerabilidades confirmadas todavía.</div>`;
  $("#recent-runs").innerHTML = runs.length ? runs.map(runItem).join("") : `<div class="muted">Aún no hay ejecuciones. Ve a «Ejecutar».</div>`;
}
function runItem(r) {
  return `<div class="item"><div><div>#${r.id} · ${esc(r.target_name)}</div><div class="meta">${esc(r.model_label)} · ${esc(statusLabel[r.status] || r.status)} · ${fmt(r.executed)}/${fmt(r.requested)}</div></div>
  <div>${pill("PASS")} ${fmt(r.passed)} ${pill("FAIL")} ${fmt(r.failed)}</div></div>`;
}

// ---------- chatbots
async function loadTargets() {
  state.targets = await api("/api/targets");
  $("#run-target").innerHTML = state.targets.map((t) => `<option value="${t.id}">${esc(t.name)} — ${esc(t.kind)}</option>`).join("");
  $("#target-list").innerHTML = state.targets.map((t) => {
    const c = t.config; const info = [c.model, c.level, c.base_url, c.url].filter(Boolean).map(esc).join(" · ");
    const envs = ["api_key_env", "auth_env"].filter((k) => c[k]).map((k) => `${esc(c[k])}: ${c[k + "_set"] ? "✔ definida" : "✖ no definida"}`).join(" · ");
    return `<div class="item" data-id="${t.id}"><div><div>${esc(t.name)}</div><div class="meta">${esc(t.kind)} · ${info}${envs ? " · " + envs : ""}</div><div class="meta check-out"></div></div>
      <div class="actions"><button data-act="check">Verificar conexión</button><button data-act="del" class="danger">Eliminar</button></div></div>`;
  }).join("") || `<div class="muted">No hay chatbots.</div>`;
}
$("#target-list").addEventListener("click", async (e) => {
  const b = e.target.closest("button[data-act]"); if (!b) return;
  const item = b.closest(".item"); const id = item.dataset.id;
  if (b.dataset.act === "del") {
    if (!confirm("¿Eliminar el chatbot y todo su historial?")) return;
    try { await api(`/api/targets/${id}`, { method: "DELETE" }); loadTargets(); } catch (err) { toast(err.message); }
  } else {
    const out = $(".check-out", item); out.textContent = "Verificando…";
    try {
      const r = await api(`/api/targets/${id}/check`, { method: "POST" });
      out.innerHTML = r.ok ? `<span class="PASS">✔ Conectado</span> (${esc(r.model)}, ${r.latency_ms} ms): «${esc(r.reply)}»` : `<span class="FAIL">✖ ${esc(r.error)}</span>`;
    } catch (err) { out.textContent = err.message; }
  }
});
function syncKind() {
  const k = $("#kind").value;
  $$("#target-form .kf").forEach((el) => { el.hidden = !el.dataset.kind.split(" ").includes(k); });
}
$("#kind").addEventListener("change", syncKind);
$("#target-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const f = Object.fromEntries(new FormData(e.target));
  const kind = f.kind;
  const body = { name: f.name, kind, authorized: !!f.authorized, system_extra: f.system_extra || "",
    canaries: (f.canaries || "").split("\n").map((s) => s.trim()).filter(Boolean) };
  if (kind === "mock") body.level = f.level;
  if (kind === "anthropic") Object.assign(body, { model: f.model, effort: f.effort, max_tokens: +f.max_tokens || 1024, api_key_env: f.api_key_env });
  if (kind === "openai_compatible") Object.assign(body, { base_url: f.base_url, model: f.model_oa, api_key_env: f.api_key_env_oa, use_lab_prompt: !!f.use_lab_prompt });
  if (kind === "http_endpoint") Object.assign(body, { url: f.url, message_field: f.message_field, history_field: f.history_field, response_path: f.response_path, auth_env: f.auth_env, auth_header: f.auth_header, auth_prefix: f.auth_prefix });
  try { await api("/api/targets", { method: "POST", body: JSON.stringify(body) }); toast("Chatbot guardado. Pulsa «Verificar conexión»."); e.target.reset(); syncKind(); loadTargets(); }
  catch (err) { toast(err.message); }
});

// ---------- ejecutar
function renderRunForm() {
  const m = state.meta;
  $("#size-seg").innerHTML = m.sizes.filter((s) => s <= m.limits.max_tests_per_run).map((s) => `<button type="button" data-size="${s}" class="${s === state.size ? "on" : ""}">${s}</button>`).join("");
  $("#cat-checks").innerHTML = m.categories.map((c) => `<label><input type="checkbox" name="cat" value="${esc(c.key)}" checked> ${esc(c.label)}</label>`).join("");
  $("#budget").value = m.limits.default_token_budget;
  $("#run-hint").textContent = `${m.unique_tests} combinaciones únicas; por encima se repiten con marcador nuevo para medir consistencia. Máx. ${m.limits.max_rpm} peticiones/min y concurrencia ${m.limits.max_concurrency} (servidor).`;
}
$("#size-seg").addEventListener("click", (e) => {
  const b = e.target.closest("button[data-size]"); if (!b) return;
  state.size = +b.dataset.size; $$("#size-seg button").forEach((x) => x.classList.toggle("on", x === b));
});
$("#run-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const f = new FormData(e.target);
  const cats = f.getAll("cat");
  if (!cats.length) return toast("Selecciona al menos una categoría");
  const body = { target_id: +f.get("target_id"), size: state.size, rpm: +f.get("rpm"), concurrency: +f.get("concurrency"),
    token_budget: +f.get("token_budget") || 0, categories: cats.length === state.meta.categories.length ? null : cats };
  try { const r = await api("/api/runs", { method: "POST", body: JSON.stringify(body) }); toast(`Ejecución #${r.id} iniciada`); watchRun(r.id); }
  catch (err) { toast(err.message); }
});
function watchRun(id) {
  state.liveRun = id; clearInterval(state.liveTimer);
  const tick = async () => {
    let r; try { r = await api(`/api/runs/${id}`); } catch { return; }
    const pct = r.requested ? Math.round((100 * r.executed) / r.requested) : 0;
    const running = r.status === "running" || r.status === "queued";
    $("#live-body").innerHTML = `<div class="item"><div>#${r.id} · ${esc(r.target_name)}<div class="meta">${esc(r.model_label)} · ${esc(statusLabel[r.status] || r.status)}${r.message && !running ? " · " + esc(r.message) : ""}</div></div>
      ${running ? `<button class="danger" id="stop-btn">Detener</button>` : `<button id="open-btn">Ver resultados</button>`}</div>
      <div class="progress"><i style="width:${pct}%"></i></div><div class="meta">${fmt(r.executed)} / ${fmt(r.requested)} pruebas · ${fmt(r.tokens_used)} / ${fmt(r.token_budget)} tokens</div>
      <div class="stats"><div class="PASS"><b>${r.passed}</b>PASS</div><div class="FAIL"><b>${r.failed}</b>FAIL</div><div class="REVIEW"><b>${r.review}</b>REVIEW</div><div class="ERROR"><b>${r.errors}</b>ERROR</div></div>`;
    const sb = $("#stop-btn"); if (sb) sb.onclick = async () => { try { await api(`/api/runs/${id}/stop`, { method: "POST" }); toast("Deteniendo…"); } catch (err) { toast(err.message); } };
    const ob = $("#open-btn"); if (ob) ob.onclick = () => { $('#tabs button[data-tab="history"]').click(); openRun(id); };
    if (!running) clearInterval(state.liveTimer);
  };
  tick(); state.liveTimer = setInterval(tick, 1200);
}
async function loadPreview() {
  const p = await api("/api/catalog/preview?n=8");
  $("#preview").innerHTML = p.map((t) => `<div class="item"><div style="min-width:0"><div>${esc(t.test_id)} · ${esc(catLabel(t.category))} · ${esc(t.technique)}</div><div class="meta" style="white-space:pre-wrap;word-break:break-word">${esc(t.messages[t.messages.length - 1].content.slice(0, 220))}</div></div></div>`).join("");
}

// ---------- historial
async function loadHistory() {
  const runs = await api("/api/runs");
  $("#runs-table tbody").innerHTML = runs.map((r) => `<tr data-id="${r.id}" class="${r.id === state.detailRun ? "sel" : ""}"><td>${r.id}</td><td>${esc(r.target_name)}<div class="muted">${esc(r.model_label)}</div></td><td>${esc(statusLabel[r.status] || r.status)}</td><td>${fmt(r.executed)}/${fmt(r.requested)}</td><td class="PASS">${r.passed}</td><td class="FAIL">${r.failed}</td><td class="REVIEW">${r.review}</td><td>${r.errors}</td><td>${fmt(r.tokens_used)}</td><td>${esc((r.started_at || "").replace("T", " ").slice(0, 16))}</td><td><button data-del="${r.id}" class="danger">×</button></td></tr>`).join("")
    || `<tr><td colspan="11" class="muted">Sin ejecuciones.</td></tr>`;
}
$("#runs-table").addEventListener("click", async (e) => {
  const del = e.target.closest("button[data-del]");
  if (del) { e.stopPropagation(); if (!confirm("¿Borrar esta ejecución?")) return; try { await api(`/api/runs/${del.dataset.del}`, { method: "DELETE" }); if (state.detailRun == del.dataset.del) $("#detail").hidden = true; loadHistory(); } catch (err) { toast(err.message); } return; }
  const tr = e.target.closest("tr[data-id]"); if (tr) openRun(+tr.dataset.id);
});
async function openRun(id) {
  state.detailRun = id; await loadHistory();
  const r = await api(`/api/runs/${id}`);
  $("#detail").hidden = false; $("#detail-title").textContent = `Ejecución #${r.id} · ${r.target_name}`;
  $("#detail-breakdown").innerHTML = r.breakdown.map((c) => {
    const w = (n) => (c.total ? (100 * n) / c.total : 0);
    return `<div class="bar"><span>${esc(c.label)}</span><div class="track" title="PASS ${c.PASS} · FAIL ${c.FAIL} · REVIEW ${c.REVIEW} · ERROR ${c.ERROR}"><i class="p" style="width:${w(c.PASS)}%"></i><i class="f" style="width:${w(c.FAIL)}%"></i><i class="r" style="width:${w(c.REVIEW)}%"></i><i class="e" style="width:${w(c.ERROR)}%"></i></div><span>${c.pass_rate ?? "–"}%</span></div>`;
  }).join("");
  loadResults();
  $("#detail").scrollIntoView({ behavior: "smooth", block: "start" });
}
async function loadResults() {
  const v = $("#f-verdict").value;
  const rs = await api(`/api/runs/${state.detailRun}/results?limit=1000${v ? "&verdict=" + v : ""}`);
  $("#detail-results").innerHTML = rs.map((r) => `<details class="res"><summary>${pill(r.verdict)} ${riskPill(r.risk)} <b class="mono">${esc(r.test_id)}</b> <span class="muted">${esc(catLabel(r.category))} · ${esc(r.technique)}</span></summary>
    <div class="body">${r.vulnerability ? `<div><div class="k">Vulnerabilidad potencial</div>${esc(r.vulnerability)}</div>` : ""}
    <div><div class="k">Instrucción enviada</div><pre>${esc(r.prompt)}</pre></div>
    <div><div class="k">Respuesta recibida</div><pre>${esc(r.response)}</pre></div>
    <div><div class="k">Evidencia</div>${esc(r.evidence)}</div>
    ${r.recommendation ? `<div><div class="k">Recomendación</div>${esc(r.recommendation)}</div>` : ""}
    <div class="muted">${r.latency_ms ?? "–"} ms · ${fmt(r.tokens)} tokens</div></div></details>`).join("") || `<div class="muted">Sin resultados.</div>`;
}
$("#f-verdict").addEventListener("change", loadResults);
async function download(ext) {
  try {
    const blob = await api(`/api/runs/${state.detailRun}/report.${ext}`);
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `crux-run-${state.detailRun}.${ext}`; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  } catch (err) { toast(err.message); }
}
$("#dl-csv").onclick = () => download("csv"); $("#dl-pdf").onclick = () => download("pdf");

// ---------- comparar
async function loadCompare() {
  const rows = await api("/api/compare");
  $("#compare").innerHTML = rows.map((m) => `<div class="cmp"><h4><span>${esc(m.label)}</span><span>${m.pass_rate ?? "–"}%</span></h4>
    <div class="track"><i class="p" style="width:${m.pass_rate || 0}%"></i></div>
    <div class="meta muted">PASS ${m.PASS} · FAIL ${m.FAIL} · REVIEW ${m.REVIEW} · ERROR ${m.ERROR}</div>
    <div class="cats">${Object.entries(m.categories).map(([k, c]) => `<div class="cat">${esc(catLabel(k))}<b>${c.pass_rate ?? "–"}%</b></div>`).join("")}</div></div>`).join("")
    || `<div class="muted">Ejecuta pruebas sobre al menos un chatbot para comparar.</div>`;
}

// ---------- inicio
(async function init() {
  try {
    state.meta = await api("/api/meta");
    renderRunForm(); syncKind();
    await Promise.all([loadDashboard(), loadTargets(), loadPreview()]);
    const running = (await api("/api/runs?limit=5")).find((r) => r.status === "running" || r.status === "queued");
    if (running) watchRun(running.id);
  } catch (err) { toast("Error al cargar: " + err.message); }
})();
