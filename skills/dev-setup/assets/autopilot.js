export const meta = {
  name: 'autopilot',
  description: 'Build the plan phase by phase: every feature test-first on Sonnet, every phase verified on Opus, gate-checked and committed as a few grouped commits. Never pushes.',
  whenToUse: 'Unattended runs, for example overnight. Optional args: { phases: n } to stop after n phases. Stops at the first feature or phase it cannot finish cleanly.',
  phases: [
    { title: 'Plan', detail: 'read docs/PLAN.md and git status' },
    { title: 'Build', detail: 'one fresh Sonnet agent per feature, test-first, staged when done', model: 'sonnet' },
    { title: 'Verify', detail: 'once per phase: checks, every feature card, the gate and reviewers, in parallel, on Opus', model: 'opus' },
    { title: 'Fix', detail: 'Sonnet, every round', model: 'sonnet' },
    { title: 'Checkpoint', detail: 'set a failed attempt aside' },
    { title: 'Ship', detail: 'a few grouped commits per phase' },
  ],
}

const REVIEWERS = ['ponytail-reviewer', 'correctness-reviewer']
const BUILD_MODEL = 'sonnet'
const CHECK_MODEL = 'opus'
const MAX_FIX_ROUNDS = 3
const MAX_PHASES = args && Number.isInteger(args.phases) && args.phases > 0 ? args.phases : Infinity
const UNATTENDED = 'Nobody is watching this run, so never ask the user anything. Never push, reset, rebase, or delete work you did not create.'
const FEATURE_SCOPE = 'Staged changes are earlier features of this phase. This feature is only the unstaged changes and untracked files.'
const PHASE_SCOPE = 'This is every uncommitted change, staged or not: all the features of the phase together.'

const PLAN = {
  type: 'object',
  properties: {
    phase: { type: 'string' },
    features: { type: 'array', items: { type: 'string' } },
    stop: { type: 'string' },
  },
  required: ['phase', 'features', 'stop'],
}

const BUILD = {
  type: 'object',
  properties: {
    status: { type: 'string', enum: ['done', 'blocked'] },
    summary: { type: 'string' },
  },
  required: ['status', 'summary'],
}

const PROBLEMS = {
  type: 'object',
  properties: { problems: { type: 'array', items: { type: 'string' } } },
  required: ['problems'],
}

const COMMITS = {
  type: 'object',
  properties: {
    commits: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          hash: { type: 'string' },
          message: { type: 'string' },
        },
        required: ['hash', 'message'],
      },
    },
  },
  required: ['commits'],
}

const run = []

function finish(reason) {
  return { stoppedBecause: reason, phases: run }
}

async function review(subject, scope, checks, label) {
  const results = await parallel([
    () => agent(
      `${UNATTENDED} Independently verify ${subject}. ${scope} Do not edit any file. ${checks} Return only real problems, each with file and line. Return an empty list if there are none.`,
      { label: `verify ${label}`, phase: 'Verify', schema: PROBLEMS, model: CHECK_MODEL, effort: 'high' },
    ),
    ...REVIEWERS.map((reviewer) => () => agent(
      `Review ${subject}. ${scope} Return each item that must change as one problem with file and line. Leave out optional suggestions. Return an empty list if nothing must change.`,
      { label: `${reviewer} ${label}`, phase: 'Verify', agentType: reviewer, schema: PROBLEMS, model: CHECK_MODEL },
    )),
  ])
  if (results.some((result) => !result)) return ['A verification agent failed to run, so this work is unverified.']
  return results.flatMap((result) => result.problems)
}

async function verifyUntilClean(subject, scope, checks, label) {
  let problems = await review(subject, scope, checks, label)
  let rounds = 0
  while (problems.length && rounds < MAX_FIX_ROUNDS) {
    rounds += 1
    log(`${label}: fix round ${rounds}, ${problems.length} problems`)
    await agent(
      `${UNATTENDED} Fix these problems in ${subject}. ${scope} Never weaken or delete a test to make it pass; if a test itself is wrong, fix the test and say why. Run the check script when done.\n\n${problems.map((problem) => `- ${problem}`).join('\n')}`,
      { label: `fix ${label} round ${rounds}`, phase: 'Fix', model: BUILD_MODEL },
    )
    problems = await review(subject, scope, checks, `${label} round ${rounds}`)
  }
  return { problems, rounds }
}

async function setAside(subject, label) {
  await agent(
    `${UNATTENDED} ${subject} could not be finished cleanly. Set the unstaged attempt aside without losing it: run git stash push --keep-index --include-untracked -m "autopilot: ${label}", then run git status and confirm that only staged changes remain.`,
    { label: `set aside ${label}`, phase: 'Checkpoint', model: BUILD_MODEL, effort: 'low' },
  )
}

