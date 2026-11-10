import {readFileSync} from "fs"

import {collectFlakySpecs, formatFlakyJobSummary} from "../flaky-report.ts"

const reportPath = process.argv[2]
if (!reportPath) {
    console.error("usage: summarize-flaky.ts <playwright-json-report>")
    process.exit(1)
}

try {
    const report = JSON.parse(readFileSync(reportPath, "utf-8")) as {
        stats?: {flaky?: number}
        suites?: unknown
    }
    process.stdout.write(formatFlakyJobSummary(collectFlakySpecs(report), report.stats?.flaky))
} catch {
    process.stdout.write("## Flaky tests\n\nNo Playwright JSON report was produced.\n")
}
