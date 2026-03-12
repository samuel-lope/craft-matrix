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

### 🛠️ Ferramentas de Interação (Interação na Célula)
- **Background Tools**: Pinte com cor sólida (`bg-color`), insira um código SVG ajustado em 100% sob a célula (`bg-svg`) ou apague a camada de fundo (`bg-eraser`).
- **Item Tools**: Permite inserir um código SVG flutuando acima do background (`item-svg`) ou apagá-lo da célula (`item-eraser`).
- **Cell Border Tools**: Aplique (`cell-border`) ou remova (`cell-border-eraser`) bordas de células específicas, escolhendo o lado afetado (Top, Right, Bottom, Left), a espessura, a cor e o comportamento de alinhamento (`inner`, `center`, `outer`).
- **General Tools**: Ferramenta `Pointer` passiva, além da ferramenta `Eraser Area` para apagar todo o conteúdo apenas da camada atualmente selecionada em toda a grade, e um botão extra de limpeza completa do grid.

### 💾 Gerenciamento (Managers)
- **Asset Manager (Manage Assets)**: Janela dedicada para salvar strings de código hexagonal (cores) e código SVG limpo para uso posterior (fundos ou itens). Fica armazenado na sessão.
- **Grid Manager (Manage Saved Grids)**: Janela para salvamento progressivo e versionado da grade no `LocalStorage`. Garante a recuperação do estado, suportando operações flexíveis como Sobrescrever (Overwrite), Salvar como Novo (Save As New) e Restaurar (Restore).

### 📤 Exportação
- **PNG**: Exporta em formato de imagem rasterizada com fundo transparente (`image_grid.png`).
- **SVG**: Exporta o painel de forma vetorizada flexível (`image_grid.svg`).
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
Este projeto foca fortemente numa estética visual baseada no **Dark Mode** e **Glassmorphism**, com paleta construída sob tons de violeta, rosa e preto acompanhada de transparências configuradas puramente pelo TailwindCSS.
