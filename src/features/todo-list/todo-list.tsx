import { useMemo } from 'react'
import { Action, ActionPanel, Color, Icon, List } from '@raycast/api'
import { useTodoList } from '@/features/todo-list/hooks/use-todo-list'
import { EmptyList } from '@/features/todo-list/components/empty-list'
import { CompleteTodoAction } from '@/components/complete-todo-action'
import { SetLabelAction } from '@/components/set-todo-label-action'
import { RemindAction } from '@/components/remind-todo-action'
import { CopyToDoAction } from '@/components/copy-todo-action'
import { DeleteTodoAction } from '@/components/delete-todo-action'
import { EditTodoTitleAction } from '@/features/todo-list/components/edit-todo-title-action'
import { SetProjectAction } from './components/set-todo-project-action'
import { SetUserAction } from './components/set-todo-user-action'
import { SetFilter } from './components/set-filter-action'
import { createAccessoriesArray } from '@/utils/create-accessories-array'
import { GeneralActions } from './components/general-actions'
import { CopyTaskLinkAction } from './components/copy-task-link'
import { OpenInNotionAction } from './components/open-in-notion-action'
import { OpenOnNotionAction } from './components/open-on-notion'
import { OpenAttachedLink } from './components/open-attached-link'
import { SetStatusAction } from './components/set-todo-status-action'
import { OpenSubIssuesAction } from './components/open-sub-issues-action'
import { BackToParentAction } from './components/back-to-parent-action'
import { getRenderer } from '@/services/accessories/renderer-registry'
import { Todo } from '@/types/todo'
import { AccessoryConfig } from '@/types/accessory-config'

function getExtraKeywords(
  todo: Todo,
  accessoryConfig: AccessoryConfig | null
): string[] {
  if (!accessoryConfig) return []

  return accessoryConfig.slots.flatMap((slot) => {
    const value = todo.extraProperties?.[slot.propertyName]
    if (!value) return []

    return getRenderer(slot.propertyType).getSearchKeywords(value)
  })
}

