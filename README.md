# AI Agent Evaluation Framework

This is a multi-tenant web application built with Next.js, Supabase, and Tailwind CSS to provide continuous evaluation and performance metrics for AI agents.

## Database Schema

The framework uses two main tables in the `public` schema:

### 1. `evaluation_configs` (User Settings)

| Column | Type | Notes |
| :--- | :--- | :--- |
| `id` | `UUID` (PK) | Primary Key |
| `user_id` | `UUID` (FK) | **Owner ID** (References `auth.users`, Unique) |
| `run_policy` | `TEXT` | `always` / `sampled` |
| `sample_rate_pct` | `INT` | 0-100 |
| `obfuscate_pii` | `BOOLEAN` | If true, detail view applies masking |
| `max_eval_per_day` | `INT` | Daily cap limit |
| `created_at` | `TIMESTAMP` | |

### 2. `evaluations` (Raw Data)

| Column | Type | Notes |
| :--- | :--- | :--- |
| `id` | `UUID` (PK) | Primary Key |
| `interaction_id` | `TEXT` | Unique ID for agent session |
| `user_id` | `UUID` (FK) | **Owner ID** (References `auth.users`) |
| `prompt` | `TEXT` | Agent prompt input |
| `response` | `TEXT` | Agent response output |
| `score` | `NUMERIC` | Evaluation score (0.0 to 1.0) |
| `latency_ms` | `INT` | Latency in milliseconds |
| `flags` | `TEXT[]` | Array of strings (e.g., 'hallucination') |
| `pii_tokens_redacted`| `INT` | Count of tokens redacted at ingestion |
| `created_at` | `TIMESTAMP` | Time of ingestion (Indexed) |

## Row Level Security (RLS) Policies

All tables have RLS enabled. Policies ensure strict multi-tenancy where a user can only access data tied to their `auth.uid()`.

### Policies Applied to `evaluation_configs` and `evaluations`:
```sql
-- ENABLE RLS
ALTER TABLE evaluation_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;

-- POLICIES for evaluation_configs
CREATE POLICY "User can view their own config" ON evaluation_configs
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "User can manage their own config" ON evaluation_configs
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- POLICIES for evaluations
CREATE POLICY "User can view their own evaluations" ON evaluations
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "User can insert their own evaluations" ON evaluations
FOR INSERT WITH CHECK (auth.uid() = user_id);
```

## Seed Data 
1. Sign Up via the deployed application's /login page to create a user account.

2. Retrieve User ID: Obtain the UUID of the new user from the auth.users table in your Supabase dashboard.

3. Configure Script: Open scripts/seed.ts and replace the placeholder TEST_USER_ID with the actual UUID obtained in Step 2.

4. Execute: Run the following command from your project root. This command uses ts-node to execute the TypeScript script.
    npm run seed

### Sample Configuration
```sql
INSERT INTO evaluation_configs (id, user_id, run_policy, sample_rate_pct, obfuscate_pii, max_eval_per_day)
VALUES (
  gen_random_uuid(),
  '476b56c5-d886-4896-a5e0-ab0b56a5b3dd',
  'sampled',
  25,
  true,
  1000
);
```

### Sample Evaluations
```sql
INSERT INTO evaluations (id, interaction_id, user_id, prompt, response, score, latency_ms, flags, pii_tokens_redacted, created_at)
VALUES 
  (
    gen_random_uuid(),
    'session_001',
    '476b56c5-d886-4896-a5e0-ab0b56a5b3dd',
    'What is the capital of France?',
    'The capital of France is Paris.',
    0.95,
    120,
    ARRAY[]::TEXT[],
    0,
    NOW()
  ),
  (
    gen_random_uuid(),
    'session_002',
    '476b56c5-d886-4896-a5e0-ab0b56a5b3dd',
    'Explain quantum computing',
    'Quantum computing uses quantum mechanics principles...',
    0.87,
    340,
    ARRAY['technical']::TEXT[],
    0,
    NOW()
  ),
  (
    gen_random_uuid(),
    'session_003',
    '476b56c5-d886-4896-a5e0-ab0b56a5b3dd',
    'What is my email address?',
    'I cannot access your personal information.',
    0.78,
    95,
    ARRAY['pii_request']::TEXT[],
    3,
    NOW()
  );
```

## Simulation Design: Agent Ingestion Pipeline

The evaluation pipeline relies on the secure ingestion API, designed for high-volume, programmatic inserts, and is governed by user-defined policies.

### Eval Ingestion API Details

**Endpoint:** `POST /api/evals/ingest`

The API uses the Service Role Key and a custom secret header (`X-Ingestion-Secret`) for security. The `user_id` must be explicitly provided in the payload to correctly assign the ingested data to the correct tenant.

| Component | Purpose | Details |
| :--- | :--- | :--- |
| **Authentication** | Request Validation | Requires the secret header: `X-Ingestion-Secret` must match the environment variable `INGESTION_API_SECRET`. |
| **Authorization** | Multi-Tenancy | Requires the tenant owner's `user_id` in the payload. |
| **Client** | High Privilege Insert | Uses the Supabase Service Role Client to ensure the insert succeeds without an active user session, relying solely on the provided `user_id`. |

### Configuration (Agent Logic Simulation)

The UI configuration dictates how the external agent should behave before submitting data to the API:

| Config Setting | Simulated Agent Behavior |
| :--- | :--- |
| `run_policy = sampled` | Agent only triggers evaluation for a subset of interactions. |
| `sample_rate_pct = X` | Agent only evaluates **X%** of interactions. |
| `obfuscate_pii = TRUE` | Agent (or pre-processor) applies PII masking to the `prompt` and `response` before ingestion. |
| `max_eval_per_day` | Agent should track its daily count and cease sending data once this limit is reached. |

### Example API Request
```bash
curl -X POST https://your-app.vercel.app/api/evals/ingest \
  -H "Content-Type: application/json" \
  -H "X-Ingestion-Secret: YOUR_INGESTION_SECRET" \
  -d '{
    "user_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "interaction_id": "session_12345",
    "prompt": "What is machine learning?",
    "response": "Machine learning is a subset of AI...",
    "score": 0.92,
    "latency_ms": 145,
    "flags": ["technical"],
    "pii_tokens_redacted": 0
  }'
```

### Environment Variables Required
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY

# Ingestion API Security
INGESTION_API_SECRET
```
