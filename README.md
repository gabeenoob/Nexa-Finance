# Nexa Finance - Gestão Financeira

Uma aplicação completa de painel de gestão financeira corporativa com análise de fluxo de caixa, contas a pagar/receber e rastreamento de saldo em tempo real.

## Funcionalidades

- **Visão Geral**: Dashboard com saldo, receitas, despesas e gráficos interativos.
- **Fluxo de Caixa**: Gestão de Capital de Giro e Caixa Livre.
- **Transações**: Histórico completo com filtros, edição e exclusão (com lixeira).
- **Projetos e Clientes**: Gestão de projetos vinculados a clientes e transações financeiras.
- **Fiscal e Custos Fixos**: Controle de pagamentos recorrentes.
- **Relatórios**: DRE Gerencial, exportação para CSV e impressão.
- **Multi-conta**: Perfis Pessoal e Empresarial.

## Tecnologias

- React 18
- TypeScript
- Tailwind CSS
- Recharts (Gráficos)
- Lucide React (Ícones)
- Vite

## Como rodar o projeto

1. Instale as dependências:
   ```bash
   npm install
   ```

2. Rode o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

3. Acesse no navegador (geralmente em `http://localhost:5173`).

## Estrutura

O projeto utiliza uma estrutura plana para simplicidade:
- `components/`: Componentes React da UI.
- `types.ts`: Definições de tipos TypeScript.
- `App.tsx`: Componente principal e gerenciamento de estado global.
- `index.tsx`: Ponto de entrada da aplicação.
