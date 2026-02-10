#!/usr/bin/env npx tsx
/**
 * APITOLL Demo — AI agent pays for APIs with USDC micropayments
 *
 * Two modes:
 *   npx tsx demo.ts          → See the x402 protocol in action (no wallet needed)
 *   npx tsx demo.ts --pay    → Actually pay with real USDC on Base
 *
 * The x402 protocol: Agent calls API → gets HTTP 402 → pays USDC → gets data.
 * Every API call settles on Base L2 in ~2 seconds. No API keys, no signup.
 */

import { createAgentWallet, createFacilitatorSigner } from "@apitoll/buyer-sdk";

const API = "https://api.apitoll.com";
const PAY_MODE = process.argv.includes("--pay");

// ─── Pretty Printing ──────────────────────────────────────────────

const CYAN = "\x1b[36m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const DIM = "\x1b[2m";
const BOLD = "\x1b[1m";
const RESET = "\x1b[0m";

function box(title: string, subtitle: string) {
  const w = 56;
  console.log(`\n${CYAN}${"═".repeat(w)}${RESET}`);
  console.log(`${CYAN}║${RESET}  ${BOLD}${title}${RESET}`);
  console.log(`${CYAN}║${RESET}  ${DIM}${subtitle}${RESET}`);
  console.log(`${CYAN}${"═".repeat(w)}${RESET}\n`);
}

function section(n: number, title: string) {
  console.log(`\n${BOLD}${n}. ${title}${RESET}`);
  console.log(`${DIM}${"─".repeat(50)}${RESET}`);
}

function log(msg: string) {
  console.log(`   ${msg}`);
}

function ok(msg: string) {
  console.log(`   ${GREEN}✓${RESET} ${msg}`);
}

function price(label: string, amount: string) {
  console.log(`   ${YELLOW}402${RESET} │ ${GREEN}$${amount} USDC${RESET} │ ${label}`);
}

// ─── Agent Setup ──────────────────────────────────────────────────

const agent = PAY_MODE
  ? createAgentWallet({
      name: "DemoAgent",
      chain: "base",
      policies: [
        { type: "budget", dailyCap: 1, maxPerRequest: 0.05 },
        { type: "vendor_acl", allowedVendors: ["*"] },
        { type: "rate_limit", maxPerMinute: 30, maxPerHour: 200 },
      ],
      signer: createFacilitatorSigner({
        facilitatorUrl: "https://pay.apitoll.com",
        apiKey: process.env.APITOLL_API_KEY || "",
      }),
      onPayment: (receipt, url) => {
        ok(`Paid $${receipt.amount} USDC → ${new URL(url).pathname}`);
        if (receipt.txHash) {
          log(`  ${DIM}tx: https://basescan.org/tx/${receipt.txHash}${RESET}`);
        }
      },
    })
  : null;

// ─── Helper Functions ─────────────────────────────────────────────

async function show402(label: string, path: string): Promise<void> {
  try {
    const resp = await fetch(`${API}${path}`);
    const body = (await resp.json()) as any;
    const req = body.paymentRequirements?.[0];
    if (req) {
      const amount = (parseInt(req.maxAmountRequired) / 1e6).toFixed(3);
      price(label, amount);
    } else {
      log(`${resp.status} │ ${label}`);
    }
  } catch {
    log(`err │ ${label}`);
  }
}

async function callAPI(
  method: "GET" | "POST",
  path: string,
  body: any,
  format: (d: any) => string,
): Promise<void> {
  if (!agent) return;
  try {
    const opts: any = { method };
    if (body) {
      opts.headers = { "Content-Type": "application/json" };
      opts.body = JSON.stringify(body);
    }
    const resp = await agent.fetch(`${API}${path}`, opts);
    if (resp.ok) {
      const data = await resp.json();
      ok(format(data));
    } else {
      log(`${resp.status} ${resp.statusText}`);
    }
  } catch (err) {
    log(`Error: ${(err as Error).message}`);
  }
}

// ─── Demo: Show the Protocol (No Wallet Needed) ──────────────────

async function demoProtocol() {
  box("APITOLL — x402 Protocol Demo", "75 paid APIs • USDC on Base • No API keys needed");

  // 1. Discovery
  section(1, "Discover the marketplace");
  log("GET /api/tools (free — no payment required)\n");

  const toolsResp = await fetch(`${API}/api/tools`);
  const tools = (await toolsResp.json()) as any;
  ok(`${tools.totalEndpoints} paid endpoints live on api.apitoll.com\n`);

  const categories = [...new Set(tools.tools.map((t: any) => t.category))] as string[];
  for (const cat of categories) {
    const count = tools.tools.filter((t: any) => t.category === cat).length;
    log(`${cat.padEnd(14)} ${String(count).padStart(2)} endpoints`);
  }

  // 2. Hit a paid endpoint
  section(2, "Call a paid endpoint (without paying)");
  log("GET /api/weather?city=Tokyo\n");

  const resp = await fetch(`${API}/api/weather?city=Tokyo`);
  log(`Status: ${YELLOW}${resp.status} Payment Required${RESET}\n`);

  const body = (await resp.json()) as any;
  const req = body.paymentRequirements?.[0];
  if (req) {
    const amount = (parseInt(req.maxAmountRequired) / 1e6).toFixed(3);
    log(`The server says: ${BOLD}pay me first.${RESET}\n`);
    log(`${BOLD}Payment Requirements:${RESET}`);
    log(`  Protocol   x402 (HTTP 402)`);
    log(`  Network    ${req.network} (Base L2)`);
    log(`  Amount     ${GREEN}$${amount} USDC${RESET}`);
    log(`  Pay To     ${req.payTo.slice(0, 10)}...${req.payTo.slice(-6)}`);
    log(`  Asset      USDC on Base`);
  }

  // 3. Pricing across categories
  section(3, "Pricing across the marketplace");
  log("Every endpoint returns 402 with its USDC price:\n");
  log(`   ${DIM}Status │ Price       │ Endpoint${RESET}`);
  log(`   ${DIM}───────┼─────────────┼──────────────────────────────${RESET}`);

  await show402("Weather (Tokyo)", "/api/weather?city=Tokyo");
  await show402("Bitcoin + Ethereum prices", "/api/crypto/price?ids=bitcoin,ethereum");
  await show402("DNS lookup (google.com)", "/api/dns?domain=google.com");
  await show402("Language detection (French)", "/api/language?text=Bonjour+le+monde");
  await show402("SSL cert check (github.com)", "/api/ssl?domain=github.com");
  await show402("QR code generator", "/api/qr?data=https://apitoll.com");
  await show402("ENS resolve (vitalik.eth)", "/api/ens?name=vitalik.eth");
  await show402("Stock quote (AAPL)", "/api/finance/quote?symbol=AAPL");
  await show402("Domain enrichment (stripe.com)", "/api/enrich/domain?domain=stripe.com");
  await show402("GitHub profile (torvalds)", "/api/enrich/github?username=torvalds");

  // 4. Agent discovery
  section(4, "Automatic tool discovery");
  log("Every 402 response includes discovery headers so agents");
  log("find MORE tools automatically:\n");

  const discoveryHeader = resp.headers.get("x-apitoll-discovery");
  if (discoveryHeader) {
    const discovery = JSON.parse(Buffer.from(discoveryHeader, "base64").toString());
    ok(`${discovery.related_tools?.length || 0} related tools discovered from a single 402\n`);
    discovery.related_tools?.slice(0, 6).forEach((tool: any) => {
      log(`  ${tool.name.padEnd(22)} ${GREEN}$${tool.price} USDC${RESET}  ${DIM}${tool.description}${RESET}`);
    });
    if (discovery.related_tools?.length > 6) {
      log(`  ${DIM}... and ${discovery.related_tools.length - 6} more${RESET}`);
    }
  }

  // 5. How to integrate
  section(5, "Integration — 6 lines of code");
  console.log(`
   ${DIM}import { createAgentWallet, createFacilitatorSigner } from "@apitoll/buyer-sdk";${RESET}

   ${DIM}const agent = createAgentWallet({${RESET}
   ${DIM}  name: "MyBot", chain: "base",${RESET}
   ${DIM}  policies: [{ type: "budget", dailyCap: 1.00, maxPerRequest: 0.05 }],${RESET}
   ${DIM}  signer: createFacilitatorSigner({ facilitatorUrl: "https://pay.apitoll.com" }),${RESET}
   ${DIM}});${RESET}

   ${DIM}const resp = await agent.fetch("https://api.apitoll.com/api/weather?city=Tokyo");${RESET}
   ${DIM}const data = await resp.json();  // 402 → pay → 200 — automatic ✨${RESET}
`);

  // Summary
  section(6, "What just happened");
  ok(`${tools.totalEndpoints} paid API endpoints, live right now`);
  ok("$0.001 – $0.02 USDC per call");
  ok("No API key signup — just pay and go");
  ok("Settlement on Base L2 in ~2 seconds");
  ok("Works with any AI agent framework");
  console.log(`
   ${DIM}To actually pay and get data back:${RESET}
   ${BOLD}APITOLL_API_KEY=your-key npx tsx demo.ts --pay${RESET}

   ${DIM}Docs:${RESET}       https://api.apitoll.com/api/docs
   ${DIM}Dashboard:${RESET}  https://apitoll.com/dashboard
   ${DIM}npm:${RESET}        npm install @apitoll/buyer-sdk
   ${DIM}GitHub:${RESET}     https://github.com/TasnidChain/APITOLL
`);
}

// ─── Demo: Actually Pay with USDC ─────────────────────────────────

async function demoPay() {
  if (!process.env.APITOLL_API_KEY) {
    console.error("\n   Missing APITOLL_API_KEY. Run:\n");
    console.error("   APITOLL_API_KEY=your-key npx tsx demo.ts --pay\n");
    console.error("   Get a key at https://apitoll.com/dashboard\n");
    process.exit(1);
  }

  box("APITOLL — Live Payment Demo", "Real USDC payments on Base • Every call settles on-chain");

  // 1. Discovery
  section(1, "Discover tools (free)");
  const toolsResp = await fetch(`${API}/api/tools`);
  const tools = (await toolsResp.json()) as any;
  ok(`${tools.totalEndpoints} paid endpoints available`);

  // 2. Data APIs
  section(2, "Data & Lookup — paying with USDC");

  log("Weather in Tokyo...");
  await callAPI("GET", "/api/weather?city=Tokyo", null, (d) =>
    `${d.city} — ${d.temperature}°C, ${d.description}`,
  );

  log("Bitcoin + Ethereum prices...");
  await callAPI("GET", "/api/crypto/price?ids=bitcoin,ethereum", null, (d) => {
    const coins = d.prices || d;
    const btc = coins.bitcoin || coins[0];
    const eth = coins.ethereum || coins[1];
    return `BTC: $${btc?.usd?.toLocaleString() || "?"}, ETH: $${eth?.usd?.toLocaleString() || "?"}`;
  });

  log("USD → EUR exchange rate...");
  await callAPI("GET", "/api/currency?from=USD&to=EUR", null, (d) =>
    `1 ${d.from} = ${d.rate} ${d.to}`,
  );

  log("DNS records for google.com...");
  await callAPI("GET", "/api/dns?domain=google.com", null, (d) =>
    `${d.domain} — ${d.records?.length || 0} records`,
  );

  // 3. Text processing
  section(3, "Text Processing — AI-ready endpoints");

  log("Sentiment analysis...");
  await callAPI("POST", "/api/sentiment", {
    text: "The x402 protocol makes micropayments feel effortless. Settlement in 2 seconds on Base is incredible.",
  }, (d) =>
    `Score: ${d.score} (${d.comparative > 0 ? "positive" : d.comparative < 0 ? "negative" : "neutral"})`,
  );

  log("Keyword extraction...");
  await callAPI("POST", "/api/keywords", {
    text: "AI agents can now discover and pay for API calls using USDC micropayments on Base L2 via the x402 protocol.",
  }, (d) =>
    `Keywords: ${d.keywords?.slice(0, 5).join(", ")}`,
  );

  // 4. Enrichment
  section(4, "Data Enrichment — premium endpoints");

  log("GitHub profile for torvalds...");
  await callAPI("GET", "/api/enrich/github?username=torvalds", null, (d) =>
    `${d.name || d.login} — ${d.publicRepos || "?"} repos, ${d.followers || "?"} followers`,
  );

  log("Stock quote for AAPL...");
  await callAPI("GET", "/api/finance/quote?symbol=AAPL", null, (d) =>
    `AAPL: $${d.price || d.regularMarketPrice || "?"}`,
  );

  // 5. ENS + Blockchain
  section(5, "Blockchain APIs");

  log("ENS resolution for vitalik.eth...");
  await callAPI("GET", "/api/ens?name=vitalik.eth", null, (d) =>
    `vitalik.eth → ${d.address?.slice(0, 10)}...${d.address?.slice(-6) || "?"}`,
  );

  // Summary
  section(6, "Session Summary");
  const summary = agent!.getSpendSummary();
  const txns = agent!.getTransactions();

  ok(`Total spent: $${summary.today.toFixed(6)} USDC`);
  ok(`Transactions: ${summary.transactionCount}`);
  ok(`Budget remaining: $${(1 - summary.today).toFixed(4)} / $1.00`);
  console.log("");

  if (txns.length > 0) {
    log(`${BOLD}Transaction Log:${RESET}`);
    txns.forEach((tx, i) => {
      log(`  ${String(i + 1).padStart(2)}. ${tx.endpoint.padEnd(35)} ${GREEN}$${tx.amount}${RESET} ${DIM}${tx.chain} [${tx.status}]${RESET}`);
    });
  }

  console.log(`\n   ${GREEN}Every API call above was paid with real USDC on Base.${RESET}\n`);
}

// ─── Run ──────────────────────────────────────────────────────────

if (PAY_MODE) {
  demoPay().catch(console.error);
} else {
  demoProtocol().catch(console.error);
}
