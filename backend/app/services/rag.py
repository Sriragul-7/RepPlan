"""Lightweight RAG pipeline using BM25-style retrieval."""

from __future__ import annotations

import json
import math
import os
import re
from pathlib import Path
from typing import TypedDict

KNOWLEDGE_DIR = Path(__file__).resolve().parents[2] / "knowledge"


class KnowledgeChunk(TypedDict):
    title: str
    topic: str
    source: str
    year: int
    evidence_level: str
    content: str
    _category: str


def _tokenize(text: str) -> list[str]:
    return re.findall(r"[a-z0-9]+", text.lower())


def _load_all_chunks() -> list[KnowledgeChunk]:
    chunks: list[KnowledgeChunk] = []
    if not KNOWLEDGE_DIR.exists():
        return chunks
    for category_dir in KNOWLEDGE_DIR.iterdir():
        if not category_dir.is_dir():
            continue
        for json_file in category_dir.glob("*.json"):
            try:
                data = json.loads(json_file.read_text())
                if isinstance(data, list):
                    for item in data:
                        item["_category"] = category_dir.name
                        chunks.append(item)
            except (json.JSONDecodeError, TypeError):
                continue
    return chunks


_ALL_CHUNKS: list[KnowledgeChunk] | None = None


def _get_chunks() -> list[KnowledgeChunk]:
    global _ALL_CHUNKS
    if _ALL_CHUNKS is None:
        _ALL_CHUNKS = _load_all_chunks()
    return _ALL_CHUNKS


def _compute_idf(chunks: list[KnowledgeChunk]) -> dict[str, float]:
    n = len(chunks)
    df: dict[str, int] = {}
    for chunk in chunks:
        doc_tokens = set(_tokenize(chunk["content"] + " " + chunk["title"] + " " + chunk["topic"]))
        for token in doc_tokens:
            df[token] = df.get(token, 0) + 1
    return {token: math.log((n - count + 0.5) / (count + 0.5) + 1) for token, count in df.items()}


_IDF: dict[str, float] | None = None


def _get_idf() -> dict[str, float]:
    global _IDF
    if _IDF is None:
        _IDF = _compute_idf(_get_chunks())
    return _IDF


def _bm25_score(query_tokens: list[str], doc_tokens: list[str], idf: dict[str, float], k1: float = 1.5, b: float = 0.75) -> float:
    avg_dl = 100.0
    dl = len(doc_tokens)
    tf_map: dict[str, int] = {}
    for t in doc_tokens:
        tf_map[t] = tf_map.get(t, 0) + 1
    score = 0.0
    for qt in query_tokens:
        if qt not in idf:
            continue
        tf = tf_map.get(qt, 0)
        idf_val = idf[qt]
        numerator = tf * (k1 + 1)
        denominator = tf + k1 * (1 - b + b * dl / avg_dl)
        score += idf_val * numerator / denominator
    return score


class RetrievalResult(TypedDict):
    chunk: KnowledgeChunk
    score: float


def retrieve(query: str, top_k: int = 5) -> list[RetrievalResult]:
    chunks = _get_chunks()
    if not chunks:
        return []

    idf = _get_idf()
    query_tokens = _tokenize(query)
    if not query_tokens:
        return []

    scored: list[RetrievalResult] = []
    for chunk in chunks:
        doc_text = chunk["content"] + " " + chunk["title"] + " " + chunk["topic"]
        doc_tokens = _tokenize(doc_text)
        s = _bm25_score(query_tokens, doc_tokens, idf)
        if s > 0:
            scored.append({"chunk": chunk, "score": s})

    scored.sort(key=lambda x: -x["score"])
    return scored[:top_k]


def build_context(results: list[RetrievalResult]) -> str:
    if not results:
        return ""
    parts = []
    for i, r in enumerate(results, 1):
        c = r["chunk"]
        parts.append(
            f"[Source {i}] {c['title']}\n"
            f"Topic: {c['topic']} | Evidence: {c['evidence_level']} | {c['source']} ({c['year']})\n"
            f"{c['content']}\n"
        )
    return "\n".join(parts)
