"""Domain classifier and safety guardrails for the AI Coach."""

from __future__ import annotations

import re
from enum import Enum


class Domain(str, Enum):
    FITNESS = "fitness"
    NUTRITION = "nutrition"
    RECOVERY = "recovery"
    SAFETY = "safety"
    OFF_TOPIC = "off_topic"
    GREETING = "greeting"


FITNESS_KEYWORDS = [
    "exercise", "workout", "training", "gym", "muscle", "strength",
    "weight", "lift", "reps", "sets", "squat", "deadlift", "bench",
    "press", "curl", "pull", "push", "cardio", "run", "jog",
    "chest", "back", "shoulders", "arms", "legs", "glutes", "core",
    "stretch", "warmup", "cooldown",
    "form", "technique", "posture", "mobility", "flexibility",
    "split", "routine", "program", "hypertrophy",
    "dumbbell", "barbell", "cable", "machine", "bodyweight",
    "hiit", "liss", "aerobic", "anaerobic", "endurance",
    "sore", "doms", "injury", "rehab", "prehab",
    "personal record", "1rm",
    "body fat", "bmi",
    "warm up", "cool down",
    "glute", "quad", "hamstring", "calf", "bicep", "tricep",
    "forearm", "traps", "lats", "delt",
    "knee", "ankle", "wrist", "elbow", "shoulder",
    "hip", "lower back", "upper back",
    "meal prep", "meal plan",
    "grip", "face pull", "lat pulldown", "cable fly",
    "hip thrust", "lunge", "plank", "crunch",
    "caloric deficit", "caloric surplus",
    "lean gain", "bulking",
    "bench press", "overhead press", "barbell row",
    "pull up", "chin up", "dip", "dips",
    "romanian deadlift", "rdl",
    "preacher curl", "hammer curl",
    "tricep extension", "skull crusher",
    "russian twist", "dead bug",
    "hip flexor", "pigeon pose",
    "foam roll", "foam roller",
    "rep plan", "repplan",
    "progressive overload", "volume",
    "deload", "overtraining",
    "form check", "technique tips",
    "how many sets", "how many reps",
    "proper form",
]

NUTRITION_KEYWORDS = [
    "protein", "calorie", "calories", "bmr",
    "carb", "carbs", "carbohydrate", "fat", "fiber",
    "vitamin", "mineral", "iron", "zinc", "magnesium",
    "omega", "fish oil", "whey", "bcaa", "eaa",
    "caffeine", "supplement", "creatine",
    "meal", "food", "diet", "nutrition", "eat", "eating",
    "hydration", "water", "electrolyte",
    "macro",
    "vegetarian", "vegan", "keto", "fasting",
    "weight loss", "weight gain",
    "tdee",
    "bulking", "cutting", "shred", "bulk",
]

RECOVERY_KEYWORDS = [
    "sleep", "rest", "recovery", "rest day", "rest days",
    "active recovery",
    "foam rolling", "massage",
    "injury recovery",
    "sleep quality", "sleep hygiene",
    "soreness", "muscle soreness",
]

SAFETY_PATTERNS = [
    (r"\b(steroid|testosterone|deca|tren|dianabol|anavar|winstrol)\b", "steroid_use"),
    (r"\b(eating disorder|anorexia|bulimi[ac]|binge[\s-]*purge|binge[\s-]*eat|purging|purge)\b", "eating_disorder"),
    (r"\b(severe pain|chest pain|heart\s*pain|fainting|seizure)\b", "severe_symptoms"),
    (r"\b(extreme calorie|starvation|500\s*cal|very low calorie)\b", "extreme_diet"),
    (r"\b(pregnant|pregnancy|expecting)\b", "pregnancy"),
    (r"\b(children|child|kids?|toddlers?|infants?|minors?)\b", "youth"),
    (r"\b(prescription|medication|drug\s*dosing|medical\s*dose)\b", "medication"),
    (r"\b(diagnos|medical condition|disease|syndrome)\b", "medical_condition"),
    (r"\b(steroid cycle|pct|post cycle|deca durabolin|test e)\b", "steroid_use"),
    (r"\b(dangerous|kill myself|self harm|suicide)\b", "self_harm"),
]

GREETING_PATTERNS = [
    r"^(hi|hey|hello|yo|sup|howdy|hiya|greetings|how's it going|what's up)\b",
    r"^(good\s*(morning|afternoon|evening|day))\b",
]

NON_FITNESS_INTENT_PATTERNS = [
    r"\b(write|create|generate|build|code|program|script)\b.*\b(code|function|script|program|app|website|api|class|method|module|database|query|html|css|javascript|python|java|typescript|react|vue|angular|sql)\b",
    r"\b(code|function|script|program|app|website|api|class|method|module|database|query|html|css|javascript|python|java|typescript|react|vue|angular|sql)\b.*\b(write|create|generate|build|code|program|script)\b",
    r"\b(how to|how do i|help me)\s+(write|create|build|make|code|program)\b",
    r"\b(explain|teach me|what is|define)\b.*\b(programming|coding|algorithm|data structure|syntax|compiler|debug|software|develop)\b",
    r"\b(debug|fix|refactor|optimize)\b.*\b(code|function|script|program)\b",
    r"\b(python|javascript|java|typescript|c\+\+|ruby|go|rust|swift|kotlin|php|scala|html|css|sql|react|vue|angular|node|django|flask|fastapi|spring)\b",
    r"```",
    r"\b(stock|invest|crypto|bitcoin|trading|portfolio|market|dividend|forex|mutual fund|retirement|401k|ira)\b",
    r"\b(movie|film|tv show|netflix|disney|hulu|streaming|actor|actress|director|oscar|emmy)\b",
    r"\b(politics|political|election|vote|president|congress|senate|democrat|republican|liberal|conservative)\b",
    r"\b(weather|forecast|temperature|rain|snow|storm|hurricane)\b",
    r"\b(recipe|cook|bake|kitchen|oven|stove|ingredient|cuisine|restaurant|food recipe)\b",
]