export function TodoList() {
  const {
    todos,
    tags,
    statuses,
    notionDbUrl,
    hasStatusProperty,
    hasAssigneeProperty,
    hasProjectProperty,
    hasTagProperty,
    loading,
    handleCreate,
    handleComplete,
    handleSetStatus,
    handleSetTag,
    handleSetDate,
    handleDelete,
    handleUpdateTitle,
    projects,
    projectsById,
    handleSetProject,
    users,
    handleSetUser,
    newTodo,
    searchText,
    onSearchTextChange,
    filterTodo,
    handleSetFilter,
    resetFilter,
    mutatePreferences,
    isNotionInstalled,
    accessoryConfig,
    hasSubIssueProperty,
    subIssueNavigation,
    handleOpenSubIssues,
    handleGoBack,
  } = useTodoList()

  const { currentParent, isNested, breadcrumb, backTitle } = subIssueNavigation

  const currentLevelCount = useMemo(
    () =>
      Object.values(todos).reduce(
        (total, list) => total + (list?.length ?? 0),
        0
      ),
    [todos]
  )

  const backAction =
    hasSubIssueProperty && isNested ? (
      <BackToParentAction backTitle={backTitle} onBack={handleGoBack} />
    ) : null

  const filterCount = useMemo(() => {
    let amount = 0
    if (filterTodo.tag) amount++
    if (filterTodo.projectId) amount++
    if (filterTodo.user) amount++
    if (filterTodo.status) amount++
    return amount
  }, [filterTodo])

  const todoMeta = useMemo(() => {
    const meta: Record<
      string,
      { accessories: List.Item.Accessory[]; keywords: string[] }
    > = {}

    for (const statusId of Object.keys(todos)) {
      const list = todos[statusId] ?? []
      for (const todo of list) {
        meta[todo.id] = {
          accessories: createAccessoriesArray({
            todo,
            projectsById,
            filter: filterTodo,
            showStatus: false,
            accessoryConfig,
          }),
          keywords: getExtraKeywords(todo, accessoryConfig),
        }
      }
    }

    return meta
  }, [todos, projectsById, filterTodo, accessoryConfig])

  return (
    <List
      isLoading={loading}
      searchText={searchText}
      onSearchTextChange={onSearchTextChange}
      navigationTitle={isNested ? breadcrumb : undefined}
      searchBarPlaceholder={
        currentParent
          ? `Search or create sub-issue in ${currentParent.title}`
          : 'Search or create task'
      }
    >
      {newTodo && newTodo.previewTitle ? (
        <List.Item
          icon={{ source: Icon.Plus, tintColor: Color.Blue }}
          title={newTodo.previewTitle}
          accessories={createAccessoriesArray({
            todo: newTodo,
            projectsById,
            accessoryConfig,
          })}
          actions={
            <ActionPanel>
              <Action
                icon={Icon.Plus}
                title="Create Task"
                onAction={handleCreate}
              />
              <Action
                icon={Icon.Plus}
                title="Create Task and Copy URL"
                onAction={() => handleCreate('SHARE')}
              />
              <Action
                icon={Icon.Plus}
                title="Create Task and Open in Notion"
                onAction={() => handleCreate('OPEN')}
                shortcut={{ modifiers: ['cmd'], key: 'o' }}
              />
              {backAction}
              <GeneralActions
                mutatePreferences={mutatePreferences}
                notionDbUrl={notionDbUrl}
              />
            </ActionPanel>
          }
        />
      ) : null}
      {isNested && currentParent ? (
        <List.Item
          icon={Icon.ChevronLeft}
          title={currentParent.title}
          subtitle="Sub-issues"
          accessories={[
            {
              text:
                currentLevelCount === 1
                  ? '1 sub-issue'
                  : `${currentLevelCount} sub-issues`,
            },
          ]}
          actions={
            <ActionPanel>
              {backAction}
              {isNotionInstalled ? (
                <OpenInNotionAction url={currentParent.url} />
              ) : (
                <OpenOnNotionAction url={currentParent.shareUrl} />
              )}
              <GeneralActions
                mutatePreferences={mutatePreferences}
                notionDbUrl={notionDbUrl}
              />
            </ActionPanel>
          }
        />
      ) : null}
      {!newTodo?.title && filterCount > 0 ? (
        <List.Item
          title={'Filtering by'}
          accessories={createAccessoriesArray({
            todo: filterTodo,
            projectsById,
            accessoryConfig,
          })}
          actions={
            <ActionPanel>
              <Action
                icon={Icon.XMarkCircle}
                title="Clear Filters"
                onAction={resetFilter}
              />
              <SetFilter
                users={users}
                projects={projects}
                tags={tags}
                statuses={statuses}
                hasStatusProperty={hasStatusProperty}
                onSetFilter={handleSetFilter}
              />
              <GeneralActions
                mutatePreferences={mutatePreferences}
                notionDbUrl={notionDbUrl}
              />
            </ActionPanel>
          }
        />
      ) : null}
      {statuses?.map((status) => {
        const numberOfIssues =
          todos[status.id]?.length === 1
            ? '1 issue'
            : `${todos[status.id]?.length} issues`

        return (
          <List.Section
            key={status.id}
            title={status.name}
            subtitle={numberOfIssues}
          >
            {todos[status.id]?.map((todo) => {
              const meta = todoMeta[todo.id]
              return (
                <List.Item
                  key={todo.id}
                  icon={{
                    source: status && status.icon ? status.icon : 'pending.svg',
                    tintColor: status?.color
                      ? status.color
                      : Color.SecondaryText,
                  }}
                  title={todo.title}
                  keywords={meta?.keywords}
                  accessories={meta?.accessories ?? []}
                  actions={
                    <ActionPanel>
                      <CompleteTodoAction
                        todo={todo}
                        onComplete={handleComplete}
                      />
                      {hasSubIssueProperty && (
                        <OpenSubIssuesAction
                          todo={todo}
                          onOpen={handleOpenSubIssues}
                        />
                      )}
                      {backAction}
                      {hasStatusProperty && statuses?.length > 0 && (
                        <SetStatusAction
                          todo={todo}
                          statuses={statuses}
                          onSetStatus={handleSetStatus}
                        />
                      )}
                      {hasTagProperty ||
                      hasAssigneeProperty ||
                      hasProjectProperty ||
                      hasStatusProperty ? (
                        <SetFilter
                          users={users}
                          projects={projects}
                          tags={tags}
                          statuses={statuses}
                          hasStatusProperty={hasStatusProperty}
                          onSetFilter={handleSetFilter}
                        />
                      ) : null}
                      <EditTodoTitleAction
                        todo={todo}
                        onUpdateTitle={handleUpdateTitle}
                      />
                      {todo.contentUrl ? (
                        <OpenAttachedLink url={todo.contentUrl} />
                      ) : null}
                      <ActionPanel.Section>
                        <RemindAction todo={todo} onSetDate={handleSetDate} />
                        {hasTagProperty && (
                          <SetLabelAction
                            todo={todo}
                            tags={tags}
                            onSetLabel={handleSetTag}
                            allowCreate
                          />
                        )}
                        {hasProjectProperty && (
                          <SetProjectAction
                            todo={todo}
                            projects={projects}
                            onSetProject={handleSetProject}
                          />
                        )}
                        {hasAssigneeProperty && (
                          <SetUserAction
                            todo={todo}
                            users={users}
                            onSetUser={handleSetUser}
                          />
                        )}
                        <CopyToDoAction todo={todo} />
                        <CopyTaskLinkAction todo={todo} />
                        {isNotionInstalled ? (
                          <OpenInNotionAction url={todo.url} />
                        ) : (
                          <OpenOnNotionAction url={todo.shareUrl} />
                        )}
                        <DeleteTodoAction todo={todo} onDelete={handleDelete} />
                      </ActionPanel.Section>
                      <GeneralActions
                        mutatePreferences={mutatePreferences}
                        notionDbUrl={notionDbUrl}
                      />
                    </ActionPanel>
                  }
                />
              )
            })}
          </List.Section>
        )
      })}
      <EmptyList
        notionDbUrl={notionDbUrl}
        mutatePreferences={mutatePreferences}
      />
    </List>
  )
}
