"""Tests for the RAG retrieval pipeline."""

import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.services.rag import retrieve, build_context, _get_chunks


def test_chunks_loaded():
    chunks = _get_chunks()
    assert len(chunks) > 0, "Knowledge base should have chunks"


def test_retrieve_training_volume():
    results = retrieve("how many sets for hypertrophy")
    assert len(results) > 0
    topics = [r["chunk"]["topic"] for r in results]
    assert any("volume" in t or "sets" in t or "reps" in t for t in topics)


def test_retrieve_protein():
    results = retrieve("how much protein should I eat")
    assert len(results) > 0
    topics = [r["chunk"]["topic"] for r in results]
    assert "protein" in topics or any("protein" in r["chunk"]["title"].lower() for r in results)


def test_retrieve_sleep():
    results = retrieve("importance of sleep for recovery")
    assert len(results) > 0
    topics = [r["chunk"]["topic"] for r in results]
    assert "sleep" in topics


def test_retrieve_creatine():
    results = retrieve("creatine dosage recommendation")
    assert len(results) > 0
    assert any("creatine" in r["chunk"]["title"].lower() for r in results)


def test_retrieve_returns_scores():
    results = retrieve("bench press technique")
    assert all("score" in r for r in results)
    assert all(r["score"] > 0 for r in results)


def test_retrieve_scores_descending():
    results = retrieve("squat form tips")
    if len(results) >= 2:
        assert results[0]["score"] >= results[1]["score"]


def test_retrieve_empty_query():
    results = retrieve("")
    assert results == []


def test_build_context_empty():
    ctx = build_context([])
    assert ctx == ""


def test_build_context_with_results():
    results = retrieve("protein intake")
    ctx = build_context(results)
    assert "Source" in ctx
    assert "protein" in ctx.lower() or "Protein" in ctx


def test_retrieve_off_topic():
    results = retrieve("who won the world cup")
    if results:
        assert results[0]["score"] < 3.0, "Off-topic should score low"


def test_retrieve_returns_top_k():
    results = retrieve("exercise nutrition recovery training", top_k=3)
    assert len(results) <= 3
