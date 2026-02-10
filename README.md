# APITOLL Demo — AI Agents Pay for APIs with USDC

Your AI agent calls an API. Gets HTTP 402. Pays $0.001 USDC. Gets the data. Settlement in 2 seconds on Base L2.

No API keys. No signup. No invoices. Just pay and go.

## Quick Start (30 seconds)

```bash
git clone https://github.com/TasnidChain/apitoll-demo.git
cd apitoll-demo
npm install
npx tsx demo.ts
```

That's it. The demo hits 75 live paid endpoints on `api.apitoll.com` and shows you the x402 protocol in action.

## What You'll See

```
═══════════════════════════════════════════════════════
║  APITOLL — x402 Protocol Demo
║  75 paid APIs • USDC on Base • No API keys needed
═══════════════════════════════════════════════════════

1. Discover the marketplace
──────────────────────────────────────────────────
   ✓ 75 paid endpoints live on api.apitoll.com

   original       10 endpoints
   data           10 endpoints
   text            7 endpoints
   finance         4 endpoints
   ...

2. Call a paid endpoint (without paying)
──────────────────────────────────────────────────
   GET /api/weather?city=Tokyo

   Status: 402 Payment Required

   Payment Requirements:
     Protocol   x402 (HTTP 402)
     Network    eip155:8453 (Base L2)
     Amount     $0.001 USDC
     Pay To     0x2955B6...73B0a5
     Asset      USDC on Base
```

## Actually Pay with USDC

To run the full payment flow with real USDC on Base:

```bash
APITOLL_API_KEY=your-key npx tsx demo.ts --pay
```

Get an API key at [apitoll.com/dashboard](https://apitoll.com/dashboard).

## How x402 Works

```
Agent                         API Server                    Base L2
  │                               │                            │
  │── GET /api/weather ──────────▶│                            │
  │◀─── 402 Payment Required ────│                            │
  │     (pay $0.001 USDC to 0x…) │                            │
  │                               │                            │
  │── Sign USDC transfer ────────────────────────────────────▶│
  │◀─── tx confirmed (2s) ───────────────────────────────────│
  │                               │                            │
  │── GET /api/weather ──────────▶│                            │
  │   + X-PAYMENT: {txHash}       │── verify on-chain ───────▶│
  │                               │◀─── valid ───────────────│
  │◀─── 200 OK ──────────────────│                            │
  │     { city: "Tokyo", … }      │                            │
```

## Add to Your Agent (6 lines)

```typescript
import { createAgentWallet, createFacilitatorSigner } from "@apitoll/buyer-sdk";

const agent = createAgentWallet({
  name: "MyBot",
  chain: "base",
  policies: [{ type: "budget", dailyCap: 1.00, maxPerRequest: 0.05 }],
  signer: createFacilitatorSigner({
    facilitatorUrl: "https://pay.apitoll.com",
    apiKey: process.env.APITOLL_API_KEY,
  }),
});

// Every fetch auto-handles 402 → pay → retry
const resp = await agent.fetch("https://api.apitoll.com/api/weather?city=Tokyo");
const data = await resp.json();
// { city: "Tokyo", temperature: 22, description: "Clear sky" }
```

## Available APIs (75 endpoints)

| Category | Endpoints | Price | Examples |
|----------|-----------|-------|---------|
| Data & Lookup | 10 | $0.001 | Weather, IP, DNS, Currency, Country |
| Text Processing | 7 | $0.001–0.002 | Sentiment, Keywords, Translate, Summarize |
| Web & URL | 7 | $0.002 | Meta tags, SSL check, Headers, Scrape |
| Compute & Dev | 9 | $0.001 | Hash, UUID, Regex, Cron, JSON validate |
| Finance | 4 | $0.002 | Stock quotes, Forex, Price history |
| Enrichment | 3 | $0.005–0.02 | Domain, GitHub profile, Wikipedia |
| Blockchain | 1 | $0.002 | ENS resolution |
| Media | 5 | $0.002 | QR code, Color info, Favicon, Avatar |
| + 8 more categories | 29 | $0.001–0.002 | NLP, Transform, DateTime, Security, Math |

Full list: `GET https://api.apitoll.com/api/tools`

## Framework Integrations

Works with every agent framework:

- **LangChain / CrewAI** — `npm install @apitoll/langchain`
- **OpenAI Agents** — Use as function tools
- **Anthropic Claude** — MCP server: `npm install @apitoll/mcp-server`
- **Vercel AI SDK** — Direct fetch integration
- **Any framework** — `agent.fetch()` is a drop-in `fetch()` replacement

## Links

- **Live API**: [api.apitoll.com](https://api.apitoll.com/health)
- **Dashboard**: [apitoll.com/dashboard](https://apitoll.com/dashboard)
- **npm**: [@apitoll/buyer-sdk](https://www.npmjs.com/package/@apitoll/buyer-sdk)
- **Main repo**: [github.com/TasnidChain/APITOLL](https://github.com/TasnidChain/APITOLL)

## License

MIT
