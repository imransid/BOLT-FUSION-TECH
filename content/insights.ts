import "server-only";

import { insightsSchema, type Insight } from "./insights-schema";
import { projects } from "./projects";
import { parseContent } from "./schema";

/**
 * /insights — three technical articles, written from real work only (SPEC §6).
 * Server-only and deep-frozen, like content/site.ts: server components read it
 * and pass a client component only its slice. Never re-export it from the
 * /content barrel.
 *
 * Where each article comes from — the evidence is recorded line by line in the
 * redesign's EVIDENCE.md:
 *
 * 1. Routing AI — the restaurant-search write-up (content/site.ts `caseStudy`)
 *    and content/architecture.ts. Every figure carries the status the site
 *    gives it everywhere else, through its own entry in content/figure-labels.ts.
 * 2. Offline-first POS — the outbox, sync worker, batch endpoint and ESC/POS
 *    printer code in our restaurant POS repositories. No repository, product or
 *    merchant is named, and nothing claims a live merchant (SPEC §5, POS).
 * 3. Postgres row-level security — the migrations, tenant helper and RLS test
 *    suite of the multi-tenant POS platform in development in the company's
 *    GitHub organisation. The article says it is in development. The restaurant
 *    search's RLS tenancy is the write-up's, and the article says no more than
 *    that about it.
 *
 * Every figure in a paragraph or bullet is labelled or exempted per instance,
 * and there is none anywhere else: `node scripts/verify-insights.mjs`.
 */
