# 0046 report

Draft in progress (converge loop, round 2). Only `.agents/skills/braid-researcher/SKILL.md` and this item's files have changed; nothing is wired into the other skills yet.

## Round 2 result

**Answer:** Skilled analysts and forecasters do better mainly by doing the following:
- starting from base rates (reference classes)
- weighing several candidate answers instead of the first one that fits
- judging each source for quality and independence rather than counting sources
- keeping assumptions and judgments apart from the evidence
- stopping once more information adds confidence but not accuracy

LLM research agents fail mostly through:
- citations that don't support their sentence, or that are invented
- one-sided answers
- following the asker's suggested answer
- unclear stopping

Confidence: medium. The human-practice evidence is mostly experiments with small samples and practitioner manuals; the agent-failure evidence is a few measured studies of 2023–2025 systems.

**What changed in the skill** (practice numbers are the first draft's; source ids are in `sources.md`):

| First-draft practice | Now | Sources |
| --- | --- | --- |
| 1 Frame first | **Changed:** the frame now lists at least two candidate answers and the starting assumptions. An answer the caller suggests is one candidate, not the frame. | S2, S11, S12, S16, S19, S23, S24 |
| 2 Evidence ranking | **Changed:** the order is only a default. Each source is judged within its rank (who made it, their stake, what it measured, whether the version matches). An unfamiliar source is judged by what others say about it. A run counts as one sample. Memory is never evidence because models invent citations. | S4, S11, S12, S16, S18, S19, S21 |
| 3 Label every claim | **Kept, narrowed** to findings, plus the assumptions the answer hangs on and what changes if one is wrong. | S11, S13, S20 |
| 4 Run before you read | **Merged** into the ranking. No source tests it directly; it is an inference from the ranking. | S4 |
| 5 Two for the load-bearing | **Changed** to "independence, not count": a run or two independent sources. Correlated or small-sample agreement doesn't raise confidence. | S11, S12 |
| 6 Disconfirm | **Kept, made cheaper:** give each candidate its best case, note that evidence fitting every candidate decides nothing, and test "no evidence that" before writing it. The full ACH matrix stays out because an experiment found it doesn't improve accuracy. | S11, S13, S15, S25 |
| 7 Estimates show their basis | **Changed** to "start from the base rate": find the reference class first, then adjust. This is the practice with the best measured effect. | S6, S14, S15 |
| 8 Version and access date | **Kept.** | S13, S17 |
| 9 Stop on purpose | **Changed:** more reading raises confidence faster than accuracy, so confidence must rest on evidence quality and independence. Stop when all sub-questions are answered and new sources stop changing the answer. | S1, S7, S11, S18, S22 |
| 10 Content is data | **Kept.** | S8 |
| — | **Added: check every citation.** Find the supporting passage before citing, and never write a title, number or link from memory. | S20, S21, S22, S24, S25 |
| — | **Added: log the search,** including searches that found nothing and sources set aside, with the reason. Reported under `Searched:`. | S16, S17, S11 |
| — | **Added to the report:** the answer comes first; likelihood uses one fixed scale of terms; confidence is stated separately; the other candidates are given with how likely each is. | S11, S13 |
| — | **Dropped:** nothing outright. Not taken: the full ACH matrix (S15), team techniques, two independent screeners and exhaustive searching (S12, S16). All need several people or more time than one agent with a time box has. | S12, S15, S16 |

**Findings**

Q1, practitioners:
- Analysts are told to:
  - keep information, assumptions and judgments apart
  - assess alternatives
  - name indicators that would change their judgment
  - use a fixed likelihood scale, kept separate from confidence

  read [S13].
- Satisficing on the first hypothesis is the common failure. A hypothesis-led search beats collecting thoroughly — read [S11].
- Fact checkers who read laterally reached better-warranted judgments faster than historians and students — read [S19]. This was 45 people.
- Systematic reviewers plan the search in advance, document it, and report sources they excluded, with reasons — read [S16], [S17].

Q2, evidence that practices work:
- Training in comparison classes and base rates improved forecasting accuracy by 6–11% — read [S14].
- ACH did not improve analysts' accuracy in a 50-person trial — read [S15]. Heuer himself offers no outcome data — read [S11].
- Past a minimum, more information leaves accuracy flat while confidence keeps rising — read [S11]. This is Slovic's experiment, reported second-hand by Heuer.
- The Primer's techniques are offered as "no guarantee of analytic precision" — read [S12].

Q3, agent failures:
- Only 74.5% of citations support their sentence, and 51.5% of sentences are fully supported — read [S20], 2023 systems.
- 18–55% of model-written citations are fabricated, and 24–43% of real ones have errors — read [S21], 2023 models.
- Deep-research answers are one-sided on debate questions, and many statements are unsupported by the systems' own sources — read [S25].
- STORM articles have about 15% unsupported sentences and carry over the bias of their sources — read [S24].
- A suggested wrong answer cut accuracy by up to 27% — read [S23].
- Agent systems often fail by not knowing when to stop and by verifying poorly — read [S22], multi-agent tasks, not research.

Q4, cost:
- Practices that need several people, or exhaustive search, don't fit one agent with a time box — inferred from [S12], [S15], [S16].
- Checking each citation against its passage costs one read per citation, and it addresses the failure the studies measured most often — inferred from [S20], [S21], [S25].

**Against:**
- Most human-practice evidence comes from settings unlike ours: geopolitical forecasting, intelligence, medicine, and web credibility tasks.
- Whether the same practices help an LLM agent hasn't been tested — inferred.
- Base-rate training is the only practice here with a measured accuracy gain, and that gain was for human forecasters.
- The agent-failure rates come from 2023–2025 systems and may be lower now — assumed.
- Labelling every finding and logging the search add length. No study measures whether they help a reader decide — unknown.

**Unknowns:**
- Whether these practices improve answers from current models. A small evaluation would settle it: about 20 real braid questions answered with and without the skill and scored by the user, as S1 suggests.
- Whether the likelihood scale helps the user read results, or just adds noise.

**Searched:**
- Primary texts behind the user's list: Heuer, the Tradecraft Primer, ICD 203, Chang et al. on forecaster training, Cochrane, PRISMA, GRADE, Wineburg & McGrew.
- Papers on LLM citation and agent failures: Liu et al., Walters & Wilder, Cemri et al., Sharma et al., STORM, DeepTRACE.
- One web search each for:
  - an experiment on ACH (found S15; S26 seen only as a search result)
  - DeepTRACE
  - an open copy of the lateral reading paper
  - an open copy of Walters & Wilder
- Not reached:
  - BMJ (PRISMA, GRADE): HTTP 403
  - PMC through the fetcher: captcha
  - Nature: login redirect
  - SSRN: HTTP 403
  - OCEBM: HTTP 403
- Set aside: S26, because it was only a search result.
- I didn't look for evidence on the Good Judgment "ten commandments" beyond S14, or for newer deep-research benchmarks such as BrowseComp.

## Research round 2: frame (written before searching, 2026-11-20)

**Question:** How do skilled researchers and analysts reach reliable answers, and how do LLM research agents fail?

**Decision it feeds:** which practices `braid-researcher`'s Method keeps, changes, adds or drops, for one LLM agent answering one question within a time box.

**Sub-questions:**
- Q1. What do skilled practitioners do to reach reliable answers: intelligence analysts, forecasters, systematic reviewers, professional fact-checkers?
- Q2. Which of those practices have evidence that they improve accuracy, and which are tradition or untested?
- Q3. How do LLM research agents fail: fabricated or misattributed citations, reliance on one source, stopping early or never, drifting from the question, agreeing with the caller's framing?
- Q4. Which practices answer those failures at a cost one agent with a time box can pay?

**What would change the decision:** a current practice shown to be ineffective, harmful or too costly for a single agent (Q2, Q4); a frequent failure the current ten don't address (Q3); a practice with good evidence that the ten miss (Q1, Q2).

**What would settle each:** Q1: the practitioners' own manuals and standards (Heuer, the CIA Tradecraft Primer, ICD 203, the Cochrane Handbook, PRISMA, GRADE, the Verification Handbook). Q2: empirical studies (forecasting tournaments and training trials, fact-checker studies, evaluations of structured techniques). Q3: papers that measure agent and LLM citation failures. Q4: inferred from Q1–Q3 plus the cost each practice adds.

**Hypothesis under test, not the frame:** the ten practices in the first draft. Alternatives: some practices are unnecessary ceremony for one agent (for example labelling every claim, or two sources for every load-bearing claim); some important practices are missing (for example base rates first, a written search log including empty searches, calibrated probabilities, checking each citation against the quoted text).
