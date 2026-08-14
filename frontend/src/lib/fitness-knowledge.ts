type FitnessTopic = {
  keywords: string[];
  patterns: RegExp[];
  response: string;
};

const FITNESS_TOPICS: FitnessTopic[] = [
  // ==================== EXERCISES ====================
  {
    keywords: ["bench press", "chest press", "bench"],
    patterns: [/bench\s*(press)?/i, /chest\s*press/i],
    response: `**Bench Press** is a compound exercise targeting the chest, shoulders, and triceps.

**Muscles Worked:**
• Primary: Pectoralis major (chest)
• Secondary: Anterior deltoids, triceps

**Proper Form:**
1. Lie flat on bench, feet flat on floor
2. Grip bar slightly wider than shoulder width
3. Unrack and lower to mid-chest
4. Press up and slightly back to lockout
5. Keep shoulder blades retracted throughout

**Common Mistakes:**
• Bouncing bar off chest
• Lifting hips off bench
• Flaring elbows too wide (keep 45-75° angle)
• Half reps (full range of motion is key)

**Variations:** Incline, decline, dumbbell, close-grip`,
  },
  {
    keywords: ["squat", "squats", "barbell squat", "back squat"],
    patterns: [/squat/i, /back\s*squat/i],
    response: `**Squat** is the king of lower body exercises, working quads, glutes, and core.

**Muscles Worked:**
• Primary: Quadriceps, glutes
• Secondary: Hamstrings, core, lower back

**Proper Form:**
1. Bar rests on upper traps (high bar) or rear delts (low bar)
2. Feet shoulder-width apart, toes slightly out
3. Brace core, push hips back and down
4. Descend until thighs are at least parallel
5. Drive through mid-foot to stand

**Common Mistakes:**
• Knees caving inward (push them out)
• Rising on toes (keep weight mid-foot)
• Rounding lower back (maintain neutral spine)
• Not hitting depth (aim for parallel or below)

**Variations:** Front squat, goblet squat, pause squat`,
  },
  {
    keywords: ["deadlift", "dead lifts", "conventional deadlift"],
    patterns: [/deadlift/i, /dead\s*lift/i],
    response: `**Deadlift** is a full-body compound movement building raw strength and muscle.

**Muscles Worked:**
• Primary: Hamstrings, glutes, erector spinae
• Secondary: Quads, lats, traps, forearms, core

**Proper Form:**
1. Stand with feet hip-width, bar over mid-foot
2. Bend at hips and knees, grip bar just outside knees
3. Flatten back, chest up, brace core
4. Drive floor away, bar stays close to body
5. Lock out hips at top, don't hyperextend

**Common Mistakes:**
• Rounding the back (most dangerous)
• Jerking the bar (smooth pull)
• Bar drifting forward
• Hyperextending at top

**Variations:** Sumo, Romanian, trap bar, deficit`,
  },
  {
    keywords: ["deadlift", "romanian deadlift", "rdl"],
    patterns: [/romanian/i, /r\.?d\.?l\.?/i],
    response: `**Romanian Deadlift (RDL)** targets the posterior chain, especially hamstrings.

**Muscles Worked:**
• Primary: Hamstrings, glutes
• Secondary: Lower back, lats, forearms

**Key Points:**
1. Start standing with bar at hip level
2. Slight knee bend, push hips BACK (not down)
3. Lower bar along legs until hamstring stretch
4. Drive hips forward to return to start
5. Feel the stretch in hamstrings throughout

**vs Conventional Deadlift:**
• RDL starts from top, conventional from floor
• RDL emphasizes hamstrings, conventional is full-body
• Less knee bend in RDL

**Common Mistakes:**
• Rounding back
• Bending knees too much
• Not pushing hips back enough`,
  },
  {
    keywords: ["overhead press", "ohp", "military press", "shoulder press"],
    patterns: [/overhead\s*press/i, /military\s*press/i, /ohp/i, /shoulder\s*press/i],
    response: `**Overhead Press** is the ultimate shoulder builder and core stabilizer.

**Muscles Worked:**
• Primary: Anterior and lateral deltoids
• Secondary: Triceps, upper chest, traps, core

**Proper Form:**
1. Stand tall, feet shoulder-width
2. Bar at collarbone, hands just outside shoulders
3. Brace core, press bar straight up
4. Move head back slightly to clear bar path
5. Lock out overhead, biceps by ears

**Common Mistakes:**
• excessive leanback (core too weak)
• Pressing in front (bar path should be vertical)
• Not full lockout at top
• Loose core throughout

**Tip:** This is a strict movement — no leg drive (that's a push press).`,
  },
  {
    keywords: ["barbell row", "bent over row", "rowing"],
    patterns: [/barbell\s*row/i, /bent\s*over\s*row/i, /bent\s*row/i],
    response: `**Barbell Row** builds a thick, strong back.

**Muscles Worked:**
• Primary: Lats, rhomboids, traps
• Secondary: Biceps, rear delts, lower back

**Proper Form:**
1. Hinge at hips, torso ~45° angle
2. Grip bar slightly wider than shoulders
3. Pull bar to lower chest/upper abdomen
4. Squeeze shoulder blades at top
5. Control the negative (2-3 seconds)

**Variations:**
• Pendlay Row: From floor each rep (explosive)
• Yates Row: Underhand grip, more biceps
• Meadows Row: Landmine, unilateral

**Common Mistakes:**
• Using momentum/swinging
• Pulling to wrong spot (aim for belly button area)
• Standing too upright`,
  },
  {
    keywords: ["pull up", "pullup", "pull-ups", "chin up", "chinup"],
    patterns: [/pull[\s-]*up/i, /chin[\s-]*up/i],
    response: `**Pull-ups** are the gold standard for upper body pulling strength.

**Muscles Worked:**
• Primary: Lats, biceps
• Secondary: Rear delts, rhomboids, forearms, core

**Grip Variations:**
• Overhand (pull-up): More lats, harder
• Underhand (chin-up): More biceps, slightly easier
• Neutral: Shoulder-friendly, balanced

**Progression Tips (if you can't do one yet):**
1. Dead hangs (build grip)
2. Band-assisted pull-ups
3. Negative pull-ups (slow eccentric)
4. Lat pulldowns
5. Australian pull-ups (inverted row)

**Form Cues:**
• Start from dead hang
• Pull to chest (not just chin over bar)
• Control the descent
• No kipping (strict form first)`,
  },
  {
    keywords: ["dip", "dips", "chest dip", "tricep dip"],
    patterns: [/\bdips?\b/i, /tricep\s*dip/i, /chest\s*dip/i],
    response: `**Dips** are an excellent compound exercise for chest and triceps.

**Muscles Worked:**
• Chest dips (lean forward): Pectorals, front delts
• Tricep dips (upright): Triceps primarily

**Proper Form:**
1. Grip parallel bars, support bodyweight
2. Lean forward slightly for chest emphasis
3. Lower until shoulders are below elbows
4. Press back up to full lockout
5. Keep elbows relatively close (not flared)

**Common Mistakes:**
• Going too deep (shoulder injury risk)
• Not enough range of motion
• Swinging/bouncing
• Flaring elbows

**Progression:** Add weight once you can do 12+ clean reps.`,
  },
  {
    keywords: ["lunge", "lunges", "walking lunge", "reverse lunge"],
    patterns: [/lunge/i, /walking\s*lunge/i, /reverse\s*lunge/i],
    response: `**Lunges** are excellent for unilateral leg development and balance.

**Muscles Worked:**
• Primary: Quads, glutes
• Secondary: Hamstrings, core (stabilization)

**Variations:**
• Walking Lunge: Forward stepping, great for glutes
• Reverse Lunge: Step back, easier on knees
• Bulgarian Split: Rear foot elevated, quad dominant
• Lateral Lunge: Targets adductors and abductors

**Form Tips:**
• Keep torso upright
• Front knee tracks over toes (not past them excessively)
• Back knee lowers toward floor
• Step length affects muscle emphasis

**Programming:** Great as accessory work after squats, or standalone on leg days.`,
  },
  {
    keywords: ["hip thrust", "glute bridge", "hip raises"],
    patterns: [/hip\s*thrust/i, /glute\s*bridge/i, /hip\s*raise/i],
    response: `**Hip Thrust** is the best exercise for glute development.

**Muscles Worked:**
• Primary: Gluteus maximus
• Secondary: Hamstrings, core

**Proper Form:**
1. Upper back against bench, feet flat on floor
2. Bar across hip crease (use pad)
3. Drive hips up, squeeze glutes hard at top
4. Hold 1-2 seconds at peak contraction
5. Lower with control

**Common Mistakes:**
• Hyperextending lower back at top
• Feet too far forward (more hamstrings)
• Not full hip extension
• Using momentum

**Programming:** 3-4 sets of 8-12 reps, 2x per week optimal for glute growth.`,
  },
  {
    keywords: ["bicep curl", "bicep curls", "curls", "barbell curl"],
    patterns: [/bicep\s*curl/i, /\bcurls?\b/i, /barbell\s*curl/i],
    response: `**Bicep Curls** build arm size and strength.

**Muscles Worked:**
• Biceps brachii (long and short head)
• Brachialis, brachioradialis

**Variations:**
• Barbell Curl: Heaviest, most mass
• Dumbbell Curl: Allows supination, balanced
• Hammer Curl: Targets brachialis, forearms
• Preacher Curl: Eliminates cheating
• Incline Curl: Emphasizes long head (stretch)

**Tips:**
• Keep elbows pinned to sides
• Full range of motion (full stretch to full contraction)
• Control the negative (2-3 seconds)
• Don't swing or use momentum
• 8-12 reps optimal for hypertrophy`,
  },
  {
    keywords: ["tricep", "triceps", "tricep extension", "skull crusher"],
    patterns: [/tricep/i, /skull\s*crush/i, /tricep\s*extension/i],
    response: `**Triceps** make up 2/3 of arm size — important for arm development!

**Muscles Worked:**
• Long head (largest, visible from side)
• Lateral head (creates horseshoe shape)
• Medial head (underneath)

**Best Exercises by Head:**
• Long Head: Overhead extensions, skull crushers
• Lateral: Pushdowns, dips
• Medial: Close-grip bench, pressdowns

**Key Principles:**
1. Overhead movements target long head (stretched position)
2. Pushdowns target lateral/medial heads
3. Compound movements (dips, close-grip bench) for mass
4. Isolation (extensions, pushdowns) for detail

**Programming:** 2-3 tricep exercises, 8-15 reps, 2x per week.`,
  },
  {
    keywords: ["lat pulldown", "pulldown", "cable pulldown"],
    patterns: [/lat\s*pulldown/i, /pulldown/i],
    response: `**Lat Pulldown** is a great back builder, especially if you can't do pull-ups yet.

**Muscles Worked:**
• Primary: Latissimus dorsi
• Secondary: Biceps, rear delts, rhomboids

**Key Points:**
1. Lean back slightly (10-15°)
2. Pull to upper chest (not behind neck!)
3. Squeeze lats at bottom of movement
4. Control the return (don't let stack crash)
5. Full stretch at top

**Common Mistakes:**
• Pulling behind neck (shoulder injury risk)
• Using too much momentum
• Not full range of motion
• Gripping too wide

**Tip:** If you can do 8+ strict pull-ups, prioritize those over pulldowns.`,
  },
  {
    keywords: ["cable fly", "cable crossover", "chest fly", "flys"],
    patterns: [/cable\s*fly/i, /chest\s*fly/i, /\bflys?\b/i, /crossover/i],
    response: `**Cable Flyes** provide constant tension for chest isolation.

**Muscles Worked:**
• Primary: Pectoralis major
• Secondary: Anterior deltoids

**Variations:**
• High-to-low: Targets lower chest
• Low-to-high: Targets upper chest
• Mid-level: Overall chest

**Form Tips:**
1. Slight bend in elbows (maintain throughout)
2. Squeeze hands together, not just forward
3. Feel the stretch at the start position
4. 2-3 second negative
5. Don't go too heavy (form > weight)

**Programming:** 3-4 sets of 12-15 reps, perfect finisher after compounds.`,
  },
  {
    keywords: ["face pull", "face pulls", "rear delt"],
    patterns: [/face\s*pull/i, /rear\s*delt/i],
    response: `**Face Pulls** are essential for shoulder health and posture.

**Muscles Worked:**
• Rear deltoids
• External rotators
• Rhomboids, middle traps

**Why They're Important:**
• Counteracts sitting/posture issues
• Prevents shoulder injuries
• Builds balanced shoulder development
• Improves overhead pressing strength

**Proper Form:**
1. Cable at face height, rope attachment
2. Pull rope to face, elbows high and back
3. Externally rotate (thumbs point back)
4. Squeeze rear delts and hold 1-2 seconds
5. Slow return

**Programming:** 2-3 sets of 15-20 reps, 2-3x per week. High reps work best.`,
  },
  {
    keywords: ["plank", "planks", "core plank", "plank hold"],
    patterns: [/plank/i],
    response: `**Planks** are the foundation of core stability.

**Muscles Worked:**
• Rectus abdominis
• Transverse abdominis (deep core)
• Obliques
• Erector spinae

**Proper Form:**
1. Forearms on floor, elbows under shoulders
2. Body in straight line from head to heels
3. Squeeze glutes, brace core like someone's about to punch you
4. Don't let hips sag or pike up
5. Breathe normally (don't hold breath)

**Duration Guidelines:**
• Beginner: 20-30 seconds
• Intermediate: 45-60 seconds
• Advanced: 60+ seconds

**Progression:** Once you can hold 60s easily, add weight or try harder variations (side plank, RKC plank).`,
  },
  {
    keywords: ["crunch", "crunches", "ab crunch", "abdominal"],
    patterns: [/crunch/i, /ab\s*crunch/i],
    response: `**Crunches** isolate the rectus abdominis for ab development.

**Proper Form:**
1. Lie on back, knees bent, feet flat
2. Hands behind head (don't pull on neck)
3. Lift shoulders off floor using abs only
4. Squeeze at top for 1-2 seconds
5. Lower with control

**Key Points:**
• Focus on squeezing abs, not momentum
• Lower back stays on floor (not a full sit-up)
• Exhale on the way up
• Feel the contraction, don't just go through motions

**Alternatives:**
• Cable crunches (add resistance)
• Hanging leg raises (lower abs)
• Ab wheel (advanced)

**Note:** Abs are made in the gym but revealed in the kitchen — body fat matters more for visible abs.`,
  },
  {
    keywords: ["dead bug", "deadbug"],
    patterns: [/dead\s*bug/i, /deadbug/i],
    response: `**Dead Bug** is excellent for core stability and coordination.

**How To Perform:**
1. Lie on back, arms straight up, knees bent 90°
2. Press lower back into floor (no arch!)
3. Slowly extend opposite arm and leg toward floor
4. Return to start, alternate sides
5. Move slowly and controlled

**Benefits:**
• Trains anti-extension (core stability)
• Safe for lower back
• Improves coordination
• Great warm-up exercise

**Common Mistakes:**
• Lower back arching (core disengaged)
• Moving too fast
• Not breathing properly

**Progression:** Add ankle weights or hold a medicine ball.`,
  },
  {
    keywords: ["russian twist", "russian twists", "oblique twist"],
    patterns: [/russian\s*twist/i, /oblique\s*twist/i],
    response: `**Russian Twists** target the obliques for rotational core strength.

**Proper Form:**
1. Sit with knees bent, feet slightly off floor
2. Lean back to 45° angle
3. Clasp hands or hold weight at chest
4. Rotate torso side to side
5. Control the movement, don't rush

**Muscles Worked:**
• Internal and external obliques
• Rectus abdominis (stabilization)

**Variations:**
• Bodyweight (beginner)
• Medicine ball (intermediate)
• Weight plate (advanced)

**Tip:** Focus on rotating from the ribcage, not just moving arms.`,
  },
  {
    keywords: ["hip flexor", "hip flexors", "tight hips", "hip stretch"],
    patterns: [/hip\s*flexor/i, /tight\s*hip/i, /hip\s*stretch/i],
    response: `**Hip Flexor Stretches** are crucial for desk workers and athletes.

**Why They Get Tight:**
• Prolonged sitting shortens hip flexors
• Weak glutes cause overactive hip flexors
• Running/cycling without stretching

**Best Stretches:**
1. Kneeling hip flexor stretch (30s each side)
2. Pigeon pose (30-60s each side)
3. 90/90 stretch
4. Couch stretch (advanced)

**Strengthening:**
• Hip flexor marches
• Hanging leg raises
• L-sits

**Routine:** Stretch hip flexors daily, especially if you sit 6+ hours. 2-3 rounds of 30s holds.`,
  },
  {
    keywords: ["sore", "muscle soreness", "doms", "recovery sore", "soreness"],
    patterns: [/sore/i, /doms/i, /muscle\s*soreness/i, /recovery\s*sore/i],
    response: `**Muscle Soreness (DOMS)** is normal after new or intense workouts.

**What is DOMS?**
Delayed Onset Muscle Soreness peaks 24-72 hours post-workout. It's caused by micro-tears in muscle fibers — this is how muscles grow!

**How to Manage:**
• Light movement (walking, gentle stretching)
• Foam rolling / massage
• Adequate protein (1.6-2.2g per kg bodyweight)
• Sleep 7-9 hours
• Stay hydrated
• Contrast showers (hot/cold)

**When to Worry:**
• Sharp pain (not dull ache)
• Pain that worsens with activity
• Swelling or bruising
• Pain lasting 7+ days

**Important:** Being sore doesn't mean you had a good workout. Progress (more reps/weight) matters more.`,
  },
  {
    keywords: ["rest day", "rest days", "recovery day", "active recovery"],
    patterns: [/rest\s*day/i, /recovery\s*day/i, /active\s*recovery/i],
    response: `**Rest Days** are essential for muscle growth and preventing burnout.

**Why Rest Matters:**
• Muscles grow during rest, not during training
• Prevents overtraining and injury
• Restores glycogen stores
• Allows nervous system recovery

**How Many Rest Days:**
• Beginners: 3-4 rest days per week
• Intermediate: 2-3 rest days per week
• Advanced: 1-2 rest days per week

**What To Do on Rest Days:**
• Light walking (15-30 min)
• Stretching / yoga
• Foam rolling
• Meal prep
• Sleep extra

**Active Recovery:** Low-intensity movement promotes blood flow and speeds recovery. Don't just sit all day.`,
  },
  {
    keywords: ["warm up", "warmup", "warm-up", "warming up"],
    patterns: [/warm\s*up/i, /warmup/i, /warming\s*up/i],
    response: `**Warm-ups** prepare your body for intense training and prevent injury.

**Why Warm Up:**
• Increases body temperature
• Improves blood flow to muscles
• Activates nervous system
• Improves range of motion
• Reduces injury risk

**Effective Warm-up (10-15 min):**
1. General: 3-5 min light cardio (bike, row, jog)
2. Dynamic stretches: Leg swings, arm circles, hip circles
3. Activation: Band work, glute bridges
4. Specific: Light sets of first exercise

**Example for Squat Day:**
1. 3 min bike
2. Leg swings (10 each direction)
3. Bodyweight squats (2×10)
4. Band pull-aparts (2×15)
5. Empty bar squats (2×10)
6. Working sets

**Don't:** Static stretch cold muscles (save for after workout).`,
  },
  {
    keywords: ["cool down", "cooldown", "cool-down", "post workout"],
    patterns: [/cool\s*down/i, /cooldown/i, /post\s*workout/i],
    response: `**Cool-downs** help your body transition from intense exercise to rest.

**Benefits:**
• Gradually lowers heart rate
• Prevents blood pooling
• Begins recovery process
• Improves flexibility over time

**Effective Cool-down (5-10 min):**
1. 3-5 min light cardio (walking, cycling)
2. Static stretching (30s each major muscle group)
3. Foam rolling (optional)

**Static Stretching Post-Workout:**
• Hamstrings
• Quads
• Hip flexors
• Chest
• Lats
• Shoulders

**Key:** Static stretching is most effective when muscles are warm (post-workout). Hold each stretch 30 seconds, don't bounce.`,
  },
  {
    keywords: ["spot reduction", "spot train", "burn fat", "lose belly", "lose stomach"],
    patterns: [/spot\s*reduc/i, /burn\s*fat/i, /lose\s*(belly|stomach|fat)/i],
    response: `**Spot Reduction is a Myth** — you can't target fat loss from specific areas.

**The Truth:**
• Fat loss happens全身 (全身 = whole body)
• Your genetics determine where you lose fat first
• You can't choose where fat comes off
• Doing 1000 crunches won't burn belly fat specifically

**What Actually Works:**
1. Caloric deficit (eat less than you burn)
2. Strength training (preserve muscle)
3. Cardio (increase calorie burn)
4. Consistency over time

**Where Fat Comes Off (general pattern):**
• First: Face, arms, chest
• Middle: Legs, hips
• Last: Lower belly, love handles (hardest)

**Focus on:** Overall fat loss through diet + training, not endless crunches.`,
  },
  {
    keywords: ["protein", "protein intake", "how much protein", "protein needs"],
    patterns: [/how\s*much\s*protein/i, /protein\s*intake/i, /protein\s*need/i],
    response: `**Protein** is crucial for muscle repair and growth.

**Daily Protein Needs:**
• Sedentary: 0.8g per kg bodyweight
• Regular exercise: 1.2-1.6g per kg
• Strength training: 1.6-2.2g per kg
• Cutting phase: 2.0-2.4g per kg (preserves muscle)

**Example (75kg person):**
• Training days: 120-165g protein
• Rest days: 100-120g protein

**Best Protein Sources:**
• Chicken breast (31g/100g)
• Greek yogurt (10g/100g)
• Eggs (6g each)
• Lean beef (26g/100g)
• Fish (20-25g/100g)
• Tofu (8g/100g)
• Whey protein (25g/scoop)

**Timing:** Spread intake across 3-5 meals for optimal muscle protein synthesis. Post-workout protein is important but total daily intake matters most.`,
  },
  {
    keywords: ["calorie", "calories", "caloric deficit", "calorie surplus", "tdee"],
    patterns: [/calori?e/i, /tdee/i, /caloric\s*(deficit|surplus)/i],
    response: `**Calories** determine weight change — it's all about energy balance.

**Key Concepts:**
• Caloric deficit → Weight loss
• Caloric surplus → Weight gain
• Maintenance → Weight stable

**TDEE (Total Daily Energy Expenditure):**
Estimate your daily calorie needs:
• Sedentary: BMR × 1.2
• Light exercise: BMR × 1.375
• Moderate exercise: BMR × 1.55
• Very active: BMR × 1.725

**For Fat Loss:**
• Deficit of 300-500 calories per day
• Lose 0.5-1 lb per week (sustainable)
• Don't go below BMR

**For Muscle Gain:**
• Surplus of 200-300 calories per day
• Minimize fat gain
• Lean bulk > dirty bulk

**Tracking:** Use an app like MyFitnessPal for a few weeks to understand portions.`,
  },
  {
    keywords: ["sleep", "sleeping", "how much sleep", "sleep quality", "insomnia"],
    patterns: [/sleep/i, /how\s*much\s*sleep/i, /sleep\s*quality/i],
    response: `**Sleep** is the most underrated factor in fitness progress.

**How Much Sleep:**
• Adults: 7-9 hours per night
• Athletes: 8-10 hours recommended
• Less than 6 hours hurts recovery and gains

**Why Sleep Matters for Fitness:**
• Growth hormone released during deep sleep
• Muscle repair happens during sleep
• Poor sleep increases cortisol (muscle breakdown)
• Reduces appetite regulation (harder to diet)
• Impairs workout performance

**Sleep Quality Tips:**
1. Consistent sleep/wake times
2. Cool room (65-68°F / 18-20°C)
3. No screens 1 hour before bed
4. No caffeine after 2 PM
5. Dark room (blackout curtains)
6. Avoid large meals before bed

**Bottom Line:** You can't out-train bad sleep. Prioritize it like you prioritize training.`,
  },
  {
    keywords: ["creatine", "creatine supplement", "creatine monohydrate"],
    patterns: [/creatine/i],
    response: `**Creatine Monohydrate** is the most researched and effective supplement.

**What It Does:**
• Increases ATP production (energy for explosive movements)
• Allows more reps/weight in gym
• Supports muscle growth over time
• May improve cognitive function

**Dosage:**
• Loading phase (optional): 20g/day for 5-7 days
• Maintenance: 3-5g daily (forever)
• No need to cycle on/off
• Timing doesn't matter (just be consistent)

**Common Concerns:**
• "It's a steroid" — No, it's natural and safe
• "It hurts kidneys" — No evidence in healthy individuals
• "It causes bloating" — Minimal water retention initially
• "You need to cycle it" — No, continuous use is fine

**Cost:** Very cheap ($10-15 for 2 months). Don't buy fancy forms — monohydrate is best.`,
  },
  {
    keywords: ["whey protein", "protein shake", "protein powder", "supplement"],
    patterns: [/whey\s*protein/i, /protein\s*shake/i, /protein\s*powder/i, /supplement/i],
    response: `**Protein Supplements** are convenient but not magic.

**Whey Protein:**
• Fast-absorbing, great post-workout
• Complete amino acid profile
• 25g protein per scoop typically
• Good for: convenience, hitting protein goals

**Types:**
• Whey Concentrate: Cheaper, slightly less pure
• Whey Isolate: Lactose-free, higher protein %
• Casein: Slow-digesting, good before bed
• Plant-based: Soy, pea, rice blends

**Do You Need It?**
• No — real food is just as good
• Yes — if you struggle to eat enough protein
• It's a supplement, not a replacement

**Timing:**
• Post-workout: Good but not critical
• Anytime: Total daily intake matters most
• Before bed: Casein is good option

**Quality:** Look for third-party tested brands (NSF, Informed Sport).`,
  },
  {
    keywords: ["pre workout", "pre-workout", "caffeine", "energy drink"],
    patterns: [/pre\s*workout/i, /caffeine/i, /energy\s*drink/i],
    response: `**Pre-workout supplements** can boost performance but aren't necessary.

**What's Actually Effective:**
• Caffeine (3-6mg per kg bodyweight)
• Citrulline malate (6-8g)
• Beta-alanine (3-5g)
• Creatine (5g, already covered)

**Caffeine:**
• 200-400mg before training (3-6mg/kg)
• Improves strength, endurance, focus
• Don't train late if it affects sleep
• Tolerance builds up over time

**Pre-workout Supplements:**
• Most are overpriced caffeine + filler
• Check the label for effective doses
• Many ingredients are underdosed

**Natural Alternatives:**
• Black coffee (cheapest, effective)
• Green tea (lower caffeine, antioxidants)
• Banana + oats (natural energy)

**Warning:** Don't rely on stimulants. Build consistent energy through sleep, nutrition, and training.`,
  },
  {
    keywords: ["bcaa", "bcaas", "branch chain", "amino acids", "eaas"],
    patterns: [/bcaa/i, /bcaas/i, /branch\s*chain/i, /amino\s*acid/i, /\beaa/i],
    response: `**BCAAs and EAAs** — are they worth it?

**BCAAs (Branched-Chain Amino Acids):**
• Leucine, isoleucine, valine
• Claim: Reduce soreness, build muscle

**The Truth:**
• If you eat enough protein (1.6g+/kg), BCAAs are unnecessary
• Complete protein sources already contain BCAAs
• Studies show no benefit over regular protein

**EAAs (Essential Amino Acids):**
• All 9 essential amino acids
• Slightly better than BCAAs alone
• Still unnecessary if protein intake is adequate

**When They Might Help:**
• Training fasted (rare)
• Very high protein needs (elite athletes)
• Can't eat/drink real food

**Bottom Line:** Save your money. Spend it on real food or quality protein powder instead.`,
  },
  {
    keywords: ["fat loss", "lose fat", "burn fat", "cutting", "shred"],
    patterns: [/fat\s*loss/i, /lose\s*fat/i, /burn\s*fat/i, /\bcutting\b/i, /\bshred/i],
    response: `**Fat Loss** requires a systematic approach — here's what works.

**The Formula:**
Calories in < Calories out (sustainable deficit)

**Key Principles:**
1. Moderate caloric deficit (300-500 cal/day)
2. High protein (2.0-2.4g/kg to preserve muscle)
3. Strength train (maintain muscle mass)
4. Add cardio (increase deficit without cutting more food)
5. Sleep well (hormonal balance)

**What Doesn't Work:**
• Crash diets (lose muscle, gain it back)
• Excessive cardio (metabolic adaptation)
• Fat burners (mostly caffeine)
• Waist trainers (just sweat)

**Timeline:**
• 0.5-1% body weight per week is sustainable
• Plateaus are normal — adjust every 4-6 weeks
• Diet breaks can help long-term adherence

**Remember:** The best diet is the one you can stick to.`,
  },
  {
    keywords: ["muscle gain", "build muscle", "hypertrophy", "gaining weight", "bulking"],
    patterns: [/muscle\s*gain/i, /build\s*muscle/i, /hypertrophy/i, /gain(ing)?\s*weight/i, /\bbulk/i],
    response: `**Muscle Gain** requires progressive overload, adequate nutrition, and recovery.

**The Fundamentals:**
1. Progressive overload (increase weight/reps over time)
2. Caloric surplus (200-300 cal above maintenance)
3. Adequate protein (1.6-2.2g/kg)
4. Sufficient rest (7-9 hours sleep)

**Training for Hypertrophy:**
• Rep range: 6-12 reps per set
• Sets per muscle: 10-20 per week
• Frequency: Each muscle 2x per week
• Intensity: 1-3 reps from failure
• Volume: Start conservative, increase gradually

**Nutrition:**
• Lean bulk: 200-300 cal surplus (minimize fat gain)
• Protein spread across 3-5 meals
• Carbs fuel workouts (don't fear them)
• Fats support hormones (0.8-1g/kg minimum)

**Realistic Gains:**
• Year 1: 10-15 lbs muscle (newbie gains)
• Year 2: 5-8 lbs
• Year 3+: 2-4 lbs
• Genetics matter — be patient`,
  },
  {
    keywords: ["strength", "get stronger", "strength training", "1rm", "one rep max"],
    patterns: [/get\s*strong/i, /strength\s*train/i, /1\s*rm/i, /one\s*rep\s*max/i],
    response: `**Strength Training** focuses on increasing maximal force production.

**Key Principles:**
1. Low reps, heavy weight (1-5 reps)
2. Long rest periods (3-5 minutes)
3. Compound movements (squat, bench, deadlift, OHP)
4. Progressive overload (add weight weekly)
5. Skill practice (technique work)

**Strength vs Hypertrophy:**
• Strength: 1-5 reps, heavy weight, long rest
• Hypertrophy: 6-12 reps, moderate weight, shorter rest
• Both build muscle, but differently

**Programs for Strength:**
• Starting Strength (beginner)
• StrongLifts 5×5 (beginner)
• Texas Method (intermediate)
• 5/3/1 (intermediate-advanced)

**1RM Estimation:** If you can do 5 reps at 100kg, your estimated 1RM is ~115kg.

**Key Lifts:** Squat, Bench Press, Deadlift, Overhead Press, Barbell Row`,
  },
  {
    keywords: ["cardio", "cardio exercise", "aerobic", "running", "jogging"],
    patterns: [/cardio/i, /aerobic/i, /\brunning\b/i, /\bjogging\b/i],
    response: `**Cardio** improves cardiovascular health and aids fat loss.

**Types of Cardio:**
• LISS (Low Intensity): Walking, light cycling (60-70% max HR)
• MISS (Moderate): Jogging, swimming (70-80% max HR)
• HIIT (High Intensity): Sprints, intervals (80-95% max HR)

**How Much Cardio:**
• General health: 150 min moderate OR 75 min vigorous per week
• Fat loss: Add 2-4 sessions to strength training
• Muscle gain: Minimize (2-3 sessions, keep intensity)

**Cardio vs Weights:**
• Weights build muscle, boost metabolism
• Cardio burns calories during activity
• Best approach: Both combined

**For Fat Loss:**
• Walking is underrated (10k steps daily)
• HIIT burns more calories in less time
• Don't overdo cardio (can interfere with recovery)

**Tip:** You don't need to run marathons. Walking 8-10k steps daily is excellent.`,
  },
  {
    keywords: ["stretch", "stretching", "flexibility", "mobility", "limber"],
    patterns: [/stretch/i, /flexibility/i, /mobility/i, /\blimber/i],
    response: `**Stretching and Mobility** are crucial for long-term fitness.

**Types:**
• Static: Hold 30s (post-workout, daily)
• Dynamic: Moving stretches (warm-up)
• PNF: Contract-relax (advanced flexibility)

**Benefits:**
• Improved range of motion
• Reduced injury risk
• Better posture
• Enhanced recovery
• Less muscle tension

**Daily Routine (10 min):**
1. Hip flexor stretch (30s each)
2. Hamstring stretch (30s each)
3. Pigeon pose (30s each)
4. Chest stretch (30s)
5. Lat stretch (30s each)
6. Neck circles (10 each direction)

**When to Stretch:**
• Dynamic: Before training (warm-up)
• Static: After training (cool-down) or before bed
• Don't static stretch cold muscles

**Consistency:** 10 minutes daily beats 60 minutes once a week.`,
  },
  {
    keywords: ["grip strength", "grip", "forearm", "forearms", "wrist"],
    patterns: [/grip\s*strength/i, /\bgrip\b/i, /forearm/i, /wrist/i],
    response: `**Grip Strength** is often the weak link in pulling exercises.

**Why It Matters:**
• Deadlifts, rows, pull-ups limited by grip
• Carries build functional strength
• Strong grip = strong upper body

**Exercises to Improve:**
1. Farmer's carries (heavy, short distance)
2. Dead hangs (30-60 seconds)
3. Plate pinches (hold two plates together)
4. Towel pull-ups
5. Wrist curls (for size)
6. Fat grip training

**Grip Types:**
• Crush grip: Squeezing (handshakes)
• Pinch grip: Thumb opposition (plate holds)
• Support grip: Holding (deadlifts, carries)

**Programming:** Add grip work 2-3x per week, high frequency is key for grip.`,
  },
  {
    keywords: ["improve bench press", "bench press tips", "increase bench", "bench stronger"],
    patterns: [/improve\s*bench/i, /increase\s*bench/i, /bench\s*(press)?\s*(strong|tip|help)/i],
    response: `**How to Improve Your Bench Press**

**Common Sticking Points:**
• Off the chest: Weak pecs, poor leg drive
• Mid-range: Weak triceps
• Lockout: Triceps weakness, poor bar path

**Programming Tips:**
1. Bench 2-3x per week (frequency matters)
2. Volume: 10-20 sets per week for chest
3. Include variations: Incline, close-grip, pauses
4. Accessory work: Triceps, front delts, lats

**Technique Fixes:**
• Retract shoulder blades (protect shoulders)
• Drive feet into floor (leg drive)
• Bar path: Slight J-curve (not straight up)
• arch back slightly (reduces range, protects shoulders)

**Weak Point Training:**
• Pause bench (off chest weakness)
• Board press / pin press (mid-range)
• Close-grip bench (triceps)
• Floor press (lockout)

**Quick Wins:** Proper nutrition, sleep, and consistency beat any program.`,
  },
  {
    keywords: ["improve squat", "squat tips", "increase squat", "squat stronger"],
    patterns: [/improve\s*squat/i, /increase\s*squat/i, /squat\s*(strong|tip|help)/i],
    response: `**How to Improve Your Squat**

**Common Issues:**
• Knees caving: Weak glutes, poor cueing
• Good morning squat: Weak quads, poor bracing
• Can't hit depth: Mobility, ankle flexibility
• Leaning too far forward: Core strength, bar position

**Programming:**
1. Squat 2-3x per week
2. Include variations: Pause squats, front squats
3. Accessory work: Leg press, lunges, leg curls
4. Core strengthening: Planks, ab wheel

**Technique Tips:**
• Brace before descent (Valsalva maneuver)
• Push knees out (cue: "spread the floor")
• Drive through mid-foot
• Keep chest up
• Full depth (hip crease below knee)

**Mobility Work:**
• Ankle mobility (knee-over-toe stretches)
• Hip mobility (90/90, pigeon pose)
• T-spine mobility (foam roller extensions)

**Quick Fix:** Work on ankle and hip mobility — most depth issues are mobility, not strength.`,
  },
  {
    keywords: ["improve deadlift", "deadlift tips", "increase deadlift", "deadlift stronger"],
    patterns: [/improve\s*deadlift/i, /increase\s*deadlift/i, /deadlift\s*(strong|tip|help)/i],
    response: `**How to Improve Your Deadlift**

**Sticking Points:**
• Off the floor: Weak quads, poor setup
• Mid-shin: Grip, back weakness
• Lockout: Glutes, hamstrings weakness

**Programming:**
1. Deadlift 1-2x per week (recovery matters)
2. Accessory work: Romanian DL, hip thrusts, rows
3. Grip training (often the limiting factor)
4. Core strengthening

**Technique:**
• Bar over mid-foot
• Flatten back, engage lats
• Push floor away (don't pull up)
• Bar stays close to body
• Lock out with glutes

**Variations for Weak Points:**
• Pause deadlifts: Off-floor weakness
• Block pulls: Lockout weakness
• Deficit deadlifts: Off-floor strength
• Rack pulls: Overload the top

**Pro Tip:** Film your sets. Most form issues are invisible to the lifter.`,
  },
  {
    keywords: ["posture", "bad posture", "fix posture", "rounded shoulders", "forward head"],
    patterns: [/posture/i, /rounded\s*shoulder/i, /forward\s*head/i],
    response: `**Poor Posture** is common but fixable with the right approach.

**Common Issues:**
• Forward head: From looking at screens
• Rounded shoulders: Chest dominant, weak back
• Anterior pelvic tilt: Weak core, tight hip flexors
• Kyphosis: Upper back rounding

**Exercises to Fix:**
1. Face pulls (15-20 reps, 3x daily)
2. Band pull-aparts (daily)
3. Wall angels (daily)
4. Chin tucks (for forward head)
5. Hip flexor stretches (for anterior tilt)
6. Dead bugs (core stability)

**Daily Habits:**
• Stand up every 30 minutes
• Monitor at eye level
• Take phone calls standing
• Stretch chest and hip flexors daily
• Strengthen upper back

**Timeline:** 4-8 weeks of consistent work shows noticeable improvement. Posture is a long game.`,
  },
  {
    keywords: ["injury", "hurt", "pain", "受伤", "hurt during workout", "workout pain"],
    patterns: [/injur/i, /\bhurt\b/i, /\bpain\b/i, /hurt\s*during/i, /workout\s*pain/i],
    response: `**Dealing with Training Injuries**

**Important:** I can provide general guidance, but see a medical professional for actual injuries.

**General Rules:**
1. Stop the exercise causing pain
2. Ice acute injuries (20 min on, 20 min off)
3. Don't train through sharp pain
4. Mild soreness is OK, sharp pain is NOT

**Common Training Injuries:**
• Lower back: Squats/deadlifts form
• Shoulder: Bench press, overhead work
• Knee: Squats, lunges
• Elbow: Curl/extension overload
• Wrist: Poor grip, bar position

**When to See a Doctor:**
• Can't put weight on it
• Swelling that doesn't go down
• Numbness or tingling
• Pain that worsens over days
• Joint instability

**Prevention:**
• Proper warm-up
• Progressive overload (not too fast)
• Good form always
• Adequate recovery
• Listen to your body`,
  },
  {
    keywords: ["vegetarian", "vegan", "plant based", "plant protein", "no meat"],
    patterns: [/vegetarian/i, /vegan/i, /plant[\s-]*based/i, /plant\s*protein/i, /no\s*meat/i],
    response: `**Vegetarian/Vegan Fitness** is absolutely achievable with proper planning.

**Protein Sources:**
• Tofu/Tempeh: 20-30g per serving
• Lentils: 18g per cup (cooked)
• Chickpeas: 15g per cup
• Quinoa: 8g per cup
• Seitan: 25g per 100g
• Edamame: 17g per cup
• Plant protein powder: 20-25g per scoop

**Challenges & Solutions:**
• Protein completeness: Combine sources (rice + beans)
• B12: Supplement (essential for vegans)
• Iron: Pair with vitamin C for absorption
• Creatine: Supplement (not found in plants)

**Meal Ideas:**
• Breakfast: Tofu scramble + whole grain toast
• Lunch: Lentil soup + quinoa
• Dinner: Tempeh stir-fry with vegetables
• Snack: Protein shake + nuts

**Tips:** Track protein for a few weeks to ensure you're hitting targets. Plant proteins require more volume for same protein content.`,
  },
  {
    keywords: ["intermittent fasting", "if", "fasting", "eat stop eat", "16/8", "18/6"],
    patterns: [/intermittent\s*fasting/i, /\bif\b.*diet/i, /\bfasting\b/i, /\b16\/8\b/i, /\b18\/6\b/i],
    response: `**Intermittent Fasting (IF)** — does it work for fitness?

**What Is IF:**
• Cycling between eating and fasting windows
• Common: 16/8 (16 hours fast, 8 hour eating)
• Other: 18/6, 20/4, or OMAD (one meal a day)

**Does It Help Fat Loss?**
• Only if it helps you eat fewer calories overall
• No magic fat-burning effect from fasting
• It's a tool for calorie control, not a magic solution

**Pros:**
• Simplifies meal planning
• May improve insulin sensitivity
• Some prefer fewer, larger meals
• Can preserve muscle if protein is adequate

**Cons:**
• May be hard to hit protein goals
• Can affect workout performance (if training fasted)
• Not suitable for everyone
• Social challenges with eating schedules

**For Fitness:**
• If you train fasted: Performance may suffer
• Better approach: Train in eating window
• Prioritize protein in meals

**Bottom Line:** Use IF if it helps you stick to your calories. It's not superior to regular dieting.`,
  },
  {
    keywords: ["keto", "ketogenic", "low carb", "carb cycling", "ketosis"],
    patterns: [/keto/i, /ketogenic/i, /low\s*carb/i, /carb\s*cycl/i, /ketosis/i],
    response: `**Keto Diet for Fitness** — should you do it?

**What Is Keto:**
• Very low carb (20-50g per day)
• High fat (70-80% of calories)
• Moderate protein
• Puts body in ketosis (burns fat for fuel)

**Pros for Fat Loss:**
• May reduce appetite
• Quick initial weight loss (water weight)
• Some prefer the food choices

**Cons for Fitness:**
• Can reduce gym performance (glycogen depletion)
• Hard to build muscle (carbs fuel workouts)
• Difficult to sustain long-term
• May cause keto flu initially
• Limited food variety

**For Muscle Building:**
• Not ideal — carbs are important for performance
• Strength may decrease
• Recovery can suffer

**Verdict:** Keto works for fat loss if you stick to it, but it's not optimal for building muscle or high-intensity training. Moderate carb diets work better for most athletes.

**Better Approach:** Carb cycling (higher carbs on training days, lower on rest days).`,
  },
  {
    keywords: ["water", "hydration", "drinking water", "how much water", "drink water"],
    patterns: [/water/i, /hydrat/i, /drinking\s*water/i, /how\s*much\s*water/i],
    response: `**Hydration** is crucial for performance and recovery.

**How Much Water:**
• General: 3-4 liters per day
• Active: Add 500-1000ml per hour of exercise
• Hot climate: Add more
• Rule of thumb: Urine should be pale yellow

**Why It Matters for Fitness:**
• Dehydration reduces performance by 10-20%
• Impairs muscle function
• Reduces strength and endurance
• Slows recovery
• Affects focus and energy

**Signs of Dehydration:**
• Dark yellow urine
• Thirst (you're already dehydrated)
• Headache
• Fatigue
• Dizziness

**Hydration Tips:**
1. Drink water first thing in morning
2. Carry a water bottle everywhere
3. Drink before, during, and after training
4. Add electrolytes during long/intense sessions
5. Monitor urine color

**Myth:** "You need 8 glasses a day" — varies by individual, activity, climate. Listen to your body.`,
  },
  {
    keywords: ["meal prep", "meal planning", "food prep", "prepping meals"],
    patterns: [/meal\s*prep/i, /meal\s*plan/i, /food\s*prep/i, /prep\s*meal/i],
    response: `**Meal Prep** is the secret weapon for consistent nutrition.

**Benefits:**
• Controls portions and calories
• Saves time during busy weeks
• Reduces impulse eating
• Ensures adequate protein
• Saves money

**How to Start:**
1. Pick 2-3 protein sources
2. Pick 2-3 carb sources
3. Pick 2-3 vegetable sources
4. Prep in bulk on Sunday
5. Store in containers (5-7 days)

**Sample Prep:**
• Protein: Chicken breast, ground turkey, eggs
• Carbs: Rice, sweet potatoes, oats
• Veggies: Broccoli, spinach, mixed greens
• Fats: Avocado, nuts, olive oil

**Storage:**
• Fridge: 3-4 days
• Freezer: 2-3 months (for proteins)
• Glass containers keep food fresh longer

**Tips:**
• Start simple (2-3 meals)
• Invest in good containers
• Season food differently each day
• Prep snacks too (nuts, fruit, yogurt)`,
  },
];

export default FITNESS_TOPICS;
