/* Página estática — carrega JSON pré-computados de data/ e desenha com Plotly.
   Nenhum cálculo econométrico aqui: só renderização e interações leves. */

const PLOT_LAYOUT = {
  paper_bgcolor: "rgba(0,0,0,0)",
  plot_bgcolor: "rgba(0,0,0,0)",
  font: { color: "#e8eaed" },
  margin: { t: 30, r: 20, b: 40, l: 55 },
  legend: { orientation: "h", y: -0.2 },
};
const CONFIG = { responsive: true, displaylogo: false };

async function loadJSON(name) {
  const res = await fetch(`data/${name}`);
  if (!res.ok) throw new Error(`Falha ao carregar data/${name}: ${res.status}`);
  return res.json();
}

/* ---------- Abas ---------- */
document.querySelectorAll(".tab").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((b) => b.classList.remove("active"));
    document.querySelectorAll(".panel").forEach((p) => p.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(btn.dataset.tab).classList.add("active");
    window.dispatchEvent(new Event("resize")); // Plotly reajusta ao ficar visível
  });
});

/* ---------- Aba 1: comparação preditiva OOS ---------- */
async function initCompare() {
  let d;
  try { d = await loadJSON("forecast_compare.json"); }
  catch (e) { return placeholder("compare-plot", e.message); }

  const COLORS = { VAR: "#4d9de0", VECM: "#7b68ee", LP: "#2ecc71",
                   XGBoost: "#e67e22", LSTM: "#e84393" };
  const methods = Object.keys(d.fuels.gasolina.RMSE);
  const active = new Set(methods);

  const box = document.getElementById("compare-controls");
  box.innerHTML = "Métodos: ";
  methods.forEach((m) => {
    box.insertAdjacentHTML("beforeend",
      `<label class="tog"><input type="checkbox" value="${m}" checked>` +
      `<span style="color:${COLORS[m]}">${m}</span></label>`);
  });

  const fuelSel = document.getElementById("cmp-fuel");
  const metSel = document.getElementById("cmp-metric");

  const draw = () => {
    const fuel = fuelSel.value, metric = metSel.value;
    const series = d.fuels[fuel][metric];
    const traces = methods.filter((m) => active.has(m)).map((m) => ({
      x: d.horizons, y: series[m], name: m, mode: "lines+markers", type: "scatter",
      line: { color: COLORS[m] },
    }));
    Plotly.react("compare-plot", traces,
      { ...PLOT_LAYOUT, xaxis: { title: "Horizonte (semanas à frente)" },
        yaxis: { title: `${metric} (R$/litro)` } }, CONFIG);
    // ranking no horizonte final
    const H = d.horizons.length - 1;
    const rank = [...methods].sort((a, b) => series[a][H] - series[b][H]);
    document.getElementById("cmp-note").textContent =
      `Avaliação: ${d.n_origins} origens em ${d.eval_period}. ` +
      `Melhor no horizonte ${d.horizons[H]}: ${rank[0]} (${metric} ${series[rank[0]][H].toFixed(3)}).`;
  };

  box.addEventListener("change", (e) => {
    if (e.target.checked) active.add(e.target.value);
    else active.delete(e.target.value);
    draw();
  });
  fuelSel.addEventListener("change", draw);
  metSel.addEventListener("change", draw);
  draw();
}

/* ---------- Aba 2: contrafactual por método ---------- */
async function initCounterfactual() {
  let d;
  try { d = await loadJSON("counterfactual.json"); }
  catch (e) { return placeholder("cf-plot", e.message); }

  const COLORS = { VAR: "#4d9de0", VECM: "#7b68ee", LP: "#2ecc71",
                   XGBoost: "#e67e22", LSTM: "#e84393" };
  const methods = Object.keys(d.gasolina.methods);
  const active = new Set(methods);

  // botões de alternância dos métodos
  const box = document.getElementById("cf-methods");
  box.innerHTML = "Métodos: ";
  methods.forEach((m) => {
    box.insertAdjacentHTML("beforeend",
      `<label class="tog"><input type="checkbox" value="${m}" checked>` +
      `<span style="color:${COLORS[m]}">${m}</span></label>`);
  });

  const draw = (fuel) => {
    const s = d[fuel];
    const traces = [
      // banda entre métodos
      { x: s.dates, y: s.band_lo, showlegend: false, mode: "lines",
        line: { width: 0 }, hoverinfo: "skip" },
      { x: s.dates, y: s.band_hi, name: "banda entre métodos", mode: "lines",
        fill: "tonexty", fillcolor: "rgba(136,136,136,0.15)", line: { width: 0 },
        hoverinfo: "skip" },
      { x: s.dates, y: s.observed, name: "Observado", mode: "lines",
        line: { color: "#f0a202", width: 3 } },
      { x: s.dates, y: s.mechanical, name: "obs + subvenção", mode: "lines",
        line: { color: "#9aa0a6", width: 1, dash: "dot" } },
    ];
    methods.filter((m) => active.has(m)).forEach((m) => {
      traces.push({ x: s.dates, y: s.methods[m], name: m, mode: "lines",
        line: { color: COLORS[m], width: 1.6 } });
    });
    Plotly.react("cf-plot", traces,
      { ...PLOT_LAYOUT, xaxis: { title: "Semana" }, yaxis: { title: "R$/litro" } },
      CONFIG);

    // nota com o efeito médio por método
    const mean = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;
    const obsM = mean(s.observed);
    const parts = methods.map((m) =>
      `${m}: ${(mean(s.methods[m]) - obsM >= 0 ? "+" : "")}` +
      `${(mean(s.methods[m]) - obsM).toFixed(2)}`);
    document.getElementById("cf-note").textContent =
      `Efeito médio (método − observado), R$/L: ` + parts.join("  ·  ");
  };

  const sel = document.getElementById("cf-fuel");
  sel.addEventListener("change", () => draw(sel.value));
  box.addEventListener("change", (e) => {
    if (e.target.checked) active.add(e.target.value);
    else active.delete(e.target.value);
    draw(sel.value);
  });
  draw(sel.value);
}

