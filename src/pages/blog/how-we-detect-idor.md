---
layout: ../../layouts/BlogPost.astro
title: "How We Detect IDOR/BOLA Without Getting Flooded With False Positives"
date: "April 2026"
readTime: "7 min read"
tags: ["IDOR", "BOLA", "Detection"]
excerpt: "IDOR is the #1 API vulnerability class according to OWASP. Most DAST tools can't detect it reliably. Here's exactly how our 5-layer approach works."
---

IDOR (Insecure Direct Object Reference), or BOLA (Broken Object Level Authorization) in OWASP API Security Top 10 language, is the most common API vulnerability class we see in the wild. It's also the one that generic DAST tools are worst at detecting.

The reason is structural: to detect IDOR, you need two things most scanners don't have:

1. **Two different authenticated sessions** -- to check if user B can access user A's resources
2. **Semantic understanding of the response** -- to distinguish "you don't have access" from "here's the data you requested"

Here's how we built a detector that finds real IDORs without drowning your team in noise.

## The Core Problem With Naive IDOR Detection

A naive approach looks like this:
1. Send a request to `/api/v1/orders/12345` as user A
2. Replay the same request as user B
3. If the response is 200, flag as IDOR

This produces an avalanche of false positives:
- Public endpoints that are supposed to return 200 for anyone
- Endpoints that return empty data (200 but no actual access)
- Endpoints behind a CDN that caches and returns 200 even for unauthorized requests

We've seen security teams at Series B companies disable IDOR scanning entirely because their DAST tool was generating 400+ false positives per week.

## Our 5-Layer False Positive Prevention

### Layer 1: The 403 Guard

Before we even begin cross-user testing, we run every endpoint through our baseline. If the server **already blocks the request** (HTTP 403) when hit with the attacker session, there's nothing to test -- the authorization is working.

Every detector in our system calls `server_blocked_request?(mod_status)` first. If the server correctly blocked the modified request, we return `not_vulnerable` immediately.

This single check eliminates 60-70% of false positives on well-configured APIs.

### Layer 2: WAF Pre-filter

If your AWS WAF blocked the attack payload, it's not a finding -- it's your defense working. Before any detector runs, we check `WafDetector.blocked?` to see if the WAF intercepted the request.

This is where the WAF correlation pays dividends: we're not just reporting what we found, we're telling you what your defenses already caught versus what they missed.

### Layer 3: Response Semantic Comparison

A 200 response doesn't mean IDOR. We compare:

- **Response body size**: Is the body substantially larger than an empty/denied response?
- **Key field presence**: Does the response contain fields specific to user A (user ID, email, account number)?
- **Baseline deviation**: We capture a baseline response for user B hitting a resource they legitimately own -- if the IDOR response looks the same shape as a legitimate empty result, it's probably not exploitable

This is the hardest layer to get right. Our confidence scoring weights semantic content match heavily -- a confirmed IDOR needs to show actual user A data in the user B response, not just a 200 status code.

### Layer 4: Confidence Threshold Suppression

Every detector returns a confidence score between 0 and 1. Our registry suppresses any finding below `MIN_CONFIDENCE_THRESHOLD` (0.3). 

Low-confidence signals get discarded, not reported. The team never sees them. Only signals that pass multiple semantic checks make it through.

### Layer 5: AI Triage

The findings that survive layers 1-4 go to AI triage (GPT-4 running in your AWS account via our SQS queue). The AI reviews the full request/response pair and scores the likelihood of false positive.

Findings with >95% false positive confidence are auto-rejected. You never see them in your queue.

The result: our IDOR findings have a true positive rate of ~85% in production, versus the industry average of ~20-30% for generic DAST scanners.

## What a Real IDOR Finding Looks Like

When we do confirm an IDOR, the finding includes:

- **The exact request** that exposed the vulnerability (full headers, body)
- **User A's session** used to create the resource
- **User B's session** used to access it
- **The response** showing user A's data exposed to user B
- **Confidence score** with reasoning
- **WAF telemetry**: was this endpoint being probed by real attackers before we found it?

The WAF correlation on that last point is something we haven't seen anywhere else. Sometimes we find an IDOR that our automated scanner catches -- and when we check the WAF logs, the same endpoint was already being probed by an IP in our threat feed. That's the difference between a theoretical finding and an active exploitation risk.

## Testing IDOR Requires Two Real Sessions

One practical note: IDOR detection only works if you give our scanner two real, authenticated sessions for your API. If you're just testing with API keys that have the same permissions, we can't create the cross-user access scenario.

In practice, this means:
- User A: a standard user account with some owned resources
- User B: a different standard user account with no relationship to user A's resources

We extract session tokens from your OpenAPI spec's `securitySchemes`, or you can provide them directly as headers in the endpoint configuration.

---

If you want to see this in action on your own API, [book a demo](/saiyan#pricing) and we'll run a live IDOR scan during the call.
