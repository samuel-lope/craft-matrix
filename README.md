# Craft Matrix

Craft Matrix é uma aplicação web para desenhar e configurar grids personalizados, útil para criação de matrizes de jogos, mapas (battlemaps), esquemas de design ou painéis de referência visual.

A aplicação trabalha diretamente no navegador, construída com **React**, **TypeScript**, **Tailwind CSS**, **Lucide React** (para ícones), **html-to-image** (para exportações) e **Cloudflare D1** (para persistência em nuvem).

## 🚀 Quick Start

**Pré-requisitos:** Node.js (Recomendado v18 ou superior) e Wrangler instalado.

1. Instale todas as dependências do projeto contidas no `package.json`:
   ```bash
   npm install
   ```

2. Realize o build da aplicação e inicialize o ambiente de desenvolvimento local vinculado ao Cloudflare D1:
   ```bash
   npm run build
   npx wrangler pages dev dist
   ```

3. Acesse a aplicação no seu navegador usando a porta gerada (comumente `http://127.0.0.1:8788`).

## ✨ Features

### ☁️ Persistência em Nuvem (Cloud Sync & Share)
- **Workspaces Anônimos:** Você pode criar seu próprio quadro UUID. Compartilhe o link (`/?workspace=UUID`) para visualização e colaboração imediata em qualquer dispositivo.
- **Sincronização em Background (D1):** Alterações locais espelham na base de dados `SQLite` global da Cloudflare de maneira invisível. O sistema utiliza validações através do `updated_at` nativo para garantir segurança contra a possível sobrescrita de dados velhos em caso de aberturas de janelas offline duplicadas.

### ⚙️ Configurações de Grid
- **Dimensões**: Defina o número de linhas (Rows) e colunas (Cols).
- **Tamanho da Célula**: Ajuste os pixels de cada célula individualmente em formato quadrado.
- **Linhas e Bordas**: Controle de espessura e cor das linhas divisórias e da moldura externa do grid.
- **Margens Externas**: Espaçamento configurável fora do grid com suporte a cor e opacidade de fundo.
- **Fundo Global**: Definição de cor e opacidade do fundo das células, mantendo linhas/bordas perfeitamente visíveis em qualquer nível de transparência.
- **Workspace Background**: Personalização da área de fundo do workspace com cor sólida e textura (URL ou código SVG).

### 🛠️ Ferramentas de Interação (Interação na Célula)
As ferramentas operam sob a lógica do "clique na célula". A ferramenta selecionada dita o que ocorre ao clicar numa célula:
- **Background Tools**: Permitem Pintar com cor sólida (`bg-color`) ou colocar um SVG em código (`bg-svg`) de redimensionamento em 100% sob a célula.
- **Item Tools**: Permitem Inserir um código SVG flutuando acima do background (`item-svg`).
- **Label Tools**: Permite inserir texto (`label`) com tipografia editável (fonte, tamanho, cor e alinhamento). Inclui suporte a **moldura (frame)** configurável (cor, borda, border-radius e padding).
- **Cell Border Tools**: Permitem aplicar (`cell-border`) as bordas de uma célula específica. (Top, Right, Bottom, Left, com configuração de largura, cor e alinhamento).
- **Unified Eraser Tool**: Botão de borracha com sensibilidade à camada da sua atual ferramenta ativada (Background, Item, Label, Borders).
- **General Tools**: Ferramenta `Pointer` passiva, apagador geral de área (`Eraser Area`) e botão auxiliar para limpeza integral do grid.
- **Inline Asset Tools**: Ferramentas incluem atalhos com botão `+` para colar ou amostrar cores com Eyedropper sem precisar sair do painel atual interagindo direto com o Asset Manager.

### 💾 Gerenciamento Local (Managers)
- **Asset Manager (Manage Assets)**: Janela dedicada para salvar códigos Hex e SVG em LocalStorage.
- **Grid Manager (Manage Saved Grids)**: Local de salvamentos progressivos (Overwrite, Save As New, Restore, Edit). Integrado ao roteador Cloud Sync que emite um Background push automático atrelado ao banco referencial sempre que um save sobrepõe os dados de um workspace existente.

### 📤 Exportação
- **PNG**: Small (0.5×), Original Size (1×), Print (300 DPI).
- **SVG**: Exportação livre da estrutura matricial de SVG limpo ativada com o novo "Simplified SVG", o qual neutraliza imprecisão de anti-aliasing via overlaps geométricos nativos injetados entre as células com `shape-rendering="crispEdges"`.
- **No Grid Lines** (Checkbox): Criação de imagem sem a renderização da linha matricial visível.

## 📡 API Reference
Neste modelo simplificado orientado ao ambiente Cloudflare (Pages + D1):
- `GET /api/sync?id=<workspaceId>`: Realiza fetch indexado por UUID de um GridState JSON previamente alocado no BD relacional distribuido Cloudflare.
- `POST /api/sync`: Realiza o "upsert" em tempo de background, atualizando o campo `data_json`. Inclui tratamento condicional `WHERE` com prioridade para chaves mais novas em milissegundos.

## 🎨 Estilo e Design
Adota estética **Technical Minimalism** pautada em **Dark Mode** puro, paleta preta fundamental (#000000) e cinzas da classe `neutral` do Tailwind CSS, acentos brancos de contraste em botões primários. Os ícones padronizados transitam via vetor leve do pacote `lucide-react`.
