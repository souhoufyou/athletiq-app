# Flexible Program Scheduling

This document explains the flexible program scheduling feature that allows users to choose their training days and starting session.

## Overview

Previously, AthletIQ assigned programs to fixed weekdays:
- Monday: Push A (always)
- Tuesday: Pull A (always)
- Wednesday: Legs A (always)
- etc.

Now, programs intelligently rotate through available days, allowing:
1. **Day Selection**: Choose which days to train (e.g., no Thursday due to judo)
2. **Starting Session**: Choose which session to start with (e.g., begin with Legs instead of Push)
3. **Automatic Rotation**: Sessions cycle in proper order (Push→Pull→Legs→Push...) regardless of rest days

## Architecture

### New Types (`types/training.ts`)

```typescript
export type ActiveProgramConfig = {
  availableWeekdays: Weekday[];    // Days user can train
  startingSessionIndex: number;    // Which session to start with (0-indexed)
};

export type ActiveProgramMeta = {
  // ... existing fields ...
  flexibleConfig?: ActiveProgramConfig;  // New optional config
};
```

### New Module (`lib/programScheduling.ts`)

**`scheduleSessionsFlexibly(sessions, availableWeekdays, startingSessionIndex)`**

Intelligently schedules sessions by:
1. Rotating the session array so the starting session is first
2. Cyclically assigning sessions to available weekdays
3. Respecting session rotation order (even with rest days in between)

**Helpers:**
- `rotateArray<T>(arr, startIndex)` - Non-mutating array rotation
- `assignWeekdaysCyclically(sessions, weekdays)` - Cyclic weekday assignment
- `getSessionSequenceType(session)` - Detects session type (Push/Pull/Legs/etc.)

### Updated Function (`lib/programInstantiation.ts`)

```typescript
export function instantiateProgramTemplate(
  template: ProgramTemplate,
  settings?: Pick<UserSettings, "availableDays">,
  config?: ActiveProgramConfig  // NEW parameter
): PlannedSession[]
```

**Behavior:**
- If `config` provided: uses `scheduleSessionsFlexibly()`
- Otherwise: falls back to default positional mapping (backward compatible)

## Usage Examples

### Example 1: PPL Starting with Push (Normal)

```typescript
const config: ActiveProgramConfig = {
  availableWeekdays: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"],
  startingSessionIndex: 0  // Start with Push A (first session)
};

const program = instantiateProgramTemplate(pplTemplate, settings, config);
```

**Result:**
```
Monday:    Push A
Tuesday:   Pull A
Wednesday: Legs A
Thursday:  Push B
Friday:    Pull B
Saturday:  Legs B
```

### Example 2: PPL Starting with Legs

```typescript
const config: ActiveProgramConfig = {
  availableWeekdays: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"],
  startingSessionIndex: 2  // Start with Legs A (third session)
};

const program = instantiateProgramTemplate(pplTemplate, settings, config);
```

**Result:**
```
Monday:    Legs A
Tuesday:   Push B
Wednesday: Pull B
Thursday:  Legs B
Friday:    Push A
Saturday:  Pull A
```

Session rotation is preserved! Legs continues after Push B, and the cycle completes correctly.

### Example 3: PPL with Thursday Rest (Judo Day)

```typescript
const config: ActiveProgramConfig = {
  availableWeekdays: ["monday", "tuesday", "wednesday", "friday", "saturday", "sunday"],
  // Thursday excluded because of judo
  startingSessionIndex: 2  // Start with Legs A
};

const program = instantiateProgramTemplate(pplTemplate, settings, config);
```

**Result:**
```
Monday:    Legs A
Tuesday:   Push B
Wednesday: Pull B
Friday:    Legs B      ← Rotation continues, skips Thu rest
Saturday:  Push A
Sunday:    Pull A
```

Notice: The session sequence is unaffected by the missing Thursday. The rotation continues naturally.

### Example 4: Upper/Lower Starting with Lower

```typescript
const config: ActiveProgramConfig = {
  availableWeekdays: ["monday", "tuesday", "thursday", "friday"],
  startingSessionIndex: 1  // Start with Lower Force (second session)
};

const program = instantiateProgramTemplate(ulTemplate, settings, config);
```

**Result:**
```
Monday:    Lower Force
Tuesday:   Upper Volume
Thursday:  Lower Volume
Friday:    Upper Force
```

Perfect rotation: Lower→Upper→Lower→Upper

### Example 5: Full Body (No Special Rotation Needed)

```typescript
const config: ActiveProgramConfig = {
  availableWeekdays: ["monday", "wednesday", "friday"],
  startingSessionIndex: 0
};

const program = instantiateProgramTemplate(fbTemplate, settings, config);
```

**Result:**
```
Monday:    Full Body A
Wednesday: Full Body B
Friday:    Full Body C
```

