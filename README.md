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
      "color": "Cor do texto em valor Hex"
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
- **Background Tools**: Pinte com cor sólida (`bg-color`), insira um código SVG ajustado em 100% sob a célula (`bg-svg`) ou apague a camada de fundo (`bg-eraser`).
- **Item Tools**: Permite inserir um código SVG flutuando acima do background (`item-svg`) ou apagá-lo da célula (`item-eraser`).
- **Label Tools**: Permite inserir texto (`label`) perfeitamente centralizado em tipografia editável (fonte, tamanho e cor) que flutua acima de todos os outros elementos do grid, ou apagá-lo (`label-eraser`).
- **Cell Border Tools**: Aplique (`cell-border`) ou remova (`cell-border-eraser`) bordas de células específicas, escolhendo o lado afetado (Top, Right, Bottom, Left), a espessura, a cor e o comportamento de alinhamento (`inner`, `center`, `outer`).
- **General Tools**: Ferramenta `Pointer` passiva, além da ferramenta `Eraser Area` para apagar todo o conteúdo apenas da camada atualmente selecionada em toda a grade, e um botão extra de limpeza completa do grid.

### 💾 Gerenciamento (Managers)
- **Asset Manager (Manage Assets)**: Janela dedicada para salvar strings de código hexagonal (cores) e código SVG limpo para uso posterior (fundos ou itens). Fica armazenado na sessão.
- **Grid Manager (Manage Saved Grids)**: Janela para salvamento progressivo e versionado da grade no `LocalStorage`. Garante a recuperação do estado, suportando operações flexíveis como Sobrescrever (Overwrite), Salvar como Novo (Save As New) e Restaurar (Restore).

### 📤 Exportação
Ao clicar nos botões de exportação no cabeçalho, um **modal de opções** é exibido antes do download:

- **PNG** (Modal "Export PNG"): Oferece três opções de tamanho/resolução:
  - **Small (0.5×)**: Escala reduzida a 50% da dimensão original.
  - **Original Size (1×)**: Mantém resolução 1:1 pixel-perfect.
  - **Print (300 DPI)**: Renderiza em alta resolução para impressão.
- **SVG** (Modal "Export SVG"): Permite definir dimensões personalizadas em pixels (Largura e Altura) para o arquivo SVG exportado. Os campos vêm pré-preenchidos com as dimensões reais calculadas do grid, preservando a proporção original via `viewBox`.
- **No Grid Lines** (Checkbox): Disponível em ambos os modais, permite exportar a imagem sem as linhas divisórias internas do grid.

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
Este projeto adota a estética **Technical Minimalism** com **Dark Mode** puro, utilizando uma paleta construída sobre preto (#000000) e a escala de cinza `neutral` do Tailwind CSS, com acentos em branco para alto contraste e elementos ativos.
