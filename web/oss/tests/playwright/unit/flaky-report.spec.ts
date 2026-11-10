import {expect, test} from "@playwright/test"

import {
    addOutcome,
    collectFlakySpecs,
    emptyCounts,
    formatFlakyJobSummary,
    formatLiveSummary,
} from "@agenta/web-tests/playwright/flaky-report"

test("a recovered retry is counted as flaky, not passed", () => {
    const counts = emptyCounts()
    addOutcome(counts, "expected")
    addOutcome(counts, "flaky")
    addOutcome(counts, "unexpected")
    addOutcome(counts, "skipped")

    expect(counts).toEqual({passed: 1, failed: 1, skipped: 1, flaky: 1})
    expect(formatLiveSummary(counts)).toBe("[test] 1 passed, 1 failed, 1 flaky, 1 skipped")
})

test("the JSON report walker lists flaky specs and ignores clean ones", () => {
    const specs = collectFlakySpecs({
        stats: {flaky: 1},
        suites: [
            {
                title: "oss",
                suites: [
                    {
                        title: "settings/model-hub.spec.ts",
                        specs: [
                            {
                                title: "should test a stored provider connection and keep it listed",
                                file: "settings/model-hub.spec.ts",
                                tests: [{status: "flaky"}],
                            },
                            {
                                title: "should allow full add provider",
                                file: "settings/model-hub.spec.ts",
                                tests: [{status: "expected"}],
                            },
                        ],
                    },
                ],
            },
        ],
    })

    expect(specs).toEqual([
        {
            title: "oss > settings/model-hub.spec.ts > should test a stored provider connection and keep it listed",
            file: "settings/model-hub.spec.ts",
        },
    ])
})

test("the job summary names the flaky list when it is not empty", () => {
    const markdown = formatFlakyJobSummary(
        [{title: "Playground: Run Variant > Should run single view variant for chat"}],
        1,
    )

    expect(markdown).toContain("## Flaky tests")
    expect(markdown).toContain("Should run single view variant for chat")
    expect(markdown).toContain("failOnFlakyTests")
    expect(markdown).toContain("#6912")
})

test("the job summary says none when every test passed first time", () => {
    expect(formatFlakyJobSummary([], 0)).toContain("None.")
})
