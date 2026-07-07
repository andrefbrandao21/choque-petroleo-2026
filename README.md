# Choque do petróleo de 2026 e a intervenção nos combustíveis

Site interativo com os resultados de um trabalho de **econometria de séries temporais**:
o *contrafactual* do preço na bomba (gasolina e diesel) **caso o governo não tivesse
intervindo** no choque de petróleo de fevereiro/2026.

🔗 **https://andrefbrandao21.github.io/choque-petroleo-2026/**

## Abas

1. **Introdução**: o choque, a resposta do governo e a linha do tempo da política de preços
   da Petrobras (por que o repasse é medido em 2021–22).
2. **Comparação de modelos**: erro preditivo fora da amostra (RMSE/MAE por horizonte) de
   cinco métodos: VAR, VECM, Projeções Locais, XGBoost e LSTM.
3. **Contrafactual**: preço observado vs. "sem intervenção" estimado pelos cinco métodos,
   com a banda de incerteza entre eles e o benchmark mecânico (subvenção).
4. **Heterogeneidade regional**: preço por estado (UF) e macrorregião, em mapa.
5. **Conclusão & debate**: síntese dos achados e comentários públicos ([giscus](https://giscus.app)).

## Como funciona

Site **100% estático** (HTML + [Plotly](https://plotly.com/javascript/) via CDN). Não há
servidor nem cálculo no navegador: todos os resultados são **pré-computados** e salvos como
JSON/GeoJSON em [`data/`](data/); a página apenas os desenha.

## Sobre os dados em `data/`

São **resultados agregados** já processados: estimativas do contrafactual, erros de
previsão e preços médios por região/UF. **Não há microdados brutos nem informação sensível.**
Num site estático esses arquivos *são* a matéria-prima dos gráficos (o navegador os baixa
para renderizar), então precisam ser públicos. O código de pesquisa que os gera (ETL e
modelos) é mantido separado deste repositório. Esquema de cada arquivo em
[`data/SCHEMA.md`](data/SCHEMA.md).

## Rodar localmente

Sirva por HTTP (o `fetch()` de arquivos locais não funciona via `file://`):

```bash
python -m http.server 8000
# abrir http://localhost:8000
```

## Publicação

Repositório público servido pelo **GitHub Pages** (branch `main`, raiz). Ao atualizar a
análise, regenere os arquivos de `data/` e faça commit, e a página reflete os novos resultados
no próximo deploy.

---

Autor: **André Filipe Brandão**, PPGE/UFPB.
