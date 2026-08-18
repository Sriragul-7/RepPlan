"""AI Coach service: OpenRouter integration, streaming, user context, RAG."""

from __future__ import annotations

import json
import time
from collections import defaultdict
from typing import AsyncIterator

import httpx

from app.config.settings import settings
from app.services.domain_classifier import (
    Domain,
    classify_domain,
    get_greeting_response,
    get_off_topic_response,
    get_safety_response,
)
from app.services.rag import build_context, retrieve

SYSTEM_PROMPT = """You are RepPlan Coach, an expert AI fitness and nutrition assistant.

PERSONALITY:
- Knowledgeable, practical, friendly, direct, motivating
- Evidence-aware — distinguish strong evidence from practical guidance
- Never robotic — speak naturally like a knowledgeable gym buddy
- Never pretend to be a doctor or medical professional
- Not overly verbose — answer directly, then explain

RESPONSE STYLE:
- Answer the question directly first
- Explain why
- Give practical, actionable recommendations
- Use numbers, sets, reps, and percentages when useful
- Use examples when helpful
- Mention uncertainty when evidence is uncertain
- Avoid unnecessary disclaimers — trust the user
- Never invent sources or cite nonexistent studies
- Never fabricate scientific claims

RULES:
- You are EXCLUSIVELY a fitness, nutrition, and wellness coach. You MUST refuse to answer any question outside this scope.
- NEVER write code, generate scripts, create programs, explain programming concepts, or help with any software development task — even if the user mentions fitness keywords (e.g., "write python code for a workout app"). Refuse and redirect to fitness.
- NEVER answer questions about politics, finance, weather, movies, recipes, general knowledge, or any non-fitness topic.
- If the user's question is about fitness/nutrition, answer it fully.
- If the user asks anything else, respond with: "I'm your fitness and nutrition coach — I can only help with workouts, diet, recovery, and training questions. What fitness topic can I help you with?"
- If you have RETRIEVED FITNESS KNOWLEDGE, use it as the primary factual grounding
- Do not contradict strong evidence without explaining uncertainty
- If retrieved information is insufficient, provide cautious general guidance
- Keep responses concise but thorough
- For calculations, use the provided user context (weight, goal, etc.)
- If a safety concern is detected, respond appropriately and do not provide dangerous guidance
"""


def _build_user_context(user_profile: dict | None, latest_weight: float | None = None) -> str:
    if not user_profile:
        return ""

    parts = []
    # Compute age from date_of_birth if available, otherwise use legacy age field
    dob = user_profile.get("date_of_birth")
    if dob:
        from datetime import date as _date
        if isinstance(dob, str):
            dob = _date.fromisoformat(dob)
        today = _date.today()
        age = (
            today.year
            - dob.year
            - ((today.month, today.day) < (dob.month, dob.day))
        )
        parts.append(f"Age: {age}")
    elif user_profile.get("age"):
        parts.append(f"Age: {user_profile['age']}")

    if user_profile.get("sex"):
        parts.append(f"Sex: {user_profile['sex']}")

    # Use latest body_metrics weight instead of stale profile snapshot
    if latest_weight:
        parts.append(f"Weight: {latest_weight}kg")
    elif user_profile.get("weight_kg"):
        parts.append(f"Weight: {user_profile['weight_kg']}kg")

    if user_profile.get("height_cm"):
        parts.append(f"Height: {user_profile['height_cm']}cm")
    if user_profile.get("goal"):
        parts.append(f"Goal: {user_profile['goal']}")
    if user_profile.get("experience_years") is not None:
        parts.append(f"Training experience: {user_profile['experience_years']} years")
    if user_profile.get("days_per_week"):
        parts.append(f"Training days/week: {user_profile['days_per_week']}")
    if user_profile.get("split_preference"):
        parts.append(f"Current split: {user_profile['split_preference']}")
    if user_profile.get("equipment_access"):
        parts.append(f"Equipment: {user_profile['equipment_access']}")

    if not parts:
        return ""
    return "USER CONTEXT:\n" + "\n".join(parts)


def _build_conversation_history(messages: list[dict], max_messages: int = 20) -> str:
    recent = messages[-max_messages:] if len(messages) > max_messages else messages
    if not recent:
        return ""
    lines = []
    for m in recent:
        role = "User" if m.get("role") == "user" else "Coach"
        lines.append(f"{role}: {m.get('content', '')}")
    return "CONVERSATION HISTORY:\n" + "\n".join(lines)