def classify_domain(text: str) -> Domain:
    lower = text.lower().strip()

    for pattern in GREETING_PATTERNS:
        if re.search(pattern, lower):
            return Domain.GREETING

    for pattern, _label in SAFETY_PATTERNS:
        if re.search(pattern, lower, re.IGNORECASE):
            return Domain.SAFETY

    for pattern in NON_FITNESS_INTENT_PATTERNS:
        if re.search(pattern, lower, re.IGNORECASE):
            return Domain.OFF_TOPIC

    score_fitness = 0
    score_nutrition = 0
    score_recovery = 0

    for kw in FITNESS_KEYWORDS:
        if kw in lower:
            score_fitness += 1

    for kw in NUTRITION_KEYWORDS:
        if kw in lower:
            score_nutrition += 1

    for kw in RECOVERY_KEYWORDS:
        if kw in lower:
            score_recovery += 1

    total = score_fitness + score_nutrition + score_recovery
    if total == 0:
        return Domain.OFF_TOPIC

    nutrition_strong = score_nutrition >= 2 and score_nutrition > score_recovery
    recovery_strong = score_recovery >= 2 and score_recovery > score_fitness

    if recovery_strong:
        return Domain.RECOVERY
    if nutrition_strong:
        return Domain.NUTRITION

    if score_fitness >= 1:
        return Domain.FITNESS
    if score_nutrition >= 1:
        return Domain.NUTRITION
    if score_recovery >= 1:
        return Domain.RECOVERY

    return Domain.OFF_TOPIC


SAFETY_RESPONSES = {
    "steroid_use": "I can't provide guidance on anabolic steroids or performance-enhancing drugs. These carry serious health risks. For information about PEDs, please consult a qualified healthcare professional.",
    "eating_disorder": "If you're struggling with an eating disorder, please reach out to a healthcare professional or a helpline in your country. I can help with general nutrition for healthy individuals, but eating disorders require professional support.",
    "severe_symptoms": "If you're experiencing severe pain, chest pain, fainting, or seizures, please seek emergency medical attention immediately. This is not something an AI coach can help with.",
    "extreme_diet": "I can't recommend extreme caloric restriction. Sustainable fat loss uses a moderate deficit (300-500 cal/day) with adequate protein. Very low calorie diets can cause muscle loss, metabolic damage, and nutrient deficiencies.",
    "pregnancy": "Exercise during pregnancy should be done under medical supervision. Please consult your healthcare provider for personalized guidance. I can share general information about safe exercise principles during pregnancy.",
    "youth": "For children and adolescents, training should be supervised by a qualified professional. I can share general youth training principles, but please consult a healthcare provider for specific advice.",
    "medication": "I can't provide guidance on prescription medications or drug dosing. Please consult your doctor or pharmacist for medication-related questions.",
    "medical_condition": "I can't diagnose medical conditions. For medical concerns, please consult a qualified healthcare professional. I can provide general fitness and nutrition information.",
    "self_harm": "If you're in crisis, please contact a crisis helpline in your country. In the US, you can reach the 988 Suicide and Crisis Lifeline by calling or texting 988. Your safety matters.",
}


def get_safety_response(text: str) -> str | None:
    lower = text.lower()
    for pattern, label in SAFETY_PATTERNS:
        if re.search(pattern, lower, re.IGNORECASE):
            return SAFETY_RESPONSES.get(label, SAFETY_RESPONSES["medical_condition"])
    return None


OFF_TOPIC_RESPONSES = [
    "I'm your fitness and nutrition coach — I can only help with workouts, diet, recovery, and training questions. What fitness topic can I help you with?",
    "I specialize in fitness, exercise, and nutrition. I can't help with other topics, but I'd be happy to answer any fitness or diet question!",
    "My expertise is limited to fitness, training, and nutrition. Please ask me about workouts, diet, recovery, or any fitness-related topic!",
]

GREETING_RESPONSES = [
    "Hey! I'm your AI Fitness Coach. I can help with exercises, nutrition, recovery, and training programs. What would you like to know?",
    "Hello! Welcome to RepPlan AI Coach. I'm here to help with all your fitness questions. What can I help you with today?",
    "Hey there! Ready to talk fitness? I can help with workout techniques, diet plans, recovery, and more. What's on your mind?",
]

import random


def get_off_topic_response() -> str:
    return random.choice(OFF_TOPIC_RESPONSES)


def get_greeting_response() -> str:
    return random.choice(GREETING_RESPONSES)
