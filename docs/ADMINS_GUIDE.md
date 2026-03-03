# CricLive - Admin's Guide

**Version:** 1.0  
**Date:** March 3, 2026  
**Application:** CricLive - Live Cricket Score Monitor

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Creating a Match](#creating-a-match)
3. [Setting Up Teams](#setting-up-teams)
4. [Recording Scores](#recording-scores)
5. [Managing Bowlers](#managing-bowlers)
6. [Managing Players](#managing-players)
7. [Undo Functionality](#undo-functionality)
8. [Ending a Match](#ending-a-match)
9. [Viewing Summary](#viewing-summary)
10. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Accessing the Admin Panel

1. Navigate to **https://criclive-sigma.vercel.app**
2. Click **"Create Match"** button on the landing page
3. You will be logged in as an admin and taken to the match creation screen

### Login Requirements

- Admin access is required to manage matches and scores
- Session is maintained in browser localStorage
- Use the same browser to maintain admin session

---

## Creating a Match

### Step 1: Match Details

1. Fill in the following information:
   - **Team A Name** (e.g., "Mumbai Indians")
   - **Team B Name** (e.g., "Delhi Capitals")
   - **Overs** (typically 20 for T20, 50 for ODI)
   - **Toss Winner** (select which team won coin toss)
   - **Elected To** (choose "Bat" or "Field")

2. Click **"Next"** to proceed to team setup

### Step 2: Select Toss Winner's Playing XI

1. Select **11 players** from the available player pool
2. The **first selected player** becomes the striker
3. The **second selected player** becomes the non-striker
4. Click **"Next"** to select the opponent's team

### Step 3: Select Opponent's Playing XI

1. Select **11 players** for the opposing team
2. The **first selected player** becomes the bowler
3. Click **"Start Match"** to begin live scoring

### Pre-Match Summary

Before match starts, verify:
- [ ] Both teams have 11 players
- [ ] Striker and non-striker are different players
- [ ] Bowler is from the fielding team
- [ ] Overs count is correct
- [ ] Toss winner and elected position are correct

---

## Setting Up Teams

### Adding Players to Team

CricLive uses a centralized player pool. When creating a match:

1. Browse the **available players** list
2. Search players by name using the **search box**
3. Click on a player to **add to playing XI**
4. Click to **remove** if you made a mistake
5. Verify selection shows exactly **11 players**

### Player Information

Each player in the system has:
- **Name** (unique identifier)
- **Jersey Number** (optional, for reference)
- **Role** (Batter/Bowler/All-rounder, for context only)

### Team Composition Best Practices

- **Opening Pair:** Select your best batsmen for opening
- **Middle Order:** Choose stable middle-order batsmen
- **Lower Order:** Include reliable bowlers
- **All-rounders:** Distribute batting and bowling talent
- **Specialist Bowler:** Ensure at least 4-5 bowling options

---

## Recording Scores

### During an Over

The scoring panel shows:

- **Current Striker** (batting player, highlighted)
- **Current Non-Striker** (waiting to bat)
- **Current Bowler** (fielding player)
- **Runs This Over** and **Ball Count** (updates live)

### Recording Runs (Regular Delivery)

1. Click the **number buttons** (0, 1, 2, 3, 4, 6) to record runs
2. Application automatically:
   - **Swaps striker/non-striker** if odd runs (1, 3)
   - **Advances to next ball**
   - **Rotates bowler** when over completes (after 6th ball)

3. Verify on-screen display matches expected state

### Recording a Wicket (Out)

1. Click the **"Out"** button when a batter is dismissed
2. Select the **type of dismissal** (Caught, Bowled, LBW, Run Out, etc.)
3. Select the **bowler credited** (usually current bowler)
4. New batter from bench automatically takes strike
5. Application advances to next ball

### Recording Extras

**Wide Ball:**
- 1 run added to extras
- Striker/non-striker **do NOT swap** (same batter continues)
- Over count does NOT advance (separate over tally)
- Bowler does NOT rotate

**No Ball:**
- 1 run added to extras  
- Striker/non-striker **do NOT swap** (same batter continues)
- Over count does NOT advance
- Bowler does NOT rotate

**Bye/Leg Bye:**
- Batter does NOT run (run credited to "byes" or "leg byes")
- Runs recorded automatically
- Striker/non-striker **swap** if odd runs
- Over count **DOES advance**
- Bowler rotates at over end

---

## Managing Bowlers

### Automatic Bowler Rotation

- **Bowler rotates automatically** after every complete over (6 balls)
- System selects next bowler randomly from fielding team
- Selected bowler is **always different** from previous bowler
- No manual action required by admin

### Changing Bowler Manually (If Needed)

1. Click on the **current bowler name/button** in the scoring panel
2. Select a **different bowler** from dropdown
3. Confirm selection
4. Change takes effect on next ball

### Bowler Considerations

- **Bowling Limits:** CricLive doesn't enforce bowling limits; track manually
- **Rotation Strategy:** System uses random selection (no bias toward any bowler)
- **Impact on Undo:** Correct bowler is restored when undo is used

---

## Managing Players

### Changing Striker/Non-Striker (During Match)

**Swap for Field Adjustment:**
- Click **"Swap Striker"** button to exchange striker and non-striker
- Useful if you need non-striker to face next ball
- **Note:** Normally this happens automatically on odd runs

**Bringing New Batter (Non-Dismissal):**
- Use **"Out"** action if retiring hurt or similar
- New batter selected from available players
- Takes strike immediately

### Selecting Next Available Batter

When a batter is out, the system:
1. Filters out already-used players
2. Randomly selects from remaining bench players
3. **Guarantees** the selected player is not already non-striker
4. Shows new player name in scoring panel

### Player Substitution Best Practices

- Keep field adjustments minimal during an over
- Make substitutions **between overs** when possible
- Note any injuries or tactical changes for the summary
- Verify new player is actually available (not already playing)

---

## Undo Functionality

### When to Use Undo

Use "Undo Last Ball" when:
- **Scoring mistake:** Entered wrong runs/wicket
- **Input error:** Clicked wrong button
- **System issue:** Unexpected state change

### How Undo Works

1. Click **"Undo Last Ball"** button (appears in scoring panel)
2. Last ball is **completely reversed**:
   - Runs removed
   - Any wicket restored
   - Striker/non-striker positions corrected
   - Bowler restored to pre-ball state

3. Ball counter decrements
4. Continue scoring as normal

### Undo Behavior with Complex Plays

**Odd Runs (1, 3):**
- Striker and non-striker are swapped on delivery
- Undo restores both to original positions ✓

**End of Over:**
- Striker automatically swaps to face new bowler
- Undo restores original striker ✓

**Wicket:**
- Out batter restored to batting lineup
- Previous batter returns to crease
- Undo restores all player positions ✓

**Multiple Undos:**
- Can undo multiple balls in sequence
- Each undo goes back one ball
- Verify match state after each undo

### Important Notes

- **Undo only works for balls bowled** (not during innings break setup)
- **Undo in summary:** Not possible; go back to live scoring if needed
- **Undo at match end:** Available for 1 ball after match ends
- **Real-time sync:** Undo updates appear on all viewers' screens

---

## Ending a Match

### Automatic Match End

CricLive automatically ends the match when:
- **Batting team:** All 10 wickets lost (only 1 player remaining)
- **Bowling team:** All overs bowled (against team batting first)
- **Chasing team:** Required runs scored in final over

### Manual End (If Match Stops)

1. Scoring panel shows **"Match Ended"** screen
2. Review final scores for both teams
3. Click **"View Summary"** to finalize match record
4. Or click **"Undo Last Ball"** to resume if stopped early

### Post-Match

Once match ends:
- **Live scoring disabled** (cannot add more runs)
- **Summary view** shows match statistics
- **Undo available for last ball** only (in case of finalization error)
- Match stored in database for records

---

## Viewing Summary

### Summary Report Contents

After match ends, summary shows:

**Match Information:**
- Teams, overs, toss details
- Venue/date information (if available)

**Final Scores:**
- Team A total runs, wickets lost, overs faced
- Team B total runs, wickets lost, overs faced
- **Result** (Winner, margin of victory)

**Batting Statistics:**
- Top scorers
- Strike rate, balls faced
- How each batter got out

**Bowling Statistics:**
- Bowlers' figures (overs, runs, wickets)
- Economy rate
- Best bowling performance

**Key Moments:**
- Partnership highlights
- Critical wickets
- Momentum shifts

### Downloading/Sharing Summary

1. **Generate PDF:** Use browser "Print to PDF" (Ctrl+P, then Print > PDF)
2. **Share Link:** Summary auto-saves with unique match ID
3. **Export:** Manual copy of statistics for records

---

## Troubleshooting

### Common Issues

#### Ball counter not advancing
- **Check:** Is current ball status complete (runs/out recorded)?
- **Fix:** Click run button or Out; advancement is automatic
- **Verify:** Refresh page; changes sync from server

#### Striker/non-striker showing same player
- **Issue:** Rare race condition in state sync
- **Fix:** Click "Undo Last Ball"; state will reset
- **Report:** Note time/match if recurring

#### Bowler not rotating
- **Check:** Have 6 balls been bowled? (Rotation happens at over end)
- **Fix:** Complete the over; bowler will rotate on 7th ball
- **Verify:** Check ball counter shows 0-of-next-over

#### Match not ending when it should
- **Check:** Are all 10 wickets actually down? (11 players - 1 batter = 10 out)
- **Fix:** Use "Undo" to correct any scoring errors
- **Manual:** Contact support if system error suspected

#### Undo not working
- **Check:** Is match already finalized? (Cannot undo in summary view)
- **Fix:** Go back to live match screen before undoing
- **Verify:** Browser was not accidentally refreshed (loses state)

#### Multiple devices showing different scores
- **Issue:** Socket.io connection delayed or stale
- **Fix:** Refresh page (Ctrl+R); data syncs from server
- **Prevent:** Keep only one admin account active per match

### Getting Help

**For technical issues:**
1. Note the **match ID** and **time of issue**
2. Screenshot showing the problem state
3. Contact: [Support Email]

**For feature requests:**
- Use GitHub Issues: https://github.com/adhokshjavali2005/AWL_Crick_Score

**Known Limitations:**
- No offline support (requires internet connection)
- Favicon may need hard refresh (Ctrl+Shift+R) to update
- Very large matches (90+ overs) not tested; use 50-over limit

---

## Quick Reference

### Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Record 1 Run | Click "1" button |
| Record 4 Runs | Click "4" button |
| Record 6 Runs | Click "6" button |
| Record Wicket | Click "Out" button |
| Undo Last Ball | Click "Undo" button |
| Refresh Page | Ctrl+R (to sync changes) |

### Button Reference

| Button | Function |
|--------|----------|
| 0, 1, 2, 3, 4, 6 | Record runs |
| Out | Record dismissal |
| Undo Last Ball | Reverse last delivery |
| View Summary | Go to match summary |

### Match States

| State | Meaning | Action Allowed |
|-------|---------|---|
| **Setup** | Selecting teams | Edit selections |
| **Live** | Match in progress | Record deliveries |
| **Innings Break** | First innings ended | Start 2nd innings |
| **Ended** | Match complete | View summary, undo last ball |
| **Summary** | Final statistics | View details only |

---

## Support & Feedback

**Application:** CricLive - Live Cricket Score Monitor  
**Version:** 1.0  
**Build Date:** March 3, 2026  
**Repository:** https://github.com/adhokshjavali2005/AWL_Crick_Score

For questions or feedback, please refer to SESSION_HANDOVER.md in the repository root.

---

**Last Updated:** March 3, 2026  
**Next Review:** Quarterly or upon feature release
