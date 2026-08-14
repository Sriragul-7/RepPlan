# AI Coach Feature - Architecture & Implementation Guide

## Architecture

```
React Coach UI
        ↓
FastAPI /api/coach/chat (or /api/coach/chat/stream)
        ↓
Rate limit check
        ↓
Domain classification (fitness/nutrition/recovery/off-topic/safety)
        ↓
Safety guardrails check
        ↓
RAG retrieval (BM25 over local knowledge base)
        ↓
Relevant fitness knowledge chunks
        ↓
User context from RepPlan profile
        ↓
Conversation history (bounded window)
        ↓
System prompt assembly
        ↓
OpenRouter (openrouter/free model)
        ↓
Response validation
        ↓
React streaming/chat UI
```

## Files Created

### Backend
| File | Purpose |
|------|---------|
| `backend/.env.example` | Environment variable template |
| `backend/app/services/rag.py` | BM25-based RAG retrieval pipeline |
| `backend/app/services/domain_classifier.py` | Domain classification + safety guardrails |
| `backend/app/services/coach.py` | Coach service: OpenRouter, streaming, system prompt, rate limiting |
| `backend/app/routers/coach.py` | FastAPI coach endpoints |
| `backend/knowledge/fitness/training_volume.json` | Training volume, progressive overload, sets/reps knowledge |
| `backend/knowledge/nutrition/macros.json` | Protein, calories, carbs, fats, hydration knowledge |
| `backend/knowledge/nutrition/supplements.json` | Creatine, whey, caffeine, BCAAs knowledge |
| `backend/knowledge/recovery/recovery.json` | Sleep, rest, DOMS, mobility knowledge |
| `backend/knowledge/exercises/exercise_technique.json` | Compound exercise technique knowledge |
| `backend/knowledge/safety/medical_safety.json` | Medical disclaimers and safety rules |
| `backend/tests/test_rag.py` | 12 RAG retrieval tests |
| `backend/tests/test_domain_classifier.py` | 21 domain classifier + safety tests |
| `backend/tests/test_coach_api.py` | 12 coach API endpoint tests |

### Frontend
| File | Purpose |
|------|---------|
| `frontend/src/screens/Coach.tsx` | Complete rewrite with streaming, conversation management |

## Files Modified

| File | Changes |
|------|---------|
| `backend/app/config/settings.py` | Added `openrouter_api_key`, `openrouter_model`, rate limit settings |
| `backend/app/main.py` | Registered coach router |
| `backend/app/repo.py` | Added `create_coach_conversation`, `get_coach_conversations`, `get_coach_messages`, `add_coach_message` to both `SupabaseRepo` and `LocalRepo` |
| `backend/app/schemas/models.py` | Added `CoachMessageIn`, `CoachConversationOut`, `CoachMessageOut`, `CoachChatResponse` |
| `frontend/src/lib/api.ts` | Added `getCoachConversations`, `createCoachConversation`, `getCoachMessages`, `coachChat` + types |

## RAG Approach

### Retrieval: BM25 (Okapi BM25)
- **No external vector database** — pure Python implementation
- No paid embedding API required
- Tokenization: lowercase + regex `[a-z0-9]+`
- IDF computed at load time over all knowledge chunks
- BM25 scoring with k1=1.5, b=0.75
- Returns top-k results (default k=5) with scores

### Knowledge Base Format
Each JSON file in `backend/knowledge/` contains an array of chunks:
```json
{
  "title": "Training Volume for Hypertrophy",
  "topic": "training_volume",
  "source": "Evidence-based guidelines, Schoenfeld & Krieger 2017",
  "year": 2017,
  "evidence_level": "strong",
  "content": "For hypertrophy, 10-20 hard sets per muscle group..."
}
```

### Adding New Knowledge
1. Create or edit a JSON file in `backend/knowledge/<category>/`
2. Follow the schema above
3. Restart the backend (chunks are loaded once at startup)
4. No reindexing or embedding required

## OpenRouter Configuration

Set in `backend/.env`:
```
OPENROUTER_API_KEY=your_key_here
OPENROUTER_MODEL=openrouter/free
```

- API key stays **server-side only** — never exposed to the browser
- Model `openrouter/free` routes to the best available free model
- To change the model, update `OPENROUTER_MODEL` env var

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/coach/conversations` | Yes | List user's conversations |
| `POST` | `/api/coach/conversations` | Yes | Create new conversation |
| `GET` | `/api/coach/conversations/{id}/messages` | Yes | Get messages in conversation |
| `POST` | `/api/coach/chat` | Yes | Send message (non-streaming) |
| `POST` | `/api/coach/chat/stream` | Yes | Send message (SSE streaming) |

## Database Schema

For Supabase, create these tables:
```sql
CREATE TABLE coach_conversations (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES users(id),
  title TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE coach_messages (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  conversation_id TEXT NOT NULL REFERENCES coach_conversations(id),
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_coach_conv_user ON coach_conversations(user_id);
CREATE INDEX idx_coach_msgs_conv ON coach_messages(conversation_id);
```

## Safety Design

### Domain Classification
- Keyword-based scoring across fitness, nutrition, and recovery domains
- Off-topic questions are rejected before hitting the LLM
- Greetings get pre-canned friendly responses

### Safety Guardrails
Regex-based pattern matching for:
- Steroid/PED use → refused with healthcare recommendation
- Eating disorders → refused with helpline direction
- Severe symptoms → emergency advice
- Extreme dieting → refused with safe guidelines
- Pregnancy, youth, medication → appropriate cautions

### Response Safety
- System prompt instructs model not to diagnose or prescribe
- Model directed to recommend healthcare professionals when appropriate
- No dangerous information in knowledge base

## Rate Limiting

Configurable via environment variables:
- `coach_rate_limit_per_minute`: 20 (default)
- `coach_rate_limit_per_day`: 200 (default)
- `coach_max_message_length`: 1000 characters (default)
- `coach_max_context_messages`: 20 (default conversation window)

In-memory rate limiting (resets on server restart). For production, use Redis.

## How to Test

### Backend tests
```bash
cd backend
.venv/bin/python -m pytest tests/ -v
```

### Frontend build
```bash
cd frontend
npm run build
```

### Manual testing
1. Start backend: `cd backend && .venv/bin/uvicorn app.main:app --port 8100`
2. Start frontend: `cd frontend && npm run dev`
3. Navigate to `/coach`
4. Test fitness questions, off-topic rejection, safety responses

## How to Replace/Change the Model

Update `OPENROUTER_MODEL` in `backend/.env`:
```
OPENROUTER_MODEL=openrouter/deepseek/deepseek-chat-v3-0324:free
```

Any model available on OpenRouter can be used. The streaming and prompt structure remain the same.

## Remaining Limitations

1. **Rate limiting is in-memory** — resets on server restart. Use Redis for production.
2. **Conversation history is unbounded per conversation** — consider adding message limits.
3. **No streaming in non-streaming endpoint** — `/chat` returns full response at once.
4. **User context is basic** — could include more RepPlan data (recent workouts, PRs).
5. **Knowledge base is static** — requires backend restart to update.
6. **No conversation titling** — conversations show "New conversation" instead of auto-generated titles.
7. **BM25 is keyword-based** — semantic understanding is limited compared to embedding-based RAG.
