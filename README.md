# Aplicação web (GitHub Pages)

Página **estática** que carrega resultados **pré-computados** (JSON) e os renderiza com
Plotly. Nenhum cálculo econométrico roda no navegador — o notebook/pipeline exporta os
JSON para [`data/`](data/) e a página apenas os desenha.

## Estrutura

```
04_web/
  index.html          página única com 3 abas
  .nojekyll           impede o Jekyll de processar o site
  assets/
    css/style.css
    js/app.js         carrega os JSON de data/ e monta os gráficos
    vendor/           (opcional) plotly.min.js para uso offline
  data/
    manifest.json     lista de artefatos + metadados
    forecast_compare.json   Aba 1 — VAR vs XGBoost vs LSTM
    counterfactual.json     Aba 2 — observado vs "sem intervenção"
    regional.json           Aba 3 — heterogeneidade regional (posto a posto)
```

## Abas

1. **Comparação de modelos** — usuário escolhe VAR/XGBoost/LSTM; RMSE/MAE por horizonte.
2. **Contrafactual** — observado vs "sem intervenção", com área sombreada do efeito.
3. **Heterogeneidade regional** — preço posto a posto por macro-região e UF
   (dispersão que a média nacional esconde).

## Fluxo de dados

O pipeline (`02_modelagem/scripts/export_web/`) grava os JSON aqui em `data/`. O
**esquema** de cada arquivo está documentado em [`data/SCHEMA.md`](data/SCHEMA.md). Os
JSON são **versionados** (a página depende deles) — ver `.gitignore` na raiz.

## Rodar localmente

Como há `fetch()` de arquivos locais, sirva por HTTP (abrir via `file://` é bloqueado):

```bash
cd 04_web
python -m http.server 8000
# abrir http://localhost:8000
```

## Publicar no GitHub Pages — **só o site** (recomendado)

O objetivo é subir **apenas esta pasta** (`04_web/`) para um repositório **público**,
mantendo a pesquisa (dados, código, drafts) fora do GitHub. Como o giscus (comentários)
também exige repositório público, esse mesmo repo do site serve as duas coisas.

**Dois repositórios:**
- **Repo público do site** = o conteúdo de `04_web/` na raiz (index.html, assets/, data/,
  *.geojson, .nojekyll, README). O Pages serve a raiz.
- **Pesquisa** = repositório privado (ou só local); nunca vai ao ar.

Passo a passo:
```bash
cd 04_web
git init && git add . && git commit -m "site do oil_shock"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/SEU-REPO.git
git push -u origin main
```
Depois: **Settings ▸ Pages ▸ Deploy from a branch ▸ main / (root)**. Como o site está na
raiz do repo, não precisa de Actions nem de pasta `/docs`.

> Os JSON/GeoJSON em `data/` são **gerados pela pesquisa** (`02_modelagem/scripts/export_web`,
> `counterfactual.py`, `forecast_eval.py`) e copiados para cá. Ao reprocessar, regenere e
> faça commit dos novos `data/*`.

## Comentários (giscus)

A aba **Conclusão & debate** embute o [giscus](https://giscus.app) — comentários públicos
guardados nas **GitHub Discussions do repo do site**. Ativação (~2 min):
1. Repo do site **público** com **Discussions** habilitado (Settings ▸ General ▸ Features).
2. Instale o app do giscus no repo: https://github.com/apps/giscus
3. Em https://giscus.app, informe `SEU-USUARIO/SEU-REPO`, escolha *mapping = pathname* e uma
   categoria (ex.: crie "Comentários" nas Discussions). O site gera os IDs.
4. Cole `data-repo`, `data-repo-id`, `data-category` e `data-category-id` no bloco `giscus`
   do `index.html` (substituindo os `PLACEHOLDER_*`). Remova a nota `#giscus-note` se quiser.

## Plotly

Por padrão `index.html` carrega Plotly via CDN. Para uso **offline/self-contained**,
baixar `plotly.min.js` para `assets/vendor/` e trocar o `<script src>` no `index.html`.