const raw: unknown = [
  /* ── 1 ───────────────────────────────────────────────────────────────────── */
  {
    slug: "routing-ai-so-most-queries-never-reach-a-model",
    title: "Routing AI so most queries never reach a model",
    dek: "How a multi-tenant restaurant search we delivered decides, before any paid inference, whether a query needs a model at all, and what that does to latency and cost.",
    description: "How a multi-tenant restaurant search decides, before any paid inference, whether a query needs a model at all, and what that does to latency and cost.",
    datePublished: "2026-09-16",
    author: "Bolt Fusion Tech engineering",
    capabilities: ["ai", "software", "cloud"],
    relatedWork: ["restaurant-search"],
    sections: [
      {
        heading: "The expensive part is deciding when to call a model",
        paragraphs: [
          "Natural-language search makes an easy demo. Type “cozy Italian place for date night” and a large model will return something plausible. The hard part comes later, when that model sits in the path of every query a platform serves: every request pays for inference, waits for it, and depends on a provider being up.",
          "We delivered a multi-tenant restaurant discovery microservice that had to handle both kinds of query: the short ones people type most of the time, like “sushi” or “pizza”, and the descriptive ones, like “romantic spot with live music near me”. The design question was not which model to use. It was when a model should run at all.",
          "The answer was a router that classifies every query before any paid inference happens and sends it down one of three lanes. Only one of them calls a model.",
        ],
      },
      {
        heading: "Classify first, pay second",
        paragraphs: [
          "The classifier is deterministic. It is ordinary code, not a model, so choosing a lane costs nothing and gives the same answer for the same input every time. That matters for debugging: when a query lands in the wrong lane, we can reproduce it and write a test for it.",
          "The lanes split the traffic unevenly on purpose. The architecture sizes the keyword lane for ~80% of traffic and the AI lane for ~20% of traffic. Both shares are design targets, not measured splits, and they are labelled that way everywhere we publish them.",
          "The lane a query took is also part of its cache key, so classification decides what counts as the same query, not just where it goes.",
        ],
        code: {
          language: "typescript",
          caption:
            "Pseudo-code for the order of operations the write-up describes: classify, check the cache, then run one lane. The names are illustrative; this is not the service’s source.",
          source: [
            "async function search(tenant: TenantId, q: SearchQuery): Promise<Result<Venues, SearchError>> {",
            "  const lane = classify(q);                       // rules, no model call",
            "  const key = hash(tenant, q.text, q.geo, q.filters, lane);",
            "",
            "  const cached = await resultCache.get(key);      // the cache lane",
            "  if (cached) return ok(cached);",
            "",
            "  const venues = lane === \"keyword\"",
            "    ? await keywordSearch(tenant, q)              // ILIKE + PostGIS",
            "    : await aiSearch(tenant, q);                  // Haiku -> JSON intent -> pgvector",
            "",
            "  await resultCache.set(key, venues);             // short TTL",
            "  return ok(venues);",
            "}",
          ].join("\n"),
        },
        diagram: {
          caption: "The router: one deterministic decision before any paid inference.",
          steps: [
            { label: "Query", detail: "Free text, a location and filters, scoped to one tenant." },
            { label: "Classify", detail: "Deterministic rules pick the lane. No model call." },
            {
              label: "One of three lanes",
              branches: [
                { label: "Cache lane", detail: "A repeat query, served from Redis." },
                { label: "Keyword lane", detail: "ILIKE and PostGIS in Postgres. No model call." },
                { label: "AI lane", detail: "Claude Haiku parses intent to JSON; embeddings and pgvector rank." },
              ],
            },
            { label: "Ranked venues", detail: "Written back to the cache with a short TTL." },
          ],
        },
      },
      {
        heading: "Three lanes, three budgets",
        paragraphs: [
          "Each lane has its own latency budget and its own cost profile. The router exists to keep a query in the cheapest lane that can answer it.",
          "The one latency figure we label shipped belongs to the fast path: the majority of requests stay on a <100ms path. The per-lane latency budgets behind it are targets.",
        ],
        bullets: [
          "Keyword lane: simple intents, such as a cuisine or a dish. PostgreSQL ILIKE with PostGIS geo filters and no model call, so each query has a $0 marginal model cost.",
          "AI lane: descriptive intent. Claude Haiku turns the query into structured JSON, then OpenAI embeddings and pgvector cosine similarity rank venues inside Postgres. It is the only lane that pays for inference, and its budget is ~$0.001 per AI query on average.",
          "Cache lane: repeat demand. Results live in Redis under a hashed key built from the tenant, the query, the location, the filters and the classification, with a short TTL, so a popular query is computed once and then served from memory.",
        ],
      },
      {
        heading: "The model is a parser, not a search engine",
        paragraphs: [
          "In the AI lane the model never sees the venue data and never ranks anything. Claude Haiku has one job: read the query and return structured intent as JSON, such as a cuisine, a vibe or a place. From there, retrieval is ordinary database work: filters in SQL, geography in PostGIS, and semantic similarity through pgvector, all inside Postgres.",
          "That split has three consequences. The paid call stays small, because the model reads a sentence and writes a small object. The output has a known vocabulary, because each tenant’s configuration lists its valid vibes and cuisines. And ranking stays in our code: the hybrid ranker’s weights are per-tenant configuration, not a prompt.",
          "A second Redis cache holds parsed intents, so a query the service has just interpreted does not go back to the model. Venue embeddings are built when venues change, by an embedding saga triggered from the indexing side of the service, never while someone is searching.",
        ],
      },
      {
        heading: "The smallest model that does the job",
        paragraphs: [
          "Intent parsing does not need a frontier model, so it does not get one. The split is lopsided: ~90% of AI calls are routed to Claude Haiku, and Claude Sonnet answers menu questions only, which is a different job from parsing a search.",
          "Model calls are rate-limited per tenant inside the service, so one tenant’s burst of descriptive queries cannot starve every other tenant of model capacity.",
          "Both model providers sit behind adapters in the service’s shared kernel, next to the Prisma and Redis services. The search code depends on an interface, not on a vendor’s SDK, which keeps a model change contained.",
        ],
      },
      {
        heading: "Tenancy runs through every lane",
        paragraphs: [
          "The service is multi-tenant, and every shortcut above has to respect that. The tenant is part of the cache key, so two brands never share a cached result. Tenant data is isolated in Postgres with row-level security, and the tenant travels through each request in an AsyncLocalStorage context rather than as a parameter someone can forget to pass.",
          "Each tenant also brings its own configuration: its valid vibes and cuisines, its ranker weights and its embedding templates, held in an in-memory registry warmed from Redis. Adding a brand is a configuration change, not a code change.",
        ],
      },
      {
        heading: "What the figures say, and what they don’t",
        paragraphs: [
          "Every figure in this article carries its label. Three are shipped: the fast path, the share of AI calls routed to Haiku, and the keyword lane’s zero model cost, which is true by construction. The rest are targets. The traffic split and the cost per AI query were set as budgets when the architecture was designed, and nothing we have recorded measures them yet. We would rather print that than round a budget up into a result.",
          "The service ships with metrics, Pino logging and explicit result types for failures. That is what makes the lane split something an operator can watch, rather than something the design document promises.",
        ],
      },
      {
        heading: "When this pattern fits",
        paragraphs: [
          "Routing before inference pays off when three things hold: a large share of queries is simple enough to answer without a model, a cheap deterministic classifier can tell the two kinds apart, and a query in the wrong lane is recoverable. Search usually meets all three. A support assistant that has to understand every message usually does not.",
          "If you are adding a model to an existing product, start by collecting what users actually type and sorting a sample of it by hand. The shape of that list tells you whether you need a router, and roughly where its line should sit.",
          "The rule we took from this build: set the budget per query before you choose the model, and make the model’s job as narrow as the problem allows.",
        ],
      },
    ],
  },

  /* ── 2 ───────────────────────────────────────────────────────────────────── */
  {
    slug: "offline-first-point-of-sale",
    title: "Offline-first point of sale: keeping the till selling when the network drops",
    dek: "How a restaurant POS we built writes every sale locally first, queues it for the server, and makes retries harmless when the connection comes and goes.",
    datePublished: "2026-09-16",
    author: "Bolt Fusion Tech engineering",
    capabilities: ["pos", "software"],
    relatedWork: [],
    sections: [
      {
        heading: "A till that waits for the network loses sales",
        paragraphs: [
          "A point of sale is the one screen in a restaurant that cannot stop. When the Wi-Fi drops during a busy service, the cashier still has a queue of people in front of them. If ringing up an order means waiting on a server, every network hiccup becomes a line at the counter.",
          "So in a restaurant POS we built, the network is never in the path of a sale. The till writes the order to a local database, the cashier moves on, and a background worker delivers the order to the server whenever it can.",
          "This article walks through the pieces that make that safe: the outbox, the sync worker, the server’s idempotent batch endpoint, how conflicts are kept from arising, and receipt printing that never waits on the internet.",
        ],
      },
      {
        heading: "The local database is the source of truth",
        paragraphs: [
          "The desktop till is an Electron app with SQLite in the main process, in write-ahead-log mode. The phone till uses WatermelonDB, which is SQLite underneath. Both read and write locally first, so the till behaves the same offline as online, and the menu lives on the device.",
          "Order ids are generated on the device, not by the server: a prefix, a base-36 timestamp, a per-process counter and a random suffix, so two orders created in the same millisecond still differ. Because the device owns the id, an order exists the moment it is rung up, and the same id is the key the server uses later.",
        ],
      },
      {
        heading: "Write the order and its outbox row in one transaction",
        paragraphs: [
          "Every change that has to reach the server is recorded in an outbox table, in the same transaction as the order itself. If the order is written, its outbox row is written; if either fails, neither exists. There is no window in which a sale is saved but forgotten by sync.",
          "Each outbox row carries a frozen JSON snapshot of the order as it was at write time, an attempt counter, the last error, and the earliest time it may be tried again. A row is pending while its synced timestamp is empty. Acknowledged rows are kept for a month and then pruned, so we can still answer the question support always asks: did this order ever reach the server?",
        ],
        code: {
          language: "sql",
          caption:
            "The desktop till’s outbox, from its SQLite schema, comments trimmed. The partial index keeps the query that claims the next batch cheap however much synced history builds up.",
          source: [
            "CREATE TABLE IF NOT EXISTS sync_outbox (",
            "  id INTEGER PRIMARY KEY AUTOINCREMENT,",
            "  entity TEXT NOT NULL,           -- 'order'",
            "  entity_id TEXT NOT NULL,        -- the server's idempotency key",
            "  operation TEXT NOT NULL,        -- 'create' | 'update'",
            "  payload TEXT NOT NULL,          -- JSON snapshot, frozen at write time",
            "  attempts INTEGER NOT NULL DEFAULT 0,",
            "  last_error TEXT,",
            "  created_at TEXT NOT NULL,",
            "  next_attempt_at TEXT NOT NULL,  -- backoff schedules the next try",
            "  synced_at TEXT                  -- null while pending",
            ");",
            "",
            "CREATE INDEX IF NOT EXISTS idx_sync_outbox_pending",
            "  ON sync_outbox(next_attempt_at) WHERE synced_at IS NULL;",
          ].join("\n"),
        },
      },
      {
        heading: "Draining the queue",
        paragraphs: [
          "A sync worker drains the outbox in batches, oldest first. On the desktop it runs in Electron’s main process, so the cashier’s screen never takes part in the HTTP round trip; the window only receives status updates.",
          "It wakes on five triggers. Before sending, the phone till asks whether the internet is actually reachable, and asks twice, because the connectivity API can report an unknown state right after launch.",
          "When a request fails, the worker backs off exponentially: it doubles from one second, caps at five minutes, and adds up to thirty percent of random jitter, so a room full of tills does not retry in lockstep when the connection returns.",
        ],
        bullets: [
          "A debounced kick after every local write, so a burst of orders becomes one batch.",
          "A heartbeat once a minute.",
          "The device coming back online.",
          "The app returning to the foreground.",
          "A drain shortly after a cold start.",
        ],
        /* the five triggers follow the paragraph that announces them */
        place: { bullets: 2 },
        diagram: {
          caption: "One sale, from the till to the server and back.",
          steps: [
            { label: "Till", detail: "The order and its outbox row, written in one local transaction." },
            { label: "Outbox", detail: "Pending rows, oldest first, each with its next attempt time." },
            { label: "Sync worker", detail: "Debounced, on a heartbeat, backing off with jitter when a request fails." },
            { label: "Batch endpoint", detail: "Each item in its own transaction, upserted by terminal and device id." },
            {
              label: "Answer",
              branches: [
                { label: "Accepted", detail: "Marked synced; kept for a month, then pruned." },
                { label: "Refused", detail: "Bad data: parked for an hour, not retried at once." },
              ],
            },
          ],
        },
      },
      {
        heading: "Making retries harmless",
        paragraphs: [
          "Retries are only safe if the server treats a repeat as a repeat. The batch endpoint upserts every order by the pair of terminal and device-generated id, and that pair is a unique constraint in Postgres. A test posts the same batch three times and asserts that exactly one order exists.",
          "Each item in a batch is applied in its own database transaction, so one bad row cannot roll back the rest. The response lists the ids the server accepted and the ids it refused, each refusal with a reason. The till handles the two outcomes differently: a refused row is parked for an hour instead of hammering the server, and a failed request, whether no network, a timeout or an error for the whole batch, goes back on the backoff schedule.",
          "The server keeps the till’s own timestamps. An order rung up at lunch and synced after an afternoon offline still records lunch as the time of sale; the time it reached the server is stored separately. Every applied item is also written to an append-only sync log, which is how an operator answers whether a particular order arrived.",
        ],
        code: {
          language: "python",
          caption: "The heart of the batch endpoint (Django): an upsert keyed on the terminal and the id the till generated.",
          source: [
            "order, created = Order.objects.update_or_create(",
            "    terminal=terminal,",
            "    entity_id=item[\"entity_id\"],",
            "    defaults={...},  # the snapshot's fields, and the raw payload as JSONB",
            ")",
          ].join("\n"),
        },
      },
      {
        heading: "Conflicts: design them out before you resolve them",
        paragraphs: [
          "The cheapest conflict is the one that cannot happen. Each order belongs to the terminal that created it: the server’s key includes the terminal, so two tills never write the same order row. Within one till, changes to an order leave the outbox in the order they were made and are applied oldest first.",
          "Every outbox row carries a full snapshot of the order, not a diff. The server replaces the order’s lines and payments with what the snapshot says, so a late or repeated update cannot leave half an edit behind. The rule is last write wins, per order, from the only device allowed to write it.",
          "That design does not solve every conflict, and it does not pretend to. Sync as written carries orders only. The outbox has an entity field so other record types can follow, and the server refuses any entity it does not know. State that several tills change at once, such as stock counts, needs rules of its own, and we would design those per record type rather than bolt a generic merge onto the queue.",
        ],
      },
      {
        heading: "Printing a receipt without the internet",
        paragraphs: [
          "Receipt printing is local too. On the phone till in our restaurant POS work, the app builds the receipt’s content once in JavaScript and hands it to a native module, which turns it into ESC/POS bytes: initialise the printer, bold on and off, line feeds, and a paper cut at the end.",
          "On Android the module talks to a paired thermal printer over Bluetooth serial; on iOS it opens a TCP connection to a printer on the local network. Neither path touches the internet, so a customer gets a receipt whether or not the sync worker has reached the server.",
        ],
      },
      {
        heading: "What is still open",
        paragraphs: [
          "Three parts of this design are deliberately unfinished or deliberately blunt, and each is written down rather than discovered later.",
        ],
        bullets: [
          "Background sync on iOS. On Android, a scheduled background job drains the queue even when the app has been closed. On iOS we have not built that yet, so a closed app syncs when it is next opened.",
          "Record types beyond orders, starting with the ones several tills share.",
          "A locked terminal loses its queue. An administrator can lock a terminal; the till treats the server’s refusal as a kill signal, wipes its local database and relaunches into a locked screen. Anything still queued goes with it, which is why a lock is an administrator’s decision and a network error is never read as one.",
        ],
      },
    ],
  },

  /* ── 3 ───────────────────────────────────────────────────────────────────── */
  {
    slug: "multi-tenant-saas-on-postgres-row-level-security",
    title: "Multi-tenant SaaS on Postgres row-level security",
    dek: "Why we put tenant isolation in the database rather than the application, the details in the policy that make it fail closed, and how we test it against a real Postgres.",
    description: "Why we put tenant isolation in the database rather than the application, what makes the policy fail closed, and how we test it against a real Postgres.",
    datePublished: "2026-09-16",
    author: "Bolt Fusion Tech engineering",
    capabilities: ["software", "cloud"],
    relatedWork: ["restaurant-search"],
    sections: [
      {
        heading: "Tenancy is the one thing you cannot retrofit",
        paragraphs: [
          "In a multi-tenant product every business shares the same tables, and every query is one missing WHERE clause away from showing one customer another customer’s data. Filtering by tenant in application code works until the first query that forgets to. We would rather the database refuse.",
          "The details below come from a multi-tenant point-of-sale platform we are building now: a shared schema, a tenant id on every business table, and Postgres row-level security to enforce it. The restaurant search we delivered isolates its tenants with row-level security too. The platform is still in development, so what follows is its design and its test suite, not a production war story.",
          "A shared schema is cheaper to run than a schema or a database per tenant, and it keeps the option to shard by tenant later. The price is that isolation has to be enforced on every table, every time, by something other than developer discipline.",
        ],
      },
      {
        heading: "The policy every tenant table gets",
        paragraphs: [
          "Every tenant-scoped table gets the same policy, created in the same migration as the table itself.",
          "Five details in it carry the weight, and each exists because the version without it fails in a way that looks like something else.",
        ],
        bullets: [
          "The true in current_setting means missing is fine. Without it, a query issued with no tenant set raises an unrecognised-parameter error, which reads like a bug in the query and tempts someone to drop the policy. With it, the setting is null, the comparison is null, and the row is invisible.",
          "nullif turns an empty setting back into null. SET LOCAL reverts a custom setting to the empty string, not to unset, so on a pooled connection that has already served one tenant, casting that empty string to a uuid raises an error on every read outside a tenant transaction. Our first version of the policy lacked it; we measured the failure and amended every migration.",
          "with check as well as using. Using filters the rows a session can read and the old row of an update; with check validates the new row. Without it, a session could insert a row stamped with another tenant’s id.",
          "force row level security. A table’s owner bypasses its policies unless force is set, and migrations run as the owner.",
          "The cast to uuid makes a malformed tenant id an error, never a string comparison, which is why the application validates the id’s shape before Postgres ever sees it.",
        ],
        /* the policy itself, then the five details in it */
        place: { code: 1 },
        code: {
          language: "sql",
          caption: "The standard tenant policy, as the platform’s migrations apply it to a business table.",
          source: [
            "alter table orders enable row level security;",
            "alter table orders force  row level security;",
            "",
            "create policy tenant_isolation on orders",
            "  using      (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)",
            "  with check (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);",
          ].join("\n"),
        },
      },
      {
        heading: "Who connects matters as much as the policy",
        paragraphs: [
          "Row-level security binds nobody if the application connects as a superuser, and binds a table’s owner only when force is set. So the platform uses separate database roles: an owner role that runs migrations and creates tables and policies, and an application role that serves every request and is neither the owner nor a superuser. Point both connection strings at one superuser and every policy goes inert while still looking correct in the migration diff.",
          "Privileges are the second lock. The application role gets select, insert, update and delete on business tables by default, so the append-only audit log needs explicit revokes of update and delete, and its policies cover select and insert only. Granting less is not enough: privileges add up, and only a revoke takes one away.",
          "Some business rules are policies of their own. Orders carry restrictive policies on top of tenant isolation: only a parked order can be deleted, and no update can turn an order back into a parked one. A completed sale cannot be deleted, whichever tenant the query runs as.",
          "The platform console, which really does need to read across tenants, gets a third role with BYPASSRLS, select only, its own connection pool, and one module allowed to import it. What it does not get is an escape hatch inside the policy, such as an admin flag in the session. An escape hatch in the policy is an escape hatch for every bug in the request path.",
        ],
      },
      {
        heading: "Setting the tenant without string interpolation",
        paragraphs: [
          "The tenant id reaches Postgres through one helper. It validates the id, opens a transaction, sets the tenant for that transaction only, and hands the callback a transaction handle to use.",
          "Three choices in it are deliberate. SET LOCAL does not accept bind parameters, which is what tempts people into building the statement as a string; set_config with its local flag does the same thing as a function call, so the id travels as a parameter. The setting is transaction-scoped, so it cannot leak to the next request on a pooled connection, and a query issued outside the transaction sees no tenant and gets no rows. And the id is a branded type that only the validator produces, so a raw string from a request cannot be passed where a checked one is required.",
        ],
        code: {
          language: "typescript",
          caption: "The helper every tenant-scoped query goes through (TypeScript and Drizzle), comments trimmed.",
          source: [
            "export async function withTenant<T>(",
            "  db: Database,",
            "  tenantId: string,",
            "  fn: (tx: Transaction) => Promise<T>,",
            "): Promise<T> {",
            "  assertTenantId(tenantId) // a UUID, or throw before any SQL runs",
            "",
            "  return db.transaction(async (tx) => {",
            "    await tx.execute(sql`select set_config('app.tenant_id', ${tenantId}, true)`)",
            "    return fn(tx)",
            "  })",
            "}",
          ].join("\n"),
        },
        diagram: {
          caption: "One request, one tenant, one transaction.",
          steps: [
            { label: "Request", detail: "Authenticated; the tenant is known." },
            { label: "Validate", detail: "The tenant id must be a UUID, or nothing runs." },
            { label: "Open a transaction", detail: "set_config sets the tenant for this transaction only." },
            { label: "Query", detail: "Every statement runs on the transaction handle." },
            { label: "Policy", detail: "Postgres filters reads and checks writes against the tenant." },
            { label: "Commit", detail: "The setting reverts; the pooled connection carries no tenant." },
          ],
        },
      },
      {
        heading: "Foreign keys do not enforce tenancy",
        paragraphs: [
          "One gap surprises people: Postgres runs foreign-key checks as the table owner, bypassing row-level security. A row in one tenant can reference a parent in another, and the constraint will allow it.",
          "For the parent chains that matter, such as company to branch to terminal, the parent carries a unique key on tenant and id, and the child’s foreign key is composite. A cross-tenant reference becomes impossible rather than merely unlikely.",
        ],
      },
      {
        heading: "Testing isolation against a real database",
        paragraphs: [
          "Row-level security is database behaviour, so it is tested against a real Postgres; a mock would only test the mock. The suite creates two tenants, writes rows to both, and proves table by table that a session opened for one tenant can neither read nor write the other’s rows. The cases it asserts:",
          "The rule that keeps it honest: every new business table adds its cases in the same commit that adds the table, and the suite runs as the application role, because a suite that passes while connected as the owner proves nothing.",
        ],
        bullets: [
          "The application role is a separate role, and neither the owner nor a superuser.",
          "Reads return exactly the tenant’s own rows.",
          "An insert stamped with the other tenant’s id is rejected.",
          "An update that re-stamps a row as another tenant’s is rejected.",
          "Reading another tenant’s row by its id returns zero rows.",
          "With no tenant set, on a connection that has already served both tenants, a query returns zero rows and raises nothing.",
          "The owner does not bypass its own policy, and the force flag is checked in the catalogue, not inferred from behaviour.",
          "The tenant-id validator rejects anything that is not a UUID before set_config sees it.",
        ],
        /* "The cases it asserts:" is followed by the cases */
        place: { bullets: 1 },
      },
      {
        heading: "When a shared schema is the right call",
        paragraphs: [
          "Row-level security is not free. Every tenant-scoped query runs inside a transaction, background work needs a tenant context of its own, and anything genuinely cross-tenant needs its own role and its own review. For most business software that is a good trade: one schema to migrate, one database to operate, and isolation that holds even when application code is wrong.",
          "If you are starting a multi-tenant product, put the tenant id and the policy in the first migration. Adding them to a live schema later means auditing every query you have ever written.",
        ],
      },
    ],
  },
];

/* One object serves every page and every render — so it is frozen: a mutation
   throws instead of silently changing another page (content/site.ts). */
function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const v of Object.values(value)) deepFreeze(v);
  }
  return value;
}

const parsed = parseContent(insightsSchema, raw, "insights.ts");

/* relatedWork names published projects, by id — a relation, not a copy
   (content/schema.ts). An unknown or held-back project fails the build. */
const published = new Set(projects.filter((p) => p.state === "published").map((p) => p.id));
for (const a of parsed)
  for (const id of a.relatedWork)
    if (!published.has(id))
      throw new Error(`content/insights.ts, "${a.slug}": relatedWork "${id}" is not a published project in content/projects.ts`);

export const insights: readonly Insight[] = deepFreeze(parsed);
