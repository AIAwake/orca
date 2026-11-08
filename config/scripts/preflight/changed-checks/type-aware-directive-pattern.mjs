import { readFileSync } from 'node:fs'

function readConfigRules(configPath) {
  const url = new URL(`../../../../${configPath}`, import.meta.url)
  return Object.keys(JSON.parse(readFileSync(url, 'utf8')).rules)
}

// The untyped root scan cannot run type-aware rules, so their suppressions belong to the type-aware scan.
const rootRuleNames = new Set(readConfigRules('.oxlintrc.json'))
const typeAwareOnlyRuleNames = readConfigRules('config/oxlint-code-quality-type-aware.json').filter(
  (rule) => !rootRuleNames.has(rule)
)

export const TYPE_AWARE_DISABLE_PATTERN = new RegExp(
  String.raw`\/[/*]\s*(?:oxlint|eslint)-disable(?:-next-line|-line)?\s[^\n]*(?:${typeAwareOnlyRuleNames.map((rule) => rule.replaceAll('/', '\\/')).join('|')})(?![\w-])`
)
