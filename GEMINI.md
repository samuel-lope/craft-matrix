# Craft Matrix

Craft Matrix é uma aplicação web para desenhar e configurar grids personalizados, útil para criação de matrizes de jogos, mapas (battlemaps), esquemas de design ou painéis de referência visual. 
A aplicação trabalha diretamente no navegador, construída com React, TypeScript, Tailwind CSS, Lucide React (ícones) e `html-to-image` (para exportações).

## Estado Atual da Aplicação (Features Disponíveis)

A partir do commit atual (`origin/main`), o projeto dispõe das seguintes funcionalidades e arquitetura:

### 1. Configurações de Grid (Grid Parameters)
O painel lateral esquerdo permite a definição contínua das propriedades estruturais do grid:
- **Rows e Cols**: Número de linhas e colunas.
- **Cell Size (px)**: Dimensão em pixels de cada célula individual (formato quadrado).
- **Line Width e Line Color**: Espessura e cor das linhas divisórias da grade.
- **Border Width e Border Color**: Espessura e cor da moldura externa do grid.
- **External Margins**: Margens configuráveis fora da moldura do grid, aceitando definição de cor e níveis de opacidade de fundo.
- **Global Inner Background**: Definição global da cor e de opacidade do fundo das células, mantendo linhas e bordas da grid 100% sólidas e visíveis em qualquer opacidade do fundo.

#### Referência de Parâmetros em JSON (Grid Elements)
Abaixo está o detalhamento estruturado em JSON de todos os elementos e parâmetros que formam o Grid State e as Células:

```json
{
  "gridParameters": {
    "dimensions": {
      "rows": "Número de linhas horizontais",
      "cols": "Número de colunas verticais",
      "cellSize": "Tamanho em pixels de cada célula individual (quadrada)"
    },
    "gridLines": {
      "lineThickness": "Espessura (Line Width) das linhas divisórias internas",
      "lineColor": "Cor (Line Color) das linhas divisórias internas"
    },
    "outerBorder": {
      "borderThickness": "Espessura da linha de contorno da moldura externa do grid (sem preenchimento central)",
      "borderColor": "Cor da linha de contorno da moldura externa do grid"
    },
    "externalMargin": {
      "externalMargin": "Espessura em pixels da margem externa (atua como uma linha de limite externa vazada)",
      "externalMarginColor": "Cor da linha que demarca a área da margem externa",
      "externalMarginOpacity": "Nível de opacidade da linha da margem externa"
    },
    "innerBackground": {
      "innerBgColor": "Cor de fundo global aplicada dentro do grid",
      "innerBgOpacity": "Opacidade global do fundo interno do grid"
    }
  },
  "cellData": {
    "bgType": "Tipo de fundo da célula ('color' para cor sólida, 'svg' para imagem vetorial)",
    "bgValue": "Valor em Hex (cor) ou string de código SVG do fundo da célula",
    "itemValue": "Código SVG do item flutuante posicionado sobre o fundo da célula",
    "label": {
      "text": "Conteúdo de texto a ser renderizado na célula",
      "font": "Família de fonte tipográfica",
      "size": "Tamanho da fonte em pixels",
      "color": "Cor do texto em valor Hex",
      "align": "Alinhamento do texto ('start', 'center' ou 'end')"
    },
    "borders": {
      "borderTop": "Configuração da borda superior (largura, cor, alinhamento)",
      "borderRight": "Configuração da borda direita (largura, cor, alinhamento)",
      "borderBottom": "Configuração da borda inferior (largura, cor, alinhamento)",
      "borderLeft": "Configuração da borda esquerda (largura, cor, alinhamento)"
    }
  }
}
```

### 2. Ferramentas de Interação (Tools)
As ferramentas operam sob a lógica do "clique na célula". A ferramenta selecionada dita o que ocorre ao clicar numa célula:
- **Background Tools**: Permitem Pintar cor sólida (`bg-color`), colocar um SVG em código (`bg-svg`) de redimensionamento em 100% sob a célula, ou então apagar (`bg-eraser`) a camada plana.
- **Item Tools**: Permitem Inserir um SVG em código (`item-svg`) que flutua acima do background ou apagar (`item-eraser`) tal item.
- **Label Tools**: Permite inserir texto (`label`) com tipografia editável (fonte, tamanho, cor e alinhamento: start, center, end) que flutua acima de todos os outros elementos do grid, ou apagá-lo (`label-eraser`).
- **Cell Border Tools**: Permitem aplicar (`cell-border`) ou apagar (`cell-border-eraser`) as bordas de uma célula específica. Há uma sub-janela de seleção dos lados (Top, Right, Bottom, Left), escolha de tamanho, cor e comportamento de alinhamento (`inner`, `center`, `outer`).
- **General Tools**: Ferramenta `Pointer` (não faz nada na célula) e ferramenta para apagar todo o conteúdo de uma aba (`Eraser Area`). Há também botão para limpar a grade completa.

### 3. Gerenciamento (Managers)
- **Manage Assets**: Fica num modal dedicado (Asset Manager) para salvar strings de código hexagonal (cores), código limpo SVG para fundos, e código limpo SVG para itens.
- **Manage Saved Grids**: Fica num modal dedicado (Grid Manager) garantindo o salvamento progressivo e versionado da grade no `LocalStorage` debaixo de uma chave de identificador da composição do estado, suportando as funções Overwrite, Save As New, e Restore.

