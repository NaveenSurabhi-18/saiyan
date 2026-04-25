# AI Video Integration — Future Roadmap

> Status: Parked for future consideration. Not blocking any current work.
> Revisit when: product has 10+ paying customers and developer-to-fix cycle time is a measurable pain point.

---

## The Idea in One Sentence

Use Google Veo (AI video generation) to turn confirmed vulnerability findings into short videos — one for developers showing how the attack works, one for executives summarizing risk in plain English.

---

## Where It Actually Adds Value (Only Two Places)

### 1. Attack Replay Video — Attached to Each Confirmed Finding

When a critical/high finding is confirmed, attach a 45-60 second video:

- **Scene 1** (10s): What the endpoint is supposed to do
- **Scene 2** (15s): Animated HTTP request showing the attack
- **Scene 3** (15s): The response — data that shouldn't be accessible
- **Scene 4** (10s): Business impact in plain English
- **Scene 5** (5s): One-line fix

**Implementation**: Pre-generate 25 canonical videos (one per vulnerability class). Attach the matching video to each finding based on `vulnerability_type`. Customer data never enters the generation pipeline — videos are generic, text overlay is personalized.

**Credit cost**: ~25 one-time generations. Reused for every finding across all customers.

### 2. Executive Summary Video — Per Report Cycle

After each weekly report, generate a 90-second video:

> "This week, 47 endpoints scanned. 2 critical findings in your payment flow.
> Your WAF blocked 3,400 probes from 12 countries.
> Here's what your team is fixing this sprint."

Delivered as a shareable link. The CISO sends it to their board instead of a 40-page PDF.

---

## What NOT to Build

| Idea | Why Not |
|---|---|
| Real-time video during scanning | Veo takes 30-90s. Scan pipeline runs faster. Blocks UX. |
| Per-finding custom video generation | Expensive, slow, minimal uplift over pre-gen library |
| AI-generated marketing videos for website | Looks generic. Buyers can tell. Use real screen recordings. |
| Video for every low/medium finding | Devalues the format. Reserve for confirmed criticals only. |

---

## Sales Use Case: "Your API, Being Attacked" POC Video

Before a high-value sales call, generate a short video showing a simulated attack against an API that mirrors the prospect's stack. Not their actual API — a representative example with same patterns.

Use for deals above a meaningful threshold. Budget 1-2 generations per major prospect.

---

## Persona Targeting

| Persona | What They Want | Feature |
|---|---|---|
| Developer | Understand what's broken and why | Attack Replay on Jira ticket |
| Security engineer | Already understands findings — don't force video | Toggle to hide |
| CISO / Security manager | Communicate risk to board | Executive Summary shareable link |
| CTO / Founder (early customers) | Explain security posture to investors / enterprise procurement | Both |

---

## Risks to Keep in Mind

1. **Quality**: A bad-looking AI video on a security finding damages trust more than no video. Test output before shipping.
2. **Compliance**: Enterprise customers (finance, healthcare) will push back on customer data passing through external AI APIs. Keep scan data out of the generation pipeline entirely — generate from generic templates only.
3. **Distraction risk**: Easy to spend 3 months on video infrastructure instead of improving detector accuracy. Only build this after core product is solid.

---

## Suggested Build Order (When Ready)

1. Write scripts for all 25 attack explanation videos
2. Generate with Veo, review quality, iterate prompts
3. Host on S3/CDN, map to `vulnerability_type` enum
4. Wire into finding detail view + Jira ticket body
5. Build Executive Summary generator (templated text + narration)
6. Add "Share with stakeholders" button on report view
7. Measure: video click rate, summary link forwarding rate

---

*Last updated: April 2026*
