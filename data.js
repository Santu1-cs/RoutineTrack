// RoutineTrack — default data (schedule + categories)
// Replace these with your own in Settings; stored in localStorage afterwards.

const DEFAULT_CATEGORIES = [
  { id: "health",  name: "Health",    color: "#22c55e" },
  { id: "work",    name: "Work",      color: "#3b82f6" },
  { id: "study",   name: "Study",     color: "#a855f7" },
  { id: "meal",    name: "Meal",      color: "#f59e0b" },
  { id: "chore",   name: "Chores",    color: "#06b6d4" },
  { id: "mind",    name: "Mind",      color: "#ec4899" },
  { id: "break",   name: "Break",     color: "#94a3b8" }
];

// Baseline timetable — realistic defaults. Edit in Settings > Schedule.
const DEFAULT_SCHEDULE = [
  { id: "a1", time: "06:00", title: "Wake up, brush & get ready", cat: "health", durationMin: 30 },
  { id: "a2", time: "06:30", title: "Morning exercise / walk",    cat: "health", durationMin: 45 },
  { id: "a3", time: "07:15", title: "Shower",                     cat: "health", durationMin: 20 },
  { id: "a4", time: "07:40", title: "Breakfast",                  cat: "meal",   durationMin: 25 },
  { id: "a5", time: "08:10", title: "Plan the day (top 3)",       cat: "work",   durationMin: 15 },
  { id: "a6", time: "08:30", title: "Deep work block 1",          cat: "work",   durationMin: 90 },
  { id: "a7", time: "10:00", title: "Break",                      cat: "break",  durationMin: 15 },
  { id: "a8", time: "10:15", title: "Deep work block 2",          cat: "work",   durationMin: 75 },
  { id: "a9", time: "11:30", title: "Study / learning",           cat: "study",  durationMin: 45 },
  { id: "a10",time: "12:15", title: "Lunch",                      cat: "meal",   durationMin: 45 },
  { id: "a11",time: "13:00", title: "Work / tasks",               cat: "work",   durationMin: 90 },
  { id: "a12",time: "14:30", title: "Study / reading",            cat: "study",  durationMin: 40 },
  { id: "a13",time: "15:10", title: "Snack + walk",               cat: "break",  durationMin: 20 },
  { id: "a14",time: "15:30", title: "Chores / errands",           cat: "chore",  durationMin: 40 },
  { id: "a15",time: "16:10", title: "Skill practice",             cat: "study",  durationMin: 50 },
  { id: "a16",time: "17:00", title: "Free time",                  cat: "break",  durationMin: 60 },
  { id: "a17",time: "18:00", title: "Dinner",                     cat: "meal",   durationMin: 30 },
  { id: "a18",time: "18:30", title: "Wind-down / family",         cat: "mind",   durationMin: 60 },
  { id: "a19",time: "19:30", title: "Journaling + tomorrow plan", cat: "mind",   durationMin: 20 },
  { id: "a20",time: "20:00", title: "Lights out",                 cat: "health", durationMin: 0  }
];
