import { structuredAgentSessionPaneKey } from '../../../../../../shared/agent-session/view/structured-agent-session-projection'
import { isStructuredTab } from '../../../../../../shared/agent-session/view/structured-agent-session-tab'
import type { Tab } from '../../../../../../shared/tab-types'

export type StructuredTab = Tab & { contentType: 'agent-session' }

const structuredTabsByUnifiedTabsSnapshot = new WeakMap<
  Record<string, Tab[]>,
  readonly StructuredTab[]
>()

/** Project structured-session tabs once per immutable tab-map snapshot. */
export function getStructuredAgentSessionTabs(
  unifiedTabsByWorktree: Record<string, Tab[]>
): readonly StructuredTab[] {
  const cached = structuredTabsByUnifiedTabsSnapshot.get(unifiedTabsByWorktree)
  if (cached) {
    return cached
  }

  const tabs: StructuredTab[] = []
  for (const worktreeTabs of Object.values(unifiedTabsByWorktree)) {
    for (const tab of worktreeTabs) {
      if (isStructuredTab(tab)) {
        tabs.push(tab)
      }
    }
  }
  structuredTabsByUnifiedTabsSnapshot.set(unifiedTabsByWorktree, tabs)
  return tabs
}

const emptyPaneTabs: ReadonlyMap<string, StructuredTab> = new Map()
const paneTabs = new WeakMap<Record<string, Tab[]> | Tab[], ReadonlyMap<string, StructuredTab>>()
export function getStructuredAgentSessionTabsByPaneKey(
  tabs: Record<string, Tab[]> | Tab[] | undefined
): ReadonlyMap<string, StructuredTab> {
  if (!tabs) {
    return emptyPaneTabs
  }
  const cached = paneTabs.get(tabs)
  if (cached) {
    return cached
  }
  const result = new Map(
    (Array.isArray(tabs) ? tabs.filter(isStructuredTab) : getStructuredAgentSessionTabs(tabs)).map(
      (tab) => [structuredAgentSessionPaneKey(tab.id, tab.entityId), tab]
    )
  )
  paneTabs.set(tabs, result)
  return result
}
