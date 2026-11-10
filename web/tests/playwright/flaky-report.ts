export type OutcomeCounts = {
    passed: number
    failed: number
    skipped: number
    flaky: number
}

export function emptyCounts(): OutcomeCounts {
    return {passed: 0, failed: 0, skipped: 0, flaky: 0}
}

/** Count a Playwright `test.outcome()` value. Flaky is not treated as passed. */
export function addOutcome(counts: OutcomeCounts, outcome: string): void {
    if (outcome === "skipped") {
        counts.skipped++
    } else if (outcome === "expected") {
        counts.passed++
    } else if (outcome === "flaky") {
        counts.flaky++
    } else if (outcome === "unexpected") {
        counts.failed++
    }
}

export function formatLiveSummary(counts: OutcomeCounts): string {
    const {passed, failed, skipped, flaky} = counts
    return `[test] ${passed} passed, ${failed} failed, ${flaky} flaky, ${skipped} skipped`
}

type JsonTest = {status?: string}
type JsonSpec = {title?: string; file?: string; tests?: JsonTest[]}
type JsonSuite = {title?: string; specs?: JsonSpec[]; suites?: JsonSuite[]}

export type PlaywrightJsonReport = {
    stats?: {flaky?: number}
    suites?: JsonSuite[]
}

export type FlakySpec = {title: string; file?: string}

export function collectFlakySpecs(report: PlaywrightJsonReport): FlakySpec[] {
    const found: FlakySpec[] = []

    const walk = (suite: JsonSuite, parents: string[]) => {
        const titles = suite.title ? [...parents, suite.title] : parents
        for (const spec of suite.specs ?? []) {
            const isFlaky = (spec.tests ?? []).some((test) => test.status === "flaky")
            if (!isFlaky) continue
            const title = [...titles, spec.title].filter(Boolean).join(" > ")
            found.push({title, file: spec.file})
        }
        for (const child of suite.suites ?? []) {
            walk(child, titles)
        }
    }

    for (const suite of report.suites ?? []) {
        walk(suite, [])
    }
    return found
}

export function formatFlakyJobSummary(specs: FlakySpec[], statsFlaky?: number): string {
    const count = statsFlaky ?? specs.length
    const lines = ["## Flaky tests", ""]

    if (count === 0 && specs.length === 0) {
        lines.push("None. Every Playwright test passed on the first attempt.")
        return `${lines.join("\n")}\n`
    }

    lines.push(
        "These tests failed once, then passed on retry. Playwright still fails the job (`failOnFlakyTests`), so a recovered flake cannot green the release gate ([#6912](https://github.com/Agenta-AI/agenta/issues/6912)).",
        "",
    )
    for (const spec of specs) {
        const location = spec.file ? ` (\`${spec.file}\`)` : ""
        lines.push(`- ${spec.title}${location}`)
    }
    if (specs.length === 0) {
        lines.push(`- Playwright reported ${count} flaky test(s), but no spec titles were found.`)
    }
    return `${lines.join("\n")}\n`
}
