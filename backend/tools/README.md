# Ferramentas de Visualização de Dependências de Módulos

Ferramentas para analisar e visualizar as dependências entre módulos NestJS do projeto SMAE.

## Visão Geral

Este conjunto de ferramentas gera visualizações gráficas das dependências entre os 158+ módulos da aplicação, ajudando a:

- **Identificar dependências circulares** (24 ciclos detectados)
- **Entender a arquitetura** do sistema
- **Planejar refatorações** para reduzir acoplamento
- **Documentar** a estrutura de módulos

## Requisitos

```bash
# Node.js (já incluído no projeto)
npm install

# Graphviz (necessário para gerar PNGs)
# Ubuntu/Debian:
sudo apt-get install graphviz

# macOS:
brew install graphviz

# Verificar instalação:
dot -V
```

## Uso Rápido

### Gerar todos os gráficos

```bash
./tools/generate-graphs.sh --all
```

### Opções disponíveis

```bash
./tools/generate-graphs.sh --full       # Gráfico completo
./tools/generate-graphs.sh --circular   # Foco em dependências circulares
./tools/generate-graphs.sh --horizontal # Layout horizontal (camadas)
./tools/generate-graphs.sh --html       # Visualizador HTML interativo
./tools/generate-graphs.sh --help       # Ajuda
```

## Tipos de Visualização

### 1. Visualizador HTML Interativo ⭐ Recomendado

**Arquivo gerado:** `dist-graph/modules-viewer.html`

**Como usar:**
```bash
# Gerar
./tools/generate-graphs.sh --html

# Abrir no navegador
open dist-graph/modules-viewer.html

# Ou servir localmente
npx serve dist-graph
```

**Funcionalidades:**
- 🔍 **Busca** por nome de módulo
- 📂 **Sidebar** com módulos agrupados por área
- 🖱️ **Pan e zoom** no grafo
- 🎨 **Cores** por área funcional
- 🔴 **Destaque** de módulos em ciclos
- 📊 **Tamanho dos nós** proporcional às dependências
- ✨ **Clique** para centralizar e destacar

---

### 2. Gráfico Completo

**Arquivos gerados:**
- `dist-graph/modules.png` - Imagem PNG
- `dist-graph/modules.dot` - Fonte Graphviz
- `dist-graph/modules.mmd` - Diagrama Mermaid

**Como usar:**
```bash
./tools/generate-graphs.sh --full
```

**Características:**
- Mostra todos os 158 módulos
- Setas tracejadas vermelhas = `forwardRef`
- Layout automático com sfdp

---

### 3. Foco em Dependências Circulares

**Arquivos gerados:**
- `dist-graph/circular-focused.png`
- `dist-graph/circular-focused.dot`

**Como usar:**
```bash
./tools/generate-graphs.sh --circular
```

**Características:**
- Filtra apenas módulos envolvidos em ciclos
- 🔴 **Vermelho**: Módulos em ciclos
- 🟡 **Amarelo**: Cadeia do VinculoModule
- ⚪ **Cinza**: Outros relacionados
- Útil para identificar problemas de arquitetura

---

### 4. Layout Horizontal (Camadas)

**Arquivos gerados:**
- `dist-graph/modules-horizontal.png`
- `dist-graph/modules-horizontal.dot`

**Como usar:**
```bash
./tools/generate-graphs.sh --horizontal
```

**Características:**
- Layout da esquerda para direita
- Organizado em camadas arquiteturais:
  - **Camada 0**: Infraestrutura (Prisma, Config)
  - **Camada 1**: Serviços compartilhados
  - **Camada 2**: Domínio base
  - **Camada 3**: Módulos de features
  - **Camada 4+**: Relatórios e agregações

## Scripts Individuais

Cada script pode ser executado diretamente:

```bash
# Gráfico completo
npx ts-node tools/graph-modules-simple.ts

# Foco em circulares
npx ts-node tools/graph-circular-only.ts

# Layout horizontal
npx ts-node tools/graph-horizontal.ts

# Visualizador HTML
npx ts-node tools/graph-html-viewer.ts
```

## Estrutura de Saída

```
dist-graph/
├── modules.png                 # Gráfico completo
├── modules.dot                 # Fonte Graphviz
├── modules.mmd                 # Mermaid
├── circular-focused.png        # Ciclos destacados
├── circular-focused.dot        # Fonte ciclos
├── modules-horizontal.png      # Layout horizontal
├── modules-horizontal.dot      # Fonte horizontal
├── modules-viewer.html         # Visualizador interativo
└── report.md                   # Relatório em texto
```

> **Nota:** O diretório `dist-graph/` está no `.gitignore` e não deve ser commitado.

## Resolução de Problemas

### Erro "init_rank" com dot

O engine `dot` pode falhar em grafos grandes. O script usa automaticamente `sfdp` como alternativa:

```bash
# Se dot falhar, tente manualmente:
sfdp -Tpng dist-graph/modules.dot -o dist-graph/modules.png
neato -Tpng dist-graph/modules.dot -o dist-graph/modules.png
fdp -Tpng dist-graph/modules.dot -o dist-graph/modules.png
```

### Módulos não aparecem

Verifique se os arquivos `.module.ts` estão no padrão correto:
- Deve exportar uma classe com sufixo `Module`
- Deve ter um decorator `@Module({...})`

### Cores não aparecem no PNG

Verifique se o Graphviz está atualizado:
```bash
# Ubuntu/Debian
sudo apt-get update && sudo apt-get install graphviz

# Verificar versão
dot -V  # Deve ser 2.40+
```

## Interpretando os Gráficos

### Cores dos Nós

| Cor | Significado |
|-----|-------------|
| Azul claro | Módulo comum |
| Vermelho/Laranja | Em dependência circular |
| Amarelo | Na cadeia de dependências do VinculoModule |
| Rosa | Casa Civil (casa-civil/) |
| Verde | Projetos (pp/) |
| Laranja claro | PDM (pdm/) |

### Tipos de Arestas (Setas)

| Estilo | Significado |
|--------|-------------|
| Linha sólida cinza | Importação direta |
| Linha tracejada vermelha | `forwardRef()` |
| Linha grossa vermelha | Parte de ciclo circular |

## Dicas de Refatoração

Baseado nos ciclos identificados:

1. **VinculoModule ↔ DemandaModule ↔ GeoLocModule**
   - Extrair serviço compartilhado para quebrar o ciclo

2. **TaskModule ↔ ApiLogModule**
   - Mover logging para um serviço de infraestrutura

3. **PdmModule ↔ SubTemaModule/MacroTemaModule/TagModule/TemaModule**
   - Usar injeção de dependência via interface

4. **VariavelModule ↔ VariavelCategoricaModule**
   - Consolidar em um único módulo ou extrair entidades compartilhadas

5. **MfModule ↔ AuxiliarModule ↔ MonitMetasModule**
   - Reorganizar em camadas: MF → Metas → Auxiliar

## Contribuindo

Para adicionar novos tipos de visualização:

1. Crie um novo arquivo em `tools/graph-<nome>.ts`
2. Use `extractModules()` para obter dados dos módulos
3. Gere saída em DOT, HTML ou outro formato
4. Adicione opção ao `tools/generate-graphs.sh`

---

**Mais informações:** Veja `PATTERNS.md` para padrões de arquitetura do projeto.
