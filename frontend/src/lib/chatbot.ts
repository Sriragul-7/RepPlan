import FITNESS_TOPICS from "./fitness-knowledge";

interface MatchResult {
  response: string;
  confidence: number;
}

const FITNESS_KEYWORDS = [
  "exercise", "workout", "training", "gym", "muscle", "strength",
  "weight", "lift", "reps", "sets", "squat", "deadlift", "bench",
  "press", "curl", "row", "pull", "push", "cardio", "run", "jog",
  "diet", "nutrition", "protein", "protien", "calorie", "eat", "food", "meal",
  "fat", "weight loss", "gain", "bulk", "cut", "shred", "abs",
  "chest", "back", "shoulders", "arms", "legs", "glutes", "core",
  "stretch", "warmup", "cooldown", "recovery", "rest", "sleep",
  "supplement", "creatine", "whey", "pre-workout", "vitamin",
  "form", "technique", "posture", "mobility", "flexibility",
  "beginner", "advanced", "program", "routine", "split",
  "deadlift", "squat", "bench press", "overhead press", "row",
  "dumbbell", "barbell", "cable", "machine", "bodyweight",
  "hiit", "liss", "aerobic", "anaerobic", "endurance",
  "injury", "pain", "sore", "rehab", "prehab",
  "personal record", "pr", "max", "1rm", "strength",
  "hypertrophy", "powerlifting", "bodybuilding", "crossfit",
  "yoga", "pilates", "stretching", "mobility",
  "body fat", "bmi", "tdee", "macro", "micro",
  "water", "hydration", "electrolyte",
  "rest day", "overtraining", "deload",
  "warm up", "cool down", "spot reduction",
  "glute", "quad", "hamstring", "calf", "bicep", "tricep",
  "forearm", "traps", "lats", "delt", "rhomboid",
  "knee", "ankle", "wrist", "elbow", "shoulder",
  "hip", "lower back", "upper back",
  "vegetarian", "vegan", "keto", "intermittent fasting",
  "meal prep", "meal plan", "food prep",
  "grip", "grip strength", "forearm",
  "face pull", "lat pulldown", "cable fly",
  "hip thrust", "lunge", "plank", "crunch",
  "russian twist", "dead bug",
];

const NON_FITNESS_RESPONSES = [
  "I'm RepPlan AI Coach, focused exclusively on fitness, nutrition, and exercise. I can help you with workout techniques, diet advice, recovery tips, and training programs. What fitness topic would you like to discuss?",
  "I specialize in fitness and nutrition guidance. While I can't help with other topics, I'd be happy to answer questions about exercises, diet plans, muscle building, fat loss, or any fitness-related topic!",
  "My expertise is limited to fitness, exercise, and nutrition. Please ask me about workout routines, proper form, diet strategies, or any fitness-related question!",
  "I'm designed to be your fitness coach! I can help with exercises, nutrition, recovery, and training programs. For other topics, I recommend consulting a different resource. What fitness question can I help with?",
];

const GREETINGS: Record<string, string> = {
  hi: "Hey! I'm your AI Fitness Coach. I can help with exercises, nutrition, recovery, and training programs. What would you like to know?",
  hello: "Hello! Welcome to RepPlan AI Coach. I'm here to help with all your fitness questions. What can I help you with today?",
  hey: "Hey there! Ready to talk fitness? I can help with workout techniques, diet plans, recovery, and more. What's on your mind?",
  yo: "Yo! What's up? I'm your fitness coach. Ask me about exercises, nutrition, or any workout-related topic!",
  sup: "What's up! I'm here to help with your fitness journey. What do you want to know about workouts, diet, or recovery?",
  morning: "Good morning! Ready to crush your workout today? I can help with your training plan, nutrition, or any fitness question!",
  afternoon: "Good afternoon! How can I help with your fitness goals today?",
  evening: "Good evening! Looking for some fitness advice? I'm here to help!",
  "good morning": "Good morning! Let's start the day with some fitness knowledge. What would you like to know?",
  "good afternoon": "Good afternoon! What fitness topic can I help you with?",
  "good evening": "Good evening! Time for some fitness guidance. What's your question?",
};

function isGreeting(input: string): string | null {
  const lower = input.toLowerCase().trim();
  for (const [key, response] of Object.entries(GREETINGS)) {
    if (lower === key || lower.startsWith(key + " ") || lower.endsWith(" " + key)) {
      return response;
    }
  }
  return null;
}

function isFitnessRelated(input: string): boolean {
  const lower = input.toLowerCase();

  for (const keyword of FITNESS_KEYWORDS) {
    if (lower.includes(keyword)) {
      return true;
    }
  }

  const words = lower.split(/\s+/);
  const fitnessWordCount = words.filter((w) =>
    FITNESS_KEYWORDS.some((k) => k.includes(w) || w.includes(k))
  ).length;

  return fitnessWordCount >= 2;
}

function calculateMatchScore(input: string, topic: typeof FITNESS_TOPICS[0]): number {
  const lower = input.toLowerCase();
  let score = 0;

  for (const keyword of topic.keywords) {
    if (lower.includes(keyword)) {
      score += 3;
    }
  }

  for (const pattern of topic.patterns) {
    if (pattern.test(input)) {
      score += 5;
    }
  }

  const inputWords = lower.split(/\s+/);
  for (const word of inputWords) {
    if (word.length > 2) {
      for (const keyword of topic.keywords) {
        if (keyword.includes(word)) {
          score += 1;
        }
      }
    }
  }

  return score;
}

export function getFitnessResponse(input: string): string {
  const trimmed = input.trim();

  if (!trimmed) {
    return "Please ask me a fitness-related question! I can help with exercises, nutrition, recovery, and training programs.";
  }

  const greetingResponse = isGreeting(trimmed);
  if (greetingResponse) {
    return greetingResponse;
  }

  if (!isFitnessRelated(trimmed)) {
    return NON_FITNESS_RESPONSES[Math.floor(Math.random() * NON_FITNESS_RESPONSES.length)];
  }

  let bestMatch: MatchResult = { response: "", confidence: 0 };

  for (const topic of FITNESS_TOPICS) {
    const score = calculateMatchScore(trimmed, topic);
    if (score > bestMatch.confidence) {
      bestMatch = { response: topic.response, confidence: score };
    }
  }

  if (bestMatch.confidence >= 3) {
    return bestMatch.response;
  }

  const fallbackResponses = [
    "That's a great question! While I don't have specific information on that exact topic, I'd recommend consulting a certified fitness professional for personalized advice. Is there anything else about exercises, nutrition, or training I can help with?",
    "I don't have detailed information on that specific topic, but I can help with a wide range of fitness subjects! Try asking about specific exercises (like squats, deadlifts, bench press), nutrition (protein, calories, meal prep), or training concepts (hypertrophy, strength, recovery).",
    "Interesting question! I may not have the exact answer, but I'm here to help with fitness fundamentals. What specific aspect of training, nutrition, or recovery would you like to explore?",
  ];

  return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
}

export function getQuickSuggestions(): string[] {
  return [
    "How to improve my bench press?",
    "How much protein do I need?",
    "Best exercises for chest?",
    "How to lose fat effectively?",
    "What should I eat before workout?",
    "How many rest days per week?",
    "Is creatine safe?",
    "How to fix bad posture?",
  ];
}