/* ---------- Aba 3: heterogeneidade regional (UF / meso / município) ---------- */
const RCOLORS = { N: "#e84393", NE: "#e67e22", CO: "#f0a202",
                  SE: "#4d9de0", S: "#2ecc71" };
const PRICE_SCALE = [[0, "#ffffcc"], [0.5, "#fd8d3c"], [1, "#bd0026"]];  // barato→caro
const LEVELS = {
  uf:     { file: "br_uf.geojson",     fkey: "properties.sigla", loc: "uf",   key: "by_uf",
            label: "estado", name: (x) => x.uf },
  regiao: { file: "br_region.geojson", fkey: "properties.code",  loc: "code", key: "by_macro",
            label: "macro-região", name: (x) => x.name },
};
const geoCache = {};
async function geo(file) {
  if (!geoCache[file]) geoCache[file] = await (await fetch(`data/${file}`)).json();
  return geoCache[file];
}

async function initRegional() {
  let d;
  try { d = await loadJSON("regional.json"); }
  catch (e) { return placeholder("rg-plot-uf", e.message); }

  const drawRegion = (s) => Plotly.react("rg-plot-region", d.regions.map((r) => ({
    x: s.dates, y: s.by_region[r], name: d.region_names[r], mode: "lines",
    line: { color: RCOLORS[r], width: 2 },
  })), { ...PLOT_LAYOUT, title: "Preço por macro-região (2026)",
         xaxis: { title: "Semana" }, yaxis: { title: "R$/litro" } }, CONFIG);

  const drawMap = async (s, level) => {
    const cfg = LEVELS[level];
    const g = await geo(cfg.file);
    const arr = s[cfg.key];
    const trace = { type: "choropleth", geojson: g, featureidkey: cfg.fkey,
      locations: arr.map((x) => x[cfg.loc]), z: arr.map((x) => x.preco),
      text: arr.map(cfg.name), colorscale: PRICE_SCALE,
      colorbar: { title: "R$/L", thickness: 12, len: 0.8 },
      marker: { line: { color: "rgba(0,0,0,0.35)", width: 0.4 } },
      hovertemplate: "%{text}: R$ %{z:.2f}<extra></extra>" };
    Plotly.react("rg-plot-uf", [trace],
      { ...PLOT_LAYOUT, title: `Preço médio no choque, por ${cfg.label} (R$/litro)`,
        geo: { fitbounds: "locations", visible: false, bgcolor: "rgba(0,0,0,0)" },
        height: 540 }, CONFIG);

    const a = [...arr].sort((x, y) => x.preco - y.preco);
    const lo = a[0], hi = a[a.length - 1];
    document.getElementById("rg-note").textContent =
      `Dispersão (${cfg.label}): menor ${cfg.name(lo)} R$ ${lo.preco.toFixed(2)} · ` +
      `maior ${cfg.name(hi)} R$ ${hi.preco.toFixed(2)} · ` +
      `diferença R$ ${(hi.preco - lo.preco).toFixed(2)}/litro (${arr.length} áreas).`;
  };

  const fuelSel = document.getElementById("rg-fuel");
  const lvlSel = document.getElementById("rg-level");
  const redraw = () => { const s = d[fuelSel.value]; drawRegion(s); drawMap(s, lvlSel.value); };
  fuelSel.addEventListener("change", redraw);
  lvlSel.addEventListener("change", redraw);
  redraw();
}

function placeholder(elId, msg) {
  document.getElementById(elId).innerHTML =
    `<div style="padding:24px;color:#9aa0a6">Sem dados ainda — rode o pipeline para gerar
     <code>data/</code>.<br><small>${msg}</small></div>`;
}

initCompare();
initCounterfactual();
initRegional();
