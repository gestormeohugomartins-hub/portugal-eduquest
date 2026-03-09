
# Plano de Correção Abrangente do Sistema

## Problemas Identificados e Soluções

### 1. Sistema de Acessibilidade para Pais e Administradores

**Problema**: Atualmente, apenas estudantes têm acesso às funcionalidades de acessibilidade (lupa, dislexia, daltonismo). A tabela `profiles` não possui as colunas necessárias.

**Solução**:
- **Migração BD**: Adicionar colunas `accessibility_magnifier`, `accessibility_dyslexia`, `accessibility_colorblind_filter` à tabela `profiles`
- **Refatoração Hook**: Modificar `useAccessibility.ts` para aceitar tanto `studentId` quanto `userId`, buscando dados nas tabelas apropriadas
- **Wrapper Atualizado**: Expandir `AccessibilityWrapper` para suportar qualquer tipo de utilizador
- **Interface Pais**: Adicionar controlos de acessibilidade no ParentDashboard > aba Settings
- **Interface Admin**: Integrar controlos de acessibilidade no AdminDashboard

### 2. Correção da Seleção de Escolas

**Problema**: A função `loadSchools` só é executada quando existe um distrito associado ao pai. Não há `useEffect` inicial que carregue todas as escolas.

**Solução**:
- **Inicialização**: Adicionar `useEffect(() => { loadSchools(); }, [])` para carregar todas as escolas na montagem do componente
- **Fallback**: Modificar `loadSchools` para não depender do distrito do pai como pré-requisito

### 3. Sistema de Prioridades de Disciplinas

**Problema**: Existe código placeholder no ParentDashboard mas sem funcionalidade real. A tabela `subject_priorities` está vazia e sem interface funcional.

**Solução**:
- **Componente Funcional**: Criar `SubjectPriorityManager` com interface drag-and-drop ou sliders para priorização
- **CRUD Operations**: Implementar operações de criação/atualização de prioridades por filho
- **Integração**: Adicionar à aba Settings do ParentDashboard com separadores por filho

### 4. Sistema de Monitorização de Chats

**Problema**: Não existe funcionalidade para pais monitorizarem conversas dos filhos, conforme exigido para segurança.

**Solução**:
- **Nova Aba**: Adicionar aba "Chat Monitor" no ParentDashboard
- **Interface Multi-filho**: Criar separadores por cada filho com lista de conversas
- **Visualização**: Mostrar histórico de mensagens com timestamps e nomes dos participantes
- **Políticas RLS**: Já existem políticas permitindo pais verem mensagens dos filhos

### 5. Correção do Bug de Logout

**Problema**: Botão de logout no GamePage só funciona após refresh. Possível conflito entre `Sheet` component state e navigation redirects.

**Solução**:
- **Estado Controlado**: Converter `Sheet` no GamePage para estado controlado (`open` + `onOpenChange`)
- **AuthContext Fix**: Modificar `signOut` para limpar estados de forma síncrona antes de logout
- **Navigation Race**: Eliminar condições de corrida entre useEffects de redirect e ações manuais

### 6. Interface de Autorização de Amizades

**Problema**: A funcionalidade existe no código mas pode estar mal visível ou inacessível na interface.

**Solução**:
- **Melhorar Visibilidade**: Adicionar indicadores visuais (badges com contadores) na aba "Segurança"
- **Notificações Push**: Implementar notificações para pedidos pendentes
- **Interface Intuitiva**: Reorganizar layout para destacar pedidos que necessitam aprovação

## Estrutura Técnica da Implementação

### Migrações de Base de Dados
```sql
-- Adicionar colunas de acessibilidade à tabela profiles
ALTER TABLE profiles ADD COLUMN accessibility_magnifier BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN accessibility_dyslexia BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN accessibility_colorblind_filter TEXT;
```

### Componentes Novos/Modificados
1. **`useAccessibility.ts`**: Hook unificado para estudantes e outros utilizadores
2. **`AccessibilityWrapper.tsx`**: Wrapper universal para aplicar acessibilidade
3. **`SubjectPriorityManager.tsx`**: Interface de gestão de prioridades curriculares
4. **`ChatMonitor.tsx`**: Painel de monitorização de conversas dos filhos
5. **`AccessibilitySettings.tsx`**: Componente reutilizável para controlos de acessibilidade

### Atualizações de Páginas
- **ParentDashboard**: Novas abas + controlos de acessibilidade
- **AdminDashboard**: Integração de acessibilidade pessoal
- **GamePage**: Correção do Sheet controlado e logout
- **StudentRegisterPage**: Fix do carregamento inicial de escolas

### Fluxo de Estados
- Acessibilidade aplicada globalmente via classes CSS no `document.body`
- Estados de Sheet/Modal geridos de forma controlada para evitar conflitos
- AuthContext com limpeza síncrona de estados durante logout

## Benefícios Esperados
1. **Inclusão Total**: Acessibilidade disponível para todos os tipos de utilizador
2. **Funcionalidade Completa**: Todas as features básicas funcionais
3. **Segurança Melhorada**: Monitorização parental efetiva
4. **UX Consistente**: Interface fluida sem bugs de navegação
5. **Conformidade**: Sistema alinhado com requisitos de supervisão parental

## Testes Prioritários Pós-Implementação
1. Testar login/logout em diferentes dashboards
2. Verificar carregamento de escolas no registo
3. Validar aplicação de acessibilidade em contextos diversos
4. Confirmar funcionalidade de prioridades de disciplinas
5. Testar monitorização de chat com múltiplos filhos
