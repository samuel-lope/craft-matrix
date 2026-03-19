# Craft Matrix

Craft Matrix é uma aplicação web para desenhar e configurar grids personalizados, útil para criação de matrizes de jogos, mapas (battlemaps), esquemas de design ou painéis de referência visual.

A aplicação trabalha diretamente no navegador, construída com **React**, **TypeScript**, **Tailwind CSS**, **Lucide React** (para ícones) e **html-to-image** (para exportações).

## 🚀 Funcionalidades

### ⚙️ Configurações de Grid
- **Dimensões**: Defina o número de linhas (Rows) e colunas (Cols).
- **Tamanho da Célula**: Ajuste os pixels de cada célula individualmente em formato quadrado.
- **Linhas e Bordas**: Controle de espessura e cor das linhas divisórias e da moldura externa do grid.
- **Margens Externas**: Espaçamento configurável fora do grid com suporte a cor e opacidade de fundo.
- **Fundo Global**: Definição de cor e opacidade do fundo das células, mantendo linhas/bordas perfeitamente visíveis em qualquer nível de transparência.
- **Workspace Background**: Personalização da área de fundo do workspace com cor sólida e textura (URL ou código SVG).

#### 📄 Referência de Parâmetros em JSON (Grid Elements)
Abaixo está o mapeamento descritivo em formato JSON que detalha os atributos e elementos configuráveis detectados na aplicação:

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
    "bgValue": "Valor hexadecimal da cor ou string de código SVG do fundo da célula",
    "itemValue": "Código SVG do item flutuante posicionado sobre o fundo da célula",
    "label": {
      "text": "Conteúdo de texto a ser renderizado na célula",
      "font": "Família de fonte tipográfica",
      "size": "Tamanho da fonte em pixels",
      "color": "Cor do texto em valor Hex",
      "align": "Alinhamento do texto ('start', 'center' ou 'end')",
      "frameBgColor": "Cor de fundo do quadro do texto",
      "frameBgOpacity": "Opacidade do fundo do quadro do texto",
      "frameBorderColor": "Cor da borda do quadro do texto",
      "frameBorderWidth": "Espessura da borda do quadro do texto",
      "frameRadius": "Raio da quina do quadro do texto",
      "framePadding": "Espaçamento interno do quadro do texto"
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

### 🛠️ Ferramentas de Interação (Interação na Célula)
As ferramentas operam sob a lógica do "clique na célula". A ferramenta selecionada dita o que ocorre ao clicar numa célula:
- **Background Tools**: Permitem Pintar com cor sólida (`bg-color`) ou colocar um SVG em código (`bg-svg`) de redimensionamento em 100% sob a célula.
- **Item Tools**: Permitem Inserir um código SVG flutuando acima do background (`item-svg`).
- **Label Tools**: Permite inserir texto (`label`) com tipografia editável (fonte, tamanho, cor e alinhamento: start, center, end). Inclui suporte a **moldura (frame)** configurável com cor de fundo, opacidade, borda, raio e preenchimento.
- **Cell Border Tools**: Permitem aplicar (`cell-border`) as bordas de uma célula específica. Há uma sub-janela de seleção dos lados (Top, Right, Bottom, Left), escolha de tamanho, cor e comportamento de alinhamento (`inner`, `center`, `outer`).
- **Unified Eraser Tool**: Botão universal de "Erase Mode" configurável por contexto. Quando ativo, atua apagando a camada (Layer) referente à ferramenta recém ativada (Background, Item, Label, Borders), simplificando a interface.
- **General Tools**: Ferramenta `Pointer` passiva (não faz nada na célula), ferramenta para apagar todo o conteúdo de uma célula de vez (`Eraser Area`), além do botão extra de limpeza completa do grid.

*Nota: As configurações de cada ferramenta (Tool Settings) agora ficam organizadas de modo fluido em um painel secundário à esquerda (junto às ferramentas), incluindo atalhos com botão `+` para criar novas cores via **Color Picker/Conta-Gotas nativo** ou colar novos SVGs de modo inline, super rápido.*

### 💾 Gerenciamento (Managers)
- **Asset Manager (Manage Assets)**: Janela dedicada para salvar strings de código hexagonal (cores) e código SVG limpo para uso posterior (fundos ou itens). Suporta adição, edição e exclusão.
- **Grid Manager (Manage Saved Grids)**: Janela para salvamento progressivo e versionado da grade no `LocalStorage`. Permite Sobrescrever (Overwrite), Salvar como Novo (Save As New), Renomear e Excluir.

### 📤 Exportação
Ao clicar nos botões de exportação no cabeçalho, um **modal de opções** é exibido antes do download:

- **PNG** (Modal "Export PNG"): Oferece três opções de tamanho/resolução:
  - **Small (0.5×)**: Escala reduzida a 50% da dimensão original.
  - **Original Size (1×)**: Mantém resolução 1:1 pixel-perfect.
  - **Print (300 DPI)**: Renderiza em alta resolução para impressão.
- **SVG** (Modal "Export SVG"): Permite definir dimensões personalizadas em pixels (Largura e Altura) para o arquivo SVG exportado. Os campos vêm pré-preenchidos com as dimensões reais calculadas do grid, preservando a proporção original via `viewBox`. Há uma opção engatada dedicada ("Simplified SVG"):
  - **Simplified SVG (Fast, Backgrounds only)**: Um checkbox que contorna o processador primário (da DOM) e desenha nativamente um arquivo XML limpo estruturado com `shape-rendering="crispEdges"` contendo exatamente as larguras de linhas aplicadas. Ele injeta `overlap` sub-pixel para neutralizar qualquer defeito de margem branca/anti-aliasing, sendo perfeito para matrizes sólidas de fundos ou pixel-art puros sem perdas em Base64.
- **No Grid Lines** (Checkbox): Disponível em ambos os modais, permite exportar a imagem sem as linhas divisórias internas (escondendo a grid invisível num SVG simplificado, ou apagando-nas em um DOM capture).

> *Nota: O processo converte a tela internamente via Blob para evadir restrições de download seguras do navegador baseadas em Base64.*

## 💻 Como Rodar o Projeto

**Pré-requisitos:** Node.js (Recomendado v18 ou superior)

1. Instale todas as dependências do projeto contidas no `package.json`:
   ```bash
   npm install
   ```

2. Faça a execução da aplicação em modo de desenvolvimento voltado em Live Server local:
   ```bash
   npm run dev
   ```

3. Acesse a aplicação no seu navegador padrão usando a porta indicada pelo console (ex: `http://localhost:3000`). Para buildar, aplique `npm run build`.

## 🎨 Estilo e Design
Este projeto adota a estética **Technical Minimalism** com **Dark Mode** puro, utilizando uma paleta construída sobre preto (#000000) e a escala de cinza `neutral` do Tailwind CSS, com acentos em branco para alto contraste e elementos ativos. Usa ícones discretos do **Lucide React** e uma tipografia limpa.
