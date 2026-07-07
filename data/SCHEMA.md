# Esquema dos JSON (`data/`)

Formato dos resultados agregados que a página consome (sem transformação no navegador).
Gerados pelo código de pesquisa, mantido em separado deste repositório.

## `forecast_compare.json`: Aba 1 (comparação preditiva OOS)
```json
{
  "horizons": [1, 2, ..., 12],
  "fuels": {
    "gasolina": {
      "RMSE": { "VAR": [..], "VECM": [..], "LP": [..], "XGBoost": [..], "LSTM": [..] },
      "MAE":  { ...mesmos métodos... }
    },
    "diesel": { ... }
  },
  "n_origins": 49,
  "eval_period": "2019-01..2022-05"
}
```
Erro de previsão fora da amostra (janela expansível, condicional ao Brent/câmbio
verdadeiro), por horizonte, combustível e métrica. Cada vetor tem o comprimento de
`horizons`. A página tem seletor de combustível, de métrica (RMSE/MAE) e toggles por
método. Gerado pelo código de pesquisa (mantido em separado).

## `counterfactual.json`: Aba 2 (um contrafactual por método)
```json
{
  "gasolina": {
    "dates": ["YYYY-MM-DD", ...],
    "observed": [..],
    "methods": { "VAR": [..], "VECM": [..], "LP": [..], "XGBoost": [..], "LSTM": [..] },
    "band_lo": [..], "band_hi": [..],
    "mechanical": [..]
  },
  "diesel": { ... }
}
```
`observed` = preço ANP na bomba; cada série em `methods` = contrafactual "sem intervenção"
por método (todos ancorados em fev/2026, treino no regime livre 2021–22). `band_lo/hi` =
mín/máx entre métodos (incerteza). `mechanical` = observado + subvenção (benchmark). Todas
as séries têm a dimensão de `dates`.

## `regional.json`: Aba 3 (heterogeneidade regional)
```json
{
  "regions": ["N","NE","CO","SE","S"],
  "region_names": { "N": "Norte", ... },
  "gasolina": {
    "dates": ["YYYY-MM-DD", ...],
    "by_region": { "N": [..], "NE": [..], ... },              // série semanal (gráfico de linhas)
    "by_macro":  [ { "code": "N", "name": "Norte", "preco": 7.07 }, ... ],  // mapa macro-região
    "by_uf":     [ { "uf": "RR", "preco": 7.69 }, ... ]        // mapa UF (maior→menor)
  },
  "diesel": { ... }
}
```
Preço posto a posto (ANP surveia ~473 municípios, 8,5% do total) agregado por macro-região
(semanal + média no choque) e por UF (média no choque), ponderado pelo nº de postos.
Município/mesorregião foram descartados (cobertura amostral esparsa demais). Descritivo.
Gerado pelo código de pesquisa (mantido em separado).

## `br_uf.geojson` / `br_region.geojson`: geometrias (mapa da Aba 3)
- `br_uf.geojson`: 27 UFs, `properties.sigla` (~170 KB). Fonte: codeforgermany/click_that_hood.
- `br_region.geojson`: 5 macro-regiões, `properties.code` (~115 KB), dissolvidas das UFs.
Ambos simplificados com shapely (tol. 0,02°). O choropleth casa `featureidkey` com
`by_uf[].uf` (sigla) ou `by_macro[].code` (região). Seletor de nível na aba.
