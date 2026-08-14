"""Tests for domain classification and safety guardrails."""

import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.services.domain_classifier import (
    Domain,
    classify_domain,
    get_safety_response,
    get_off_topic_response,
    get_greeting_response,
)


def test_classify_fitness():
    assert classify_domain("how do I bench press properly") == Domain.FITNESS


def test_classify_training():
    assert classify_domain("how many sets and reps for squats") == Domain.FITNESS


def test_classify_nutrition():
    assert classify_domain("how much protein should I eat daily") == Domain.NUTRITION


def test_classify_calories():
    assert classify_domain("what is my TDEE for weight loss") == Domain.NUTRITION


def test_classify_recovery():
    assert classify_domain("how many rest days per week") == Domain.RECOVERY


def test_classify_sleep():
    assert classify_domain("importance of sleep for muscle growth") in (Domain.RECOVERY, Domain.FITNESS)


def test_classify_off_topic_coding():
    assert classify_domain("write me a python function") == Domain.OFF_TOPIC


def test_classify_off_topic_movies():
    assert classify_domain("what is the best movie of 2024") == Domain.OFF_TOPIC


def test_classify_off_topic_politics():
    assert classify_domain("who should I vote for") == Domain.OFF_TOPIC


def test_classify_off_topic_finance():
    assert classify_domain("how to invest in stocks") == Domain.OFF_TOPIC


def test_classify_greeting():
    assert classify_domain("hello") == Domain.GREETING


def test_classify_greeting_hi():
    assert classify_domain("hi there") == Domain.GREETING


def test_classify_safety_steroids():
    domain = classify_domain("what steroid cycle should I do")
    assert domain == Domain.SAFETY


def test_classify_safety_eating_disorder():
    domain = classify_domain("I have an eating disorder and need help")
    assert domain == Domain.SAFETY


def test_classify_safety_severe_pain():
    domain = classify_domain("I have severe chest pain during exercise")
    assert domain == Domain.SAFETY


def test_safety_response_steroids():
    response = get_safety_response("testosterone cycle dosage")
    assert response is not None
    assert "steroid" in response.lower() or "performance-enhancing" in response.lower()


def test_safety_response_eating_disorder():
    response = get_safety_response("I am bulimic and purging food")
    assert response is not None
    assert "healthcare" in response.lower() or "professional" in response.lower()


def test_safety_response_none_for_safe():
    response = get_safety_response("how to do a bicep curl")
    assert response is None


def test_safety_response_none_for_nutrition():
    response = get_safety_response("how much protein per day")
    assert response is None


def test_off_topic_response():
    resp = get_off_topic_response()
    assert isinstance(resp, str)
    assert len(resp) > 10


def test_greeting_response():
    resp = get_greeting_response()
    assert isinstance(resp, str)
    assert "fitness" in resp.lower() or "coach" in resp.lower() or "hey" in resp.lower() or "hello" in resp.lower()


def test_classify_fitness_broad():
    assert classify_domain("is creatine safe for kidney health") in (Domain.FITNESS, Domain.NUTRITION)
    assert classify_domain("best exercises for chest development") == Domain.FITNESS
    assert classify_domain("how to lose belly fat") in (Domain.FITNESS, Domain.NUTRITION)
    assert classify_domain("progressive overload principles") == Domain.FITNESS


def test_classify_off_topic_code_with_fitness_keywords():
    assert classify_domain("write me python code for a workout tracker") == Domain.OFF_TOPIC
    assert classify_domain("create a fitness app in javascript") == Domain.OFF_TOPIC
    assert classify_domain("build a workout website") == Domain.OFF_TOPIC
    assert classify_domain("generate a script for gym logging") == Domain.OFF_TOPIC
    assert classify_domain("help me code a nutrition calculator") == Domain.OFF_TOPIC
    assert classify_domain("write a function to calculate TDEE") == Domain.OFF_TOPIC


def test_classify_off_topic_non_fitness_domains():
    assert classify_domain("what is the best stock to invest in") == Domain.OFF_TOPIC
    assert classify_domain("best movie of 2024") == Domain.OFF_TOPIC
    assert classify_domain("who should I vote for") == Domain.OFF_TOPIC
    assert classify_domain("what's the weather today") == Domain.OFF_TOPIC
    assert classify_domain("teach me programming") == Domain.OFF_TOPIC