Each session is unique, so rotation doesn't apply. Sessions simply cycle through available days.

## How It Works

### Step 1: Array Rotation

The `rotateArray()` function moves the starting session to index 0:

```
Original:   [Push A, Pull A, Legs A, Push B, Pull B, Legs B]
startIndex: 2 (Legs A)

After rotation:
            [Legs A, Push B, Pull B, Legs B, Push A, Pull A]
```

### Step 2: Cyclic Assignment

The `assignWeekdaysCyclically()` function maps sessions to available weekdays:

```
Sessions:   [Legs A, Push B, Pull B, Legs B, Push A, Pull A]
Weekdays:   [Mon,    Tue,    Wed,    Thu,    Fri,    Sat]
               ↓      ↓      ↓      ↓      ↓      ↓
Result:     Mon: Legs A
            Tue: Push B
            Wed: Pull B
            Thu: Legs B
            Fri: Push A
            Sat: Pull A
```

### Step 3: Natural Rotation Over Weeks

In week 2, the pattern naturally continues:

```
Week 1:
Mon: Legs A, Tue: Push B, Wed: Pull B, Thu: Legs B, Fri: Push A, Sat: Pull A

Week 2 (if 6 days available):
Sun: Pull B, Mon: Legs A, Tue: Push B, Wed: Pull B, Thu: Legs B, Fri: Push A
```

The rotation never resets; it naturally cycles through the full program.

## Integration Points

### Storage (`lib/storage.ts`)

When a program is loaded/saved, the `flexibleConfig` is stored in `ActiveProgramMeta`:

```typescript
const meta: ActiveProgramMeta = {
  programId: "ppl-6j",
  programName: "Push Pull Legs Classique",
  selectedAt: new Date().toISOString(),
  source: "manual",
  flexibleConfig: {  // NEW
    availableWeekdays: ["monday", "tuesday", "wednesday", "friday", "saturday"],
    startingSessionIndex: 2
  }
};
```

### Program Builder (`lib/programBuilder.ts`)

Currently uses `chooseWeekdays()` to select available days based on `UserSettings.availableDays`.
This result can be passed to `instantiateProgramTemplate()` as `config.availableWeekdays`.

### UI (Future Enhancement)

Once a UI component is added to let users choose:
1. **Starting session**: Radio buttons or dropdown showing session titles
2. **Available days**: Checkbox grid (Mon-Sun) for day selection
3. **Confirmation**: Generate program with selected configuration

## Backward Compatibility

✅ **Fully backward compatible:**

- Existing programs without `flexibleConfig` continue to work unchanged
- Default behavior (no config) uses the original positional mapping
- No breaking changes to existing types or APIs
- All existing stored programs work without migration

```typescript
// Old way (still works)
const program = instantiateProgramTemplate(template, settings);

// New way (with flexibility)
const program = instantiateProgramTemplate(template, settings, config);
```

## Testing Scenarios

### ✓ Scenario 1: PPL Normal
- Program: 6 sessions
- Days: 6 available (Mon-Sat)
- Starting: Push
- Expected: Push→Pull→Legs→Push→Pull→Legs

### ✓ Scenario 2: PPL Starting Legs
- Program: 6 sessions
- Days: 6 available (Mon-Sat)
- Starting: Legs (index 2)
- Expected: Legs→Push→Pull→Legs→Push→Pull ✓ (proper rotation)

### ✓ Scenario 3: PPL with Rest Day
- Program: 6 sessions
- Days: 5 available (Mon, Tue, Wed, Fri, Sat) [Thu rest]
- Starting: Legs
- Expected: Rotation continues despite missing Thursday ✓

### ✓ Scenario 4: Upper/Lower
- Program: 4 sessions
- Days: 4 available
- Starting: Lower (index 1)
- Expected: Lower→Upper→Lower→Upper ✓

### ✓ Scenario 5: Full Body 3-day
- Program: 3 sessions
- Days: 3 available (Mon, Wed, Fri)
- Starting: Any
- Expected: A→B→C ✓

## Notes

- **No session type detection needed** for basic rotation; array index determines order
- **Rest days don't break rotation** - they're simply skipped in the weekday assignment
- **Pattern shift over weeks is natural** - if 6 sessions and 5 days available, pattern shifts by 1 day each week (this is expected behavior)
- **Reusable for all program types** - works identically for PPL, Upper/Lower, Full Body, Hypertrophy splits, etc.

## Future Enhancements

1. **UI for Configuration**: Add settings panel to choose starting session and available days
2. **Smart Defaults**: Auto-suggest starting session based on user's weak points
3. **Week Planner**: Show full month view of sessions with flexible scheduling
4. **Adaptive Rescheduling**: Allow mid-week adjustments if user needs to skip a day