const PHASE_CHECKS = 'Run the check script and report every failure. Prove the phase\'s Gate line in docs/PLAN.md by running the commands that demonstrate it; report a problem if it fails or cannot be shown without a person. Then, for every feature of the phase, read its card in docs/PLAN.md, its tests and its code: every "Done when" line needs a test that would fail if that behaviour broke, and nothing outside the card\'s "Touches" and scope may change without a reason. Report any line without a test, any test that would still pass with the feature removed, and any existing test that was weakened or deleted. Last, look for what only shows across features: repeated code, drifted contracts, code a later feature made unused.'

while (run.length < MAX_PHASES) {
  phase('Plan')
  const plan = await agent(
    `${UNATTENDED} Read docs/PLAN.md and run git status. The current phase is the first one whose heading is not marked (shipped). Return its name, and its unticked features in order, each as the feature's name in bold on its checkbox line; return an empty list if all are ticked. Set stop to a one-line reason when every phase is shipped, or when there are uncommitted changes that do not belong to features of the current phase. Otherwise set stop to an empty string.`,
    { label: `read plan ${run.length + 1}`, phase: 'Plan', schema: PLAN, model: BUILD_MODEL, effort: 'low' },
  )
  if (!plan) return finish('The plan could not be read.')
  if (plan.stop) return finish(plan.stop)

  const current = { phase: plan.phase, features: [], commits: [] }
  run.push(current)
  log(`${plan.phase}: ${plan.features.length} features to build`)

  for (const [index, feature] of plan.features.entries()) {
    const label = `p${run.length} ${index + 1}/${plan.features.length}`
    const subject = `the feature "${feature}"`
    const built = await agent(
      `${UNATTENDED} Never commit. Build this feature from docs/PLAN.md: "${feature}". ${FEATURE_SCOPE} Its card in docs/PLAN.md says what to touch and when it is done. Follow .agents/skills/feature/SKILL.md, with two changes: skip its test audit step, because independent agents check the whole phase after you; and if the feature depends on an open question, its card leaves a design decision open, or you would need to ask the user anything, stop before writing code and return blocked with the exact question. Return done only when the tests were written first and failed for the right reason, they now pass, the check script passes, and the feature is ticked in docs/PLAN.md. Only when done, stage it as a checkpoint with git add -A.`,
      { label: `build ${label}`, phase: 'Build', schema: BUILD, model: BUILD_MODEL },
    )
    if (!built || built.status !== 'done') {
      await setAside(subject, label)
      current.features.push({ feature, status: 'blocked', reason: built ? built.summary : 'The build agent failed to run.' })
      return finish(`Blocked on ${feature}. Earlier features of the phase are staged, not committed.`)
    }
    current.features.push({ feature, status: 'done', summary: built.summary })
  }

  phase('Ship')
  const shipLabel = `p${run.length} ship`
  const phaseSubject = `the whole phase "${plan.phase}"`
  const phaseReview = await verifyUntilClean(phaseSubject, PHASE_SCOPE, PHASE_CHECKS, shipLabel)
  current.fixRounds = phaseReview.rounds
  if (phaseReview.problems.length) {
    await setAside(phaseSubject, shipLabel)
    current.problems = phaseReview.problems
    return finish(`${plan.phase} failed its phase review or gate. Its features are staged, not committed.`)
  }

  const shipped = await agent(
    `${UNATTENDED} ${plan.phase} passed its phase review and gate. Ship it: make docs/ARCHITECTURE.md match the code if that file exists; add the phase's user-visible changes under [Unreleased] in CHANGELOG.md if that file exists; mark the phase heading in docs/PLAN.md with (shipped). Then commit the phase as a few grouped commits, not one for the whole phase and not one per feature. Group features that belong together, for example a data layer and then the UI on top of it, usually two to four groups; a phase that is one small group gets one commit. Features that touch the same source file go in the same group, so no feature is split across commits. Run git add -A, then git restore --staged . to unstage everything. Then, for each group in plan order: git add only its files, check that no .env file, playbook file or CLAUDE.local.md is staged, and commit with exactly one line, <type>: <summary> in lowercase, at most 50 characters, with no body and no trailers. docs/PLAN.md, CHANGELOG.md and docs/ARCHITECTURE.md go in the last commit. Finish with git status showing none of the phase's changes left. Return every commit's hash and message, in order.`,
    { label: `commit ${shipLabel}`, phase: 'Ship', schema: COMMITS },
  )
  if (!shipped || !shipped.commits.length) return finish(`${plan.phase} passed but committing failed. Check git log and git status for what was committed.`)
  current.commits = shipped.commits
  log(`${plan.phase} committed: ${shipped.commits.map((commit) => commit.message).join(', ')}`)
}

return finish(`Stopped after the number of phases asked for (${MAX_PHASES}).`)
