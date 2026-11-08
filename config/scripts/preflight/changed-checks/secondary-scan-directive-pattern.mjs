import { readFileSync } from 'node:fs'

function readConfigRules(configPath) {
  const url = new URL(`../../../../${configPath}`, import.meta.url)
  const config = JSON.parse(readFileSync(url, 'utf8'))
  return [config.rules, ...(config.overrides ?? []).map((override) => override.rules)].flatMap(
    (rules) => Object.keys(rules ?? {})
  )
}

// The root scan loads neither tsgolint nor the import plugin, so these rules' suppressions belong to their own scans.
const rootRuleNames = new Set(readConfigRules('.oxlintrc.json'))
const secondaryOnlyRuleNames = [
  ...new Set([
    ...readConfigRules('config/oxlint-code-quality-type-aware.json'),
    ...readConfigRules('config/oxlint-code-quality-native-plugins.json')
  ])
].filter((rule) => !rootRuleNames.has(rule))

export const SECONDARY_SCAN_DISABLE_PATTERN = new RegExp(
  String.raw`\/[/*]\s*(?:oxlint|eslint)-disable(?:-next-line|-line)?\s[^\n]*(?:${secondaryOnlyRuleNames.map((rule) => rule.replaceAll('/', '\\/')).join('|')})(?![\w-])`
)
