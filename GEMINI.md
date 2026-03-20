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
- **Workspace Background**: Personalização da área de fundo do workspace (atrás do grid), permitindo definir uma cor sólida e uma textura (via URL de imagem ou código SVG).

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
    },
    "workspace": {
      "workspaceBgColor": "Cor de fundo do workspace (área externa ao grid)",
      "workspaceBgImageUrl": "URL ou código SVG da textura de fundo do workspace"
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
      "align": "Alinhamento do texto ('start', 'center' ou 'end')",
      "frameBgColor": "Cor de fundo do quadro/moldura do texto",
      "frameBgOpacity": "Opacidade do fundo do quadro do texto",
      "frameBorderColor": "Cor da borda do quadro do texto",
      "frameBorderWidth": "Espessura da borda do quadro do texto",
      "frameRadius": "Raio da quina (border-radius) do quadro do texto",
      "framePadding": "Espaçamento interno (padding) do quadro do texto"
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
- **Background Tools**: Permitem Pintar cor sólida (`bg-color`) ou colocar um SVG em código (`bg-svg`) de redimensionamento em 100% sob a célula.
- **Item Tools**: Permitem Inserir um SVG em código (`item-svg`) que flutua acima do background.
- **Label Tools**: Permite inserir texto (`label`) com tipografia editável (fonte, tamanho, cor e alinhamento: start, center, end). Inclui suporte a moldura (frame) configurável com cor de fundo, opacidade, borda, raio e preenchimento.
- **Cell Border Tools**: Permitem aplicar (`cell-border`) as bordas de uma célula específica. Há uma sub-janela de seleção dos lados (Top, Right, Bottom, Left), escolha de tamanho, cor e comportamento de alinhamento (`inner`, `center`, `outer`).
- **Unified Eraser Tool**: Botão universal de "Erase Mode" configurável por contexto. Quando ativo, atua apagando a camada (Layer) referente à ferramenta recém ativada (Background, Item, Label, Borders), simplificando a interface.
- **General Tools**: Ferramenta `Pointer` (não faz nada na célula) e ferramenta para apagar todo o conteúdo de uma célula de vez (`Eraser Area`). Há também botão para limpar a grade completa.

*Nota: As configurações de cada ferramenta (Tool Settings) ficam ancoradas num painel secundário do lado esquerdo para manter a dinâmica do uso. Ferramentas providas de inputs de cor ou SVG incluem atalhos em mini-formulários abertos via botão `+` que possibilitam adicionar novos ativos de modo totalmente imediato com suporte à função EyeDropper (Conta-Gotas), dispensando sair do contexto atual para gerenciar Assets nativamente.*

### 3. Gerenciamento (Managers)
- **Manage Assets**: Fica num modal dedicado (Asset Manager) para exclusão em massa, verificação e edição de strings de código hexagonal (cores), código limpo SVG para fundos, e código limpo SVG para itens. *Inclusões atômicas são preferencialmente geradas dinamicamente dentro dos atalhos inline descritos na seção Tool Settings.*
- **Manage Saved Grids**: Fica num modal dedicado (Grid Manager) garantindo o salvamento progressivo e versionado da grade no `LocalStorage`. Suporta as funções Overwrite, Save As New, Restore (Load), Rename e Delete. A partir da adoção do Storage Remoto, todos os saves com `workspaceId` associados engatilham um fetch `POST` silencioso de background sync para o banco Cloudflare D1 local/remoto, protegido com regra estrita On Conflict por timestamps (`updated_at`).

### 4. Exportação do Trabalho
O cabeçalho possui botões dedicados para exportar toda a montagem visual da grade usando a lib `html-to-image`, que passa por uma conversão em Blob para burlar restrições de segurança do navegador que impedem downloads automáticos de Base64 em arquivos extensos. Ao clicar nos botões de exportação, um **modal de opções** é exibido antes do download:

- **PNG** (Modal "Export PNG"): Oferece três opções de tamanho/resolução via `pixelRatio` do `html-to-image`:
  - **Small (0.5×)**: Escala reduzida a 50% da dimensão original (`pixelRatio: 0.5`).
  - **Original Size (1×)**: Mantém resolução 1:1 pixel-perfect (`pixelRatio: 1`).
  - **Print (300 DPI)**: Renderiza em alta resolução para impressão (`pixelRatio: 300/96 ≈ 3.125`).
- **SVG** (Modal "Export SVG"): Permite definir dimensões personalizadas em pixels (Largura e Altura) para o arquivo SVG exportado. Os campos são pré-preenchidos com as dimensões reais calculadas do grid. A lógica original altera via `DOMParser`, mas agora o modal dispõe de uma nova função nativa pura ativada por checkbox:
  - **Simplified SVG (Fast, Backgrounds only)**: Desativa a leitura de imagem externa gerando um arquivo de código geométrico leve construído matematicamente pelo React. Possui overlaps sub-pixel integrados e atributos `shape-rendering="crispEdges"` para barrar perdas e clareiras devidas a comportamentos de anti-aliasing.
- **No Grid Lines** (Checkbox): Opção presente em ambos os modais de exportação. Remove as divisórias e recomepensa espaços em brancos dependendo do modo de processamento de layout nativo ou Blob base64.

## Estrutura de Aquivos Chave

- `src/App.tsx`: Engloba o gerenciamento unificado de Estado, layout Tailwind-based principal da barra lateral, topo e renderização em loop de Array sobre células do Grid. Utiliza componentes reutilizáveis (`ToolSection`, `ToolButton`) para organização.
- `src/types.ts`: Define de forma estrita todo modelo de dados tipado, notavelmente o `GridState`, `CellData`, `LabelData`, `CellBorder` e a união `Tool`.
- `src/AssetManager.tsx` e `src/GridManager.tsx`: Administram os overlays de gerenciamento gravando localmente na memória (LocalStorage), permitindo a persistência de cores, SVGs e grids completos.
- `src/Modal.tsx`: O layout visual contentor de janelas pop-up usado nos submenus do Manager e de Salvar/Exportar.
- `functions/api/sync.ts`: Endpoint local via Cloudflare Pages Functions que administra as chamadas GET e POST (Workers HTTP APIs), processando as checagens com SQLite e interceptando requisições sem causar reload de viewport.
- `wrangler.jsonc` e `schema.sql`: Definição declarativa da nuvem estipulando os agrupamentos (`database_id`), regras locais e estrutura do DB D1.

## Notas de Estilo e Diretrizes
Este projeto usa a estética **Technical Minimalism** com **Dark Mode** puro. Todo diálogo textual e interações com a inteligência artificial (inclusive este próprio documento) devem ser pautados rigorosamente na norma **Português do Brasil**. Todas as mudanças complexas requerem elaboração por painéis Modais ou desmembramentos otimizados.

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
        "emerald": "Emerald (500) - Indicador visual positivo (ex: Botão ativador Workspace Active)",
        "sky": "Sky (400) - Utilizado para títulos de seção e ícones de ativação nas ferramentas"
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
        "panel": "bg-black border-r/l/t/b border-neutral-800 (.glass-panel)",
        "card": "bg-black border border-neutral-800 rounded-sm (.glass-card) - transition-colors hover:border-neutral-500",
        "tool-section": "space-y-4 pb-6 border-b border-neutral-800 last:border-0 last:pb-0 (Divisores lineares entre grupos de ferramentas)"
      },
      "inputs": {
        "input": "bg-black border border-neutral-800 text-[10px] font-bold uppercase tracking-widest text-neutral-200 focus:ring-1 focus:ring-white focus:border-white transition-all (Campos de formulários sutis)",
        "glass-input": "bg-neutral-900 border border-neutral-800 rounded-sm text-xs text-neutral-300 focus:border-white focus:bg-black (.glass-input)",
        "color-input-wrapper": "flex h-8 bg-black border border-neutral-800 rounded-sm focus-within:ring-1 focus-within:ring-white transition-all overflow-hidden (Garante que o input type color e o input text se fundam num mesmo bloco visual contínuo)",
        "seamless-color": "Utilitário CSS customizado (.seamless-color) no index.css que remove os estilos nativos de bordas e preenchimentos do seletor nativo do navegador para o input type=color"
      },
      "buttons": {
        "btn-primary": "bg-white hover:bg-neutral-200 text-black text-[10px] uppercase tracking-widest font-bold (.btn-primary)",
        "btn-secondary": "bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white transition-colors text-[10px] font-bold uppercase tracking-widest (.btn-secondary)",
        "btn-danger": "bg-neutral-900 text-rose-500 hover:bg-rose-950/30 border border-rose-900/50 transition-colors text-[10px] font-bold uppercase tracking-widest (.btn-danger)",
        "tool-btn-active": "bg-white text-black font-bold ring-1 ring-white (.tool-btn-active)",
        "tool-btn-inactive": "bg-neutral-900 text-neutral-500 hover:bg-neutral-800 hover:text-neutral-300 border border-transparent hover:border-neutral-700 (.tool-btn-inactive)"
      },
      "layout": {
        "sidebar": "w-80 flex-col overflow-y-auto z-10 bg-black border-r border-neutral-800 (Painel fixo do lado esquerdo com linhas precisas e ícones discretos do Lucide React)",
        "header": "h-16 border-b border-neutral-800 bg-black z-20 (Barra superior para status do repositório/workspace/exporter)",
        "workspace": "flex-1 overflow-auto bg-neutral-950 relative (Sustenta a renderização HTML do loop de células grid e opções de textura pura SVG)"
      }
    }
  }
}
```