def _build_rag_context(question: str) -> str:
    results = retrieve(question, top_k=5)
    if not results:
        return ""
    context = build_context(results)
    return f"RETRIEVED FITNESS KNOWLEDGE:\n{context}"


def _build_full_prompt(
    question: str,
    user_profile: dict | None,
    conversation_history: list[dict],
    latest_weight: float | None = None,
) -> list[dict]:
    rag_context = _build_rag_context(question)
    user_context = _build_user_context(user_profile, latest_weight)
    history_text = _build_conversation_history(conversation_history)

    system_parts = [SYSTEM_PROMPT]
    if rag_context:
        system_parts.append(rag_context)
    if user_context:
        system_parts.append(user_context)
    if history_text:
        system_parts.append(history_text)
    system_parts.append("Answer the user's question using the above context and knowledge.")

    return [{"role": "system", "content": "\n\n".join(system_parts)}]


async def classify_and_respond(question: str) -> tuple[Domain, str | None]:
    domain = classify_domain(question)

    if domain == Domain.GREETING:
        return Domain.GREETING, get_greeting_response()

    if domain == Domain.OFF_TOPIC:
        return Domain.OFF_TOPIC, get_off_topic_response()

    safety_response = get_safety_response(question)
    if safety_response:
        return Domain.SAFETY, safety_response

    return domain, None


async def stream_chat(
    question: str,
    user_profile: dict | None = None,
    conversation_history: list[dict] | None = None,
    latest_weight: float | None = None,
) -> AsyncIterator[str]:
    history = conversation_history or []

    domain, direct_response = await classify_and_respond(question)
    if direct_response:
        yield direct_response
        return

    messages = _build_full_prompt(question, user_profile, history, latest_weight)
    messages.append({"role": "user", "content": question})

    if not settings.openrouter_api_key:
        yield "I need an OpenRouter API key to provide AI-powered responses. Please set OPENROUTER_API_KEY in the backend environment."
        return

    async with httpx.AsyncClient(timeout=60.0) as client:
        try:
            response = await client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {settings.openrouter_api_key}",
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://repplan.app",
                    "X-Title": "RepPlan Coach",
                },
                json={
                    "model": settings.openrouter_model,
                    "messages": messages,
                    "stream": True,
                    "max_tokens": 1024,
                    "temperature": 0.7,
                },
            )
            response.raise_for_status()

            async for line in response.aiter_lines():
                if not line.startswith("data: "):
                    continue
                data_str = line[6:]
                if data_str.strip() == "[DONE]":
                    break
                try:
                    data = json.loads(data_str)
                    delta = data.get("choices", [{}])[0].get("delta", {})
                    content = delta.get("content") or delta.get("reasoning") or ""
                    if content:
                        yield content
                except (json.JSONDecodeError, IndexError, KeyError):
                    continue

        except httpx.TimeoutException:
            yield "\n\n*Request timed out. Please try again.*"
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 429:
                yield "\n\n*Rate limit reached. Please wait a moment and try again.*"
            else:
                yield f"\n\n*Service error ({e.response.status_code}). Please try again.*"
        except Exception:
            yield "\n\n*Something went wrong. Please try again.*"


async def chat(
    question: str,
    user_profile: dict | None = None,
    conversation_history: list[dict] | None = None,
    latest_weight: float | None = None,
) -> str:
    chunks = []
    async for chunk in stream_chat(question, user_profile, conversation_history, latest_weight):
        chunks.append(chunk)
    return "".join(chunks)


# ── Rate limiting ──────────────────────────────────────────────────

_rate_store: dict[str, list[float]] = defaultdict(list)
_daily_store: dict[str, list[float]] = defaultdict(list)


def check_rate_limit(user_id: str) -> tuple[bool, str | None]:
    now = time.time()

    minute_window = [t for t in _rate_store[user_id] if now - t < 60]
    _rate_store[user_id] = minute_window
    if len(minute_window) >= settings.coach_rate_limit_per_minute:
        return False, "Rate limit reached. Please wait a moment before sending another message."

    day_start = now - 86400
    daily_window = [t for t in _daily_store[user_id] if t > day_start]
    _daily_store[user_id] = daily_window
    if len(daily_window) >= settings.coach_rate_limit_per_day:
        return False, "Daily limit reached. Please try again tomorrow."

    _rate_store[user_id].append(now)
    _daily_store[user_id].append(now)
    return True, None
