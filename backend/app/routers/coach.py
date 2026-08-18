"""Coach chat endpoint with streaming and conversation persistence."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse

from app.deps import get_current_user_id
from app.repo import get_repo
from app.schemas.models import CoachChatResponse, CoachMessageIn, CoachConversationOut, CoachMessageOut
from app.services.coach import chat, check_rate_limit, stream_chat

router = APIRouter(prefix="/api/coach", tags=["coach"])


@router.get("/conversations", response_model=list[CoachConversationOut])
def list_conversations(user_id: str = Depends(get_current_user_id)) -> list[dict]:
    repo = get_repo()
    return repo.get_coach_conversations(user_id)


@router.post("/conversations", response_model=CoachConversationOut)
def create_conversation(user_id: str = Depends(get_current_user_id)) -> dict:
    repo = get_repo()
    return repo.create_coach_conversation(user_id)


@router.get("/conversations/{conversation_id}/messages", response_model=list[CoachMessageOut])
def get_messages(conversation_id: str, user_id: str = Depends(get_current_user_id)) -> list[dict]:
    repo = get_repo()
    messages = repo.get_coach_messages(conversation_id)
    if not messages:
        convs = repo.get_coach_conversations(user_id)
        if not any(c["id"] == conversation_id for c in convs):
            raise HTTPException(status_code=404, detail="Conversation not found")
    return messages


@router.post("/chat", response_model=CoachChatResponse)
async def chat_endpoint(data: CoachMessageIn, user_id: str = Depends(get_current_user_id)) -> dict:
    repo = get_repo()

    allowed, error = check_rate_limit(user_id)
    if not allowed:
        raise HTTPException(status_code=429, detail=error)

    conversation_id = data.conversation_id
    if not conversation_id:
        conv = repo.create_coach_conversation(user_id)
        conversation_id = conv["id"]

    repo.add_coach_message(conversation_id, "user", data.message)

    user_profile = repo.get_profile(user_id)
    history_msgs = repo.get_coach_messages(conversation_id)
    conversation_history = [{"role": m["role"], "content": m["content"]} for m in history_msgs[:-1]]

    try:
        latest_metric = repo.get_latest_body_metric(user_id)
        latest_weight = latest_metric.get("weight_kg") if latest_metric else None
    except Exception:
        latest_weight = user_profile.get("weight_kg") if user_profile else None

    response_text = await chat(data.message, user_profile, conversation_history, latest_weight)

    ai_msg = repo.add_coach_message(conversation_id, "assistant", response_text)

    return {
        "conversation_id": conversation_id,
        "message_id": ai_msg["id"],
        "content": response_text,
        "is_streaming": False,
    }


@router.post("/chat/stream")
async def chat_stream_endpoint(data: CoachMessageIn, user_id: str = Depends(get_current_user_id)) -> StreamingResponse:
    repo = get_repo()

    allowed, error = check_rate_limit(user_id)
    if not allowed:
        raise HTTPException(status_code=429, detail=error)

    conversation_id = data.conversation_id
    if not conversation_id:
        conv = repo.create_coach_conversation(user_id)
        conversation_id = conv["id"]

    repo.add_coach_message(conversation_id, "user", data.message)

    user_profile = repo.get_profile(user_id)
    history_msgs = repo.get_coach_messages(conversation_id)
    conversation_history = [{"role": m["role"], "content": m["content"]} for m in history_msgs[:-1]]

    try:
        latest_metric = repo.get_latest_body_metric(user_id)
        latest_weight = latest_metric.get("weight_kg") if latest_metric else None
    except Exception:
        latest_weight = user_profile.get("weight_kg") if user_profile else None

    async def event_stream():
        full_response = []
        async for chunk in stream_chat(data.message, user_profile, conversation_history, latest_weight):
            full_response.append(chunk)
            yield f"data: {chunk}\n\n"
        yield "data: [DONE]\n\n"

        final_text = "".join(full_response)
        repo.add_coach_message(conversation_id, "assistant", final_text)

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
