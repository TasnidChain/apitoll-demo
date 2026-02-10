# Twitter/X Thread

---

## Tweet 1 (Main — attach demo.gif)

I built payment infrastructure for AI agents.

75 live API endpoints. $0.001 USDC per call. No API keys. No signup.

Agent calls API → gets HTTP 402 → pays USDC → gets data.

Settlement in 2 seconds on Base.

Here's what it looks like 👇

[ATTACH demo.gif]

---

## Tweet 2

How it works:

1. Agent calls any endpoint
2. Server returns HTTP 402 "Payment Required"
3. Agent pays $0.001 USDC on Base L2
4. Retries with payment proof
5. Gets data back

The entire flow is automatic. The agent doesn't even know it's paying — the SDK handles everything.

---

## Tweet 3

For agent developers, it's 6 lines:

```
const agent = createAgentWallet({
  name: "MyBot",
  chain: "base",
  policies: [{ type: "budget", dailyCap: 1.00 }],
  signer: createFacilitatorSigner({ ... }),
});

await agent.fetch("api.apitoll.com/api/weather?city=Tokyo");
// 402 → pay → 200. Automatic.
```

npm install @apitoll/buyer-sdk

---

## Tweet 4

75 endpoints live right now:

• Weather, crypto prices, stock quotes
• Sentiment analysis, keyword extraction
• DNS lookup, SSL checks, domain enrichment
• ENS resolution, GitHub profiles
• QR codes, language detection
• And 60+ more

All returning real data from real APIs.

---

## Tweet 5

For API sellers:

Add 3 lines of middleware. Your API now accepts USDC micropayments.

No Stripe account. No billing system. No minimum transaction.

$0.001 per call? No problem. Try that with Stripe's $0.30 fee.

npm install @apitoll/seller-sdk

---

## Tweet 6

Why this matters for AI agents:

Agents can't sign up for API accounts.
Agents can't manage API keys.
Agents can't handle invoices.

But they CAN send $0.001 USDC.

x402 turns every API into a vending machine. Pay and go.

---

## Tweet 7

Try it yourself (no wallet needed):

git clone github.com/TasnidChain/apitoll-demo
cd apitoll-demo && npm install
npx tsx demo.ts

30 seconds. See the full x402 protocol in your terminal.

GitHub: github.com/TasnidChain/APITOLL
Live: api.apitoll.com
npm: @apitoll/buyer-sdk

---

# Alternative Single Tweet (if you don't want a thread)

I built payment infrastructure for AI agents.

75 live APIs. $0.001 USDC per call. No API keys.

Agent calls API → 402 → pays USDC on Base → gets data. 2 second settlement.

npm install @apitoll/buyer-sdk

Try it: github.com/TasnidChain/apitoll-demo

[ATTACH demo.gif]
