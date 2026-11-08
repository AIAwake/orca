import { launchStateLifecycle } from './structured-agent-session-launch-lifecycle'
import type { StructuredLaunchFailure } from './structured-agent-session-launch-failure'
import type { StructuredLaunchRecoveryState } from './structured-agent-session-launch-recovery'
import type { StructuredLaunchSelection } from './structured-agent-session-launch-options'
import type {
  StructuredAgentLaunchOptions,
  StructuredLaunchCallerGroup
} from './structured-agent-session-launch-callers'
import {
  deleteStructuredAgentLaunchRecord,
  readStructuredAgentLaunchRecord,
  updateStructuredAgentLaunchRecords,
  writeStructuredAgentLaunchRecord
} from './structured-agent-session-launch-persistence'
import {
  type StructuredAgentLaunchPersistedRecord,
  structuredAgentLaunchRecordFor
} from './structured-agent-session-launch-record'

export type StructuredLaunchState = StructuredLaunchRecoveryState & {
  identity: string
  /** Fixed by the caller that opened this launch so coalesced prompts use one delivery mode. */
  promptDelivery: StructuredAgentLaunchOptions['promptDelivery']
  callers: StructuredLaunchCallerGroup
  /** The host's refusal behind the last failed attempt, worded beside Retry. Absent when the
   *  failure named none. */
  failure?: StructuredLaunchFailure
  selection: StructuredLaunchSelection
  /** A host list showed the chat, so its create reply needs no protection from older lists. */
  hostListed?: true
  /** The bounded caller finished; this identity may still observe exact late evidence. */
  operationEnded?: true
}

const structuredLaunchesBySessionId = new Map<string, StructuredLaunchState>()
const structuredLaunchListeners = new Set<() => void>()

export function structuredLaunchSessionIds(): IterableIterator<string> {
  return structuredLaunchesBySessionId.keys()
}

export function clearStructuredLaunchStateStoreForTests(): void {
  structuredLaunchesBySessionId.clear()
  structuredLaunchListeners.clear()
}

export function notifyStructuredLaunchListeners(): void {
  function* changes(): Generator<readonly [string, StructuredAgentLaunchPersistedRecord | null]> {
    for (const state of structuredLaunchesBySessionId.values()) {
      yield [state.intent.sessionId, structuredLaunchRecord(state)]
    }
  }
  updateStructuredAgentLaunchRecords(changes())
  for (const listener of structuredLaunchListeners) {
    listener()
  }
}

export function subscribeStructuredAgentLaunchStatus(listener: () => void): () => void {
  structuredLaunchListeners.add(listener)
  return () => structuredLaunchListeners.delete(listener)
}

export function getStructuredLaunchStateBySessionId(
  sessionId: string
): StructuredLaunchState | undefined {
  return structuredLaunchesBySessionId.get(sessionId)
}

export function setStructuredLaunchState(state: StructuredLaunchState): void {
  structuredLaunchesBySessionId.set(state.intent.sessionId, state)
  persistStructuredLaunchState(state)
}

export function deleteStructuredLaunchStateIfCurrent(state: StructuredLaunchState): boolean {
  if (structuredLaunchesBySessionId.get(state.intent.sessionId) !== state) {
    return false
  }
  structuredLaunchesBySessionId.delete(state.intent.sessionId)
  deleteStructuredAgentLaunchRecord(state.intent.sessionId)
  return true
}

function persistStructuredLaunchState(state: StructuredLaunchState): void {
  const record = structuredLaunchRecord(state)
  if (record) {
    writeStructuredAgentLaunchRecord(record)
  } else {
    deleteStructuredAgentLaunchRecord(state.intent.sessionId)
  }
}

function structuredLaunchRecord(
  state: StructuredLaunchState
): StructuredAgentLaunchPersistedRecord | null {
  const lifecycle = launchStateLifecycle(state)
  if (lifecycle === 'published' || lifecycle === 'cancelled') {
    return null
  }
  return {
    ...structuredAgentLaunchRecordFor(state.intent, lifecycle),
    ...(lifecycle === 'failed' ? { failedAt: state.callers.failedAt } : {})
  }
}

export function getPersistedStructuredAgentLaunchRecord(
  sessionId: string
): StructuredAgentLaunchPersistedRecord | undefined {
  return readStructuredAgentLaunchRecord(sessionId)
}

export function structuredLaunchStates(): IterableIterator<StructuredLaunchState> {
  return structuredLaunchesBySessionId.values()
}
