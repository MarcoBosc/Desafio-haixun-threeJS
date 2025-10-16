# Estante 3D Interativa — Desafio Haixun Software

Visualização 3D de uma estante (armário) com Three.js e TypeScript, com:
- Controle de dimensões (largura, profundidade, altura, espessura)
- Reconstrução do modelo em tempo real
- Exportação das peças e furações em JSON para uso em otimizador de peças

Projeto desenvolvido como desafio para a vaga de desenvolvedor na Haixun Software.

## Tecnologias
- Three.js (WebGL)
- TypeScript
- Parcel (bundler)
- OrbitControls (navegação de câmera)

## Como rodar
Pré-requisitos: Node.js instalado.

- Instalar dependências (se houver package.json):
  - npm: `npm install`
  - ou apenas rodar com npx Parcel (sem instalar globalmente)

- Executar o projeto (dev server):
  - comando direto: `parcel ./src/index.html`
  - via npx: `npx parcel ./src/index.html`

O Parcel inicia em http://localhost:1234 (padrão).

## Uso
1. Informe Largura, Profundidade, Altura e Espessura nos campos do painel.
2. Clique em “Atualizar Estante” para reconstruir o modelo.
3. Arraste com o mouse para rotacionar a câmera (OrbitControls).
4. Clique em “Exportar Estante” para baixar o JSON com peças e furações.

Observações:
- Os inputs não têm limite de min/max. O app sanitiza valores para evitar dimensões impossíveis (por exemplo, evita shelfWidth negativo quando a espessura é muito alta).
- O campo “info” abaixo da cena exibe as dimensões atuais renderizadas.

## Estrutura (principal)
- `src/index.html` — markup e painel de controles
- `src/styles/styles.css` — estilos
- `src/scripts/index.ts` — bootstrap da cena, UI, rebuild, export
- `src/scripts/shelf.ts` — criação das peças (laterais, tampo, base, prateleira) e metadados
- `src/scripts/holes.ts` — detecção de contatos entre peças e criação dos marcadores de furo
- `src/scripts/export.ts` — varredura da cena e geração do JSON
- `src/scripts/types/PanelExport.ts` — tipos do JSON de exportação

## Formato do JSON de exportação
O arquivo gerado contém a lista de peças com nome, numeração, medidas e furações (coordenadas locais por peça, diâmetro e profundidade).

Exemplo:
```json
{
  "pecas": [
    {
      "numeracao": 1,
      "nome": "Lateral Esquerda",
      "medidas": { "comprimento": 1600, "largura": 500, "espessura": 18 },
      "furacoes": [
        {
          "diametro": 20,
          "profundidade": 13,
          "posicao": { "x": 120, "y": 300, "z": -220 }
        },
        {
          "diametro": 5,
          "profundidade": 10,
          "posicao": { "x": 120, "y": 300, "z": -210 }
        }
      ]
    }
  ]
}
```

Campos exigidos:
- Nome da peça
- Medidas da peça (Comprimento, Largura, Espessura)
- Numeração da peça
- Furações (coordenadas locais por peça, diâmetro, profundidade)

## Decisões e detalhes
- Sem limites min/max nos inputs; sanitização no `index.ts` garante dimensões viáveis e evita geometria invertida.
- `shelf.ts` aplica `shelfWidth = max(1, width - 2*thickness)` para peças internas.
- Furos são marcadores visuais (cilindros) com `userData`:
  - `panelNumeracao`, `diametro`, `profundidade`, `localPosition` (coordenadas locais na peça)
- `export.ts` varre a cena, associa furações às peças por `panelNumeracao` e salva as posições locais.

## Build (opcional)
- Produção com Parcel:
  - `parcel build ./src/index.html`

## Licença
Uso interno para o desafio técnico da Haixun Software.