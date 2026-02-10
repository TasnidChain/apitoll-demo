# Show HN: APITOLL – Payment infrastructure for AI agents (75 live APIs, USDC micropayments)

I built a payment layer that lets AI agents pay for API calls with USDC micropayments on Base L2.

**The problem:** AI agents need data from paid APIs, but they can't sign up for accounts or manage API keys. Stripe's $0.30 minimum makes micropayments impossible.

**How it works:** The x402 protocol (HTTP 402 Payment Required). Agent calls an API → gets 402 → pays $0.001 USDC → gets data. Settlement in ~2 seconds. No signup, no API keys, no invoices.

**What's live right now:**
- 75 paid API endpoints at api.apitoll.com (weather, crypto prices, stock quotes, sentiment analysis, DNS, ENS resolution, etc.)
- $0.001–$0.02 per call
- Buyer SDK on npm: `npm install @apitoll/buyer-sdk`
- Works with LangChain, CrewAI, OpenAI Agents, Anthropic MCP, or any framework

**Try it in 30 seconds (no wallet needed):**

```
git clone https://github.com/TasnidChain/apitoll-demo
cd apitoll-demo && npm install
npx tsx demo.ts
```

This shows the x402 handshake — your terminal hits live endpoints, gets 402 responses with USDC payment requirements, and shows how agents auto-pay.

**Agent integration is 6 lines:**

```typescript
import { createAgentWallet, createFacilitatorSigner } from "@apitoll/buyer-sdk";

const agent = createAgentWallet({
  name: "MyBot", chain: "base",
  policies: [{ type: "budget", dailyCap: 1.00, maxPerRequest: 0.05 }],
  signer: createFacilitatorSigner({ facilitatorUrl: "https://pay.apitoll.com" }),
});

const resp = await agent.fetch("https://api.apitoll.com/api/weather?city=Tokyo");
// 402 → pay $0.001 USDC → 200 with data. Automatic.
```

The SDK handles the full flow: hit API → parse 402 → check budget policy → sign payment → retry with proof → get data. Budget caps, vendor allowlists, rate limits all built in.

**For API sellers:** Add 3 lines of Express middleware and your API accepts USDC micropayments. No Stripe, no billing system. `npm install @apitoll/seller-sdk`.

**Revenue model:** 3% platform fee on every payment, collected on-chain.

**Tech stack:** TypeScript, Base L2, USDC, Express, Convex, Railway. All open source.

GitHub: https://github.com/TasnidChain/APITOLL
Demo repo: https://github.com/TasnidChain/apitoll-demo
Live API: https://api.apitoll.com/health
npm: https://www.npmjs.com/package/@apitoll/buyer-sdk
