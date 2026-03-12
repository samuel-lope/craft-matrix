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