### 4. Exportação do Trabalho
O cabecealho possui botões práticos para exportar toda a montagem visual da grade usando a lib `html-to-image`, que passa por uma conversão em Blob para burlar restrições de segurança do navegador que impedem downloads automáticos de Base64 em arquivos extensos:
- **PNG**: Realiza download de imagem transparente rasterizada (`image_grid.png`).
- **SVG**: Realiza download vetorizado da grade em formato editável (`image_grid.svg`).

## Estrutura de Aquivos Chave

- `src/App.tsx`: Engloba o gerenciamento unificado de Estado, layout Tailwind-based principal da barra lateral, topo e renderização em loop de Array sobre células do Grid.
- `src/types.ts`: Define de forma estrita todo modelo de dados tipado, notavelmente o `GridState`, `CellData` e a união `Tool`.
- `src/AssetManager.tsx` e `src/GridManager.tsx`: Administram os overlays de gerenciamento gravando localmente na memória (LocalStorage).
- `src/Modal.tsx`: O layout visual contentor de janelas pop-up usado nos submenus do Manager e de Salvar/Exportar.

## Notas de Estilo e Diretrizes
Este projeto usa a estética dark/glassmorphism (Variações de violeta/preto com transparências tailwind). Todo diálogo textual e interações com a inteligência artificial (inclusive este próprio documento) devem ser pautados rigorosamente na norma **Português do Brasil**. Todas as mudanças complexas requerem elaboração por painéis Modais ou desmembramentos otimizados.

## Design System & UI Component Mapping (Esquema Visual)

Abaixo está o mapeamento analítico (JSON Schema) que padroniza todos os elementos visuais, paletas de cores, estilizações CSS personalizadas e diretrizes de layout (Tailwind CSS) em uso global na interface do projeto:

```json
{
  "uiDesignSystem": {
    "themeOptions": {
      "mode": "Technical Minimalism",
      "primaryColors": {
        "black": "Black (#000000) - Fundo principal da aplicação e workspaces",
        "neutral": "Neutral (950, 900, 800, 600, 500, 400, 300, 200, 100) - Escala de cinza base estrutural flexível; Usado em painéis, bordas, textos e inputs, eliminando o azul/roxo lavado anterior",
        "white": "White (#FFFFFF) - Usado para contraste máximo, elementos ativos, painéis em foco e textos primários",
        "rose": "Rose (500, 950) - Indicadores de perigo, botões destrutivos (Clear Grid, Eraser Area, Clear Texture)",
        "emerald": "Emerald (500) - Indicador visual positivo (ex: Botão ativador Workspace Active)"
      },
      "typography": {
        "base": "font-sans (Padrão Tailwind para textos contínuos e corpo de página)",
        "headers": "font-bold text-neutral-300 uppercase tracking-widest text-[10px] ou text-xs (Títulos de seções de ferramentas e utilitários)",
        "labels": "text-[10px] font-bold text-neutral-400 uppercase tracking-widest (Legendas de inputs de formulários e settings)",
        "mono": "font-mono (Tags e blocos de código RAW como importações textuais SVG)"
      }
    },
    "components": {
      "containers": {
        "panel": "bg-black border-r/l/t/b border-neutral-800",
        "card": "bg-neutral-950 border border-neutral-800 transition-colors hover:border-neutral-500 (Agrupa blocos isolados nas seções de ferramentas, substituindo antigas sombras)"
      },
      "inputs": {
        "input": "bg-black border border-neutral-800 text-[10px] font-bold uppercase tracking-widest text-neutral-200 focus:ring-1 focus:ring-white focus:border-white transition-all (Campos de formulários sutis que ganham foco na interação)"
      },
      "buttons": {
        "btn-primary": "bg-white hover:bg-neutral-200 text-black text-[10px] uppercase tracking-widest font-bold transition-colors (Ações de alta prioridade: Export SVG/PNG, Save, Load)",
        "btn-secondary": "bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white transition-colors text-[10px] font-bold uppercase tracking-widest (Ações corriqueiras secundárias e Modais)",
        "btn-danger": "bg-neutral-900 text-rose-500 hover:bg-rose-950 border border-rose-900/50 transition-colors text-[10px] font-bold uppercase tracking-widest",
        "tool-btn-active": "bg-white text-black font-bold ring-1 ring-white (Indicador sharp que a ferramenta corrente foi selecionada, alto contraste)",
        "tool-btn-inactive": "bg-neutral-950 hover:bg-neutral-900 text-neutral-500 hover:text-neutral-300 border border-neutral-800 transition-colors (Ferramenta não selecionada)"
      },
      "layout": {
        "sidebar": "w-80 flex-col overflow-y-auto z-10 bg-black border-r border-neutral-800 (Painel fixo do lado esquerdo com linhas precisas)",
        "header": "h-16 border-b border-neutral-800 bg-black z-20 (Barra superior para status do repositório/workspace/exporter)",
        "workspace": "flex-1 overflow-auto bg-black relative (Sustenta a renderização HTML do loop de células grid e opções de textura pura SVG)"
      }
    }
  }
}
```
