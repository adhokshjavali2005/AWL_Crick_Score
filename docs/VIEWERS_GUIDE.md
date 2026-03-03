# CricLive - Viewer's Guide

**Version:** 1.0  
**Date:** March 3, 2026  
**Application:** CricLive - Live Cricket Score Monitor

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Accessing Live Matches](#accessing-live-matches)
3. [Understanding the Scorecard](#understanding-the-scorecard)
4. [Live Score Updates](#live-score-updates)
5. [Viewing Match Details](#viewing-match-details)
6. [Navigating the Interface](#navigating-the-interface)
7. [Viewing Team Statistics](#viewing-team-statistics)
8. [Match Summary](#match-summary)
9. [Browser Requirements](#browser-requirements)
10. [Troubleshooting](#troubleshooting)

---

## Getting Started

### What is CricLive?

CricLive is a **real-time cricket scoring application** that provides:
- **Live ball-by-ball updates** as matches progress
- **Detailed player statistics** for batters and bowlers
- **Current match state** (score, wickets, overs)
- **Instant notifications** when scores change
- **Match summary** after the game ends

### Accessing CricLive

1. Open your web browser (Chrome, Firefox, Safari, Edge)
2. Navigate to: **https://criclive-sigma.vercel.app**
3. You will see the **landing page** with available matches
4. Click on any match to start viewing

---

## Accessing Live Matches

### Landing Page

The landing page displays:

**Active/Upcoming Matches:**
- Team names (e.g., "Mumbai vs Delhi")
- Current status (Match ID, date)
- Match format (T20, ODI, etc.)
- Quick statistics

**Search Functionality:**
- Search by team name
- Filter by recent matches
- Sort options (date, live first)

### Selecting a Match

1. Browse the match list
2. Click on the team names or match card
3. You will enter the **live scoreboard view**
4. Score updates appear **automatically** (no refresh needed)

### Match Status Icons

| Icon/Status | Meaning |
|-------------|---------|
| 🔴 **LIVE** | Match in progress, live updates |
| ⏸️ **PAUSED** | Innings break between 1st & 2nd innings |
| ✅ **ENDED** | Match complete, view summary |

---

## Understanding the Scorecard

### Main Scorecard Display

The primary scorecard shows:

```
┌─────────────────────────────────────┐
│   TEAM A vs TEAM B                  │
│   Live Score - Over 12.3            │
├─────────────────────────────────────┤
│   TEAM A:  145/6 (12 overs)         │
│   TEAM B:  On Batting...            │
├─────────────────────────────────────┤
│   Latest Scores: 4 runs             │
│   Bowler: Jasprit Bumrah            │
│   Striker: Virat Kohli              │
│   Non-Striker: Suryakumar Yadav     │
└─────────────────────────────────────┘
```

### Score Components

**Score Display:** `145/6`
- **145** = Total runs scored
- **6** = Wickets lost (6 players out of 11)

**Over Display:** `12.3`
- **12** = Complete overs bowled
- **3** = Balls in current over (0-5 balls)
- Format: One over = 6 balls

**Extras Information:**
- Runs from wides, no-balls, byes, leg-byes
- Shown separately in detailed scorecard

### Current Match State

**On Batting:**
- **Striker** (▶️ symbol) - Currently facing the bowler
- **Non-Striker** - Waiting to bat
- **Bowler** (current thrower from opposing team)

**Just Completed:**
- **Latest runs** from last delivery
- **Wicket info** if a player got out
- **Bowler figures** (runs conceded, wickets)

---

## Live Score Updates

### How Updates Work

- **Real-time sync** via WebSocket (instant)
- **Automatic refresh** if connection drops
- **No manual refresh needed** - page updates automatically

### What Updates in Real-Time

✅ **Updates instantly:**
- Runs scored (1, 2, 4, 6 runs)
- Wickets falling
- Over count advancing
- Striker/non-striker changes
- Bowler changes
- Current run rate

### Reading Live Events

**Delivery Sequence Example:**

```
Ball 1: Bumrah → Kohli → 1 run (Kohli, Yadav swap positions)
Ball 2: Bumrah → Yadav → 4 runs (boundary)
Ball 3: Bumrah → Yadav → OUT (Yadav caught, new batter in)
Ball 4: Bumrah → Sharma → 2 runs
Ball 5: Bumrah → Sharma → Wide (no advancement of over count)
Ball 6: Bumrah → Sharma → No Ball (still ball 5)
Ball 6 (retry): Bumrah → Sharma → 0 runs (over end, bowler rotates)
```

### Commentary Section

**Available Information:**
- Ball-by-ball description
- Runs awarded
- Type of dismissal (if out)
- Extras recorded

**Visual Indicators:**
- ✓ Green bar = Runs scored
- ✗ Red icon = Wicket
- ⭐ Extra = Wide/No-ball bonus

---

## Viewing Match Details

### Batting Statistics

Click on **"Batting"** tab to see:

| Column | Meaning |
|--------|---------|
| **Batter Name** | Player name |
| **Status** | Out/Not Out |
| **Runs** | Total runs scored |
| **Balls** | Deliveries faced |
| **Strike Rate** | Runs per 100 balls |
| **Fours** | Boundaries hit |
| **Sixes** | Maximum hits |
| **How Out** | Dismissal type |

### Bowling Statistics

Click on **"Bowling"** tab to see:

| Column | Meaning |
|--------|---------|
| **Bowler Name** | Player name |
| **Overs** | Overs completed |
| **Runs** | Runs conceded |
| **Wickets** | Dismissals |
| **Economy** | Runs per over |
| **Maiden Overs** | Overs with 0 runs |

### Partnerships

**Partnership Info** shows:
- Current batter partnership runs
- Balls faced together
- Key contributors in stand
- Whether partnership is active or broken

### Key Moments

Recent events:
- Last 5 wickets (who, how, bowler)
- Last 5 boundaries (who, runs)
- Score milestones reached
- Momentum shifts

---

## Navigating the Interface

### Main Navigation

**Top Bar:**
- **CricLive Logo** - Go to home/match list
- **Match Selector** - Jump to different matches (if multiple)
- **Search** - Find team or player
- **Refresh** - Manual sync (rarely needed)

**Score Sections:**
- **Scorecard** - Current match state (default view)
- **Batting Stats** - Individual batter details
- **Bowling Stats** - Individual bowler details
- **Commentary** - Ball-by-ball narrative
- **Summary** - After match ends

### Responsive Design

**On Mobile/Tablet:**
- Vertical layout optimized for small screens
- Tap/swipe to change sections
- Score updates visible at all times

**On Desktop:**
- Horizontal layout with columns
- Wider scorecard view
- Side panels for statistics

### Switching Views

1. **Live/Current**: Shows active match state
2. **Statistics**: Always available during match
3. **Summary**: Only after match ends
4. **Archive**: View past matches (if feature enabled)

---

## Viewing Team Statistics

### Team Summary During Match

**Batting Team:**
- Total runs
- Wickets down
- Overs completed/remaining
- Run rate (runs per over)
- Projected total (if match ended now)

**Bowling Team:**
- Runs conceded
- Wickets taken
- Overs bowled
- Economy rate
- Least runs conceded

### Comparing Teams

**Quick Comparison Card:**
- Team A runs vs Team B runs
- Wickets down (both teams)
- Fastest bowler (most recent)
- Top scorer (current match)

### Head-to-Head Information

(If available in summary):
- Historical match records
- Win/loss record
- Top scorer in rivalry
- Best bowler in rivalry

---

## Match Summary

### When is Summary Available?

- **During live match**: Not available (match in progress)
- **After match ends**: Automatically generated
- **Final view**: Once winner confirmed

### What Summary Contains

**Final Scores:**
```
TEAM A: 165/7 (20 overs)
TEAM B: 168/5 (19.2 overs)
TEAM B won by 5 wickets (margin) in 19.2 overs
```

**Top Performers:**
- Highest run scorer
- Wicket taker (most)
- Best economy bowler
- Most boundaries hit

**Match Statistics:**
- Total runs
- Total wickets
- Extras given
- Maiden overs bowled
- Powerplay dynamics

**Detailed Match Report**
- Full scorecard (all players)
- Partnerships (key stands)
- Critical moments
- Umpire decisions (if recorded)

### Sharing Summary

**Download PDF:**
1. Click "Download Summary" button
2. Select "Print" → "Save as PDF"
3. File saved to downloads folder

**Share Link:**
1. Copy browser URL
2. Share with friends via email/messaging
3. Others can view same match summary

**Social Media:**
(If enabled)
- Tweet match highlights
- Share to social networks
- Embed in website

---

## Browser Requirements

### Supported Browsers

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | 90+ | ✅ Full support |
| Firefox | 88+ | ✅ Full support |
| Safari | 14+ | ✅ Full support |
| Edge | 90+ | ✅ Full support |
| Opera | 76+ | ✅ Full support |

### System Requirements

- **Internet Connection:** Required (no offline mode)
- **JavaScript:** Must be enabled
- **Cookies:** Enabled (for session storage)
- **Screen Size:** 320px+ width (mobile-responsive)

### Browser Settings

**Enable Notifications (Optional):**
1. Allow notifications when prompted
2. Receive alerts when wickets fall
3. Get score update badges

**Disable Blockers (If updates stop):**
- Disable ad blockers (may block WebSocket)
- Disable tracking prevention temporarily
- Allow cookies from criclive-sigma.vercel.app

---

## Troubleshooting

### Common Issues

#### Scores not updating
- **Check:** Is your internet connection active?
- **Check:** Is the match actually live (not paused/ended)?
- **Fix:** Refresh page (Ctrl+R or Cmd+R)
- **Wait:** May be 1-2 second delay on updates
- **Restart:** Close browser tab and reopen

#### Page shows old/stale scores
- **Quick Fix:** Click "Refresh" button on scorecard
- **Browser Cache:** Hard refresh (Ctrl+Shift+R on Windows, Cmd+Shift+R on Mac)
- **Clear Cache:** Browser menu → Settings → Clear Cache

#### Players names not showing
- **Reason:** Data still loading
- **Wait:** Page takes 2-3 seconds to fully load
- **If persists:** Refresh page

#### Can't find a specific match
- **Check:** Match might be finished/archived
- **Search:** Use search box to locate match
- **Browse:** Scroll through match list
- **Try:** Check match date is within current filter range

#### Statistics seem incorrect
- **Check:** Are you looking at the right team?
- **Verify:** Over count (decimal shows balls in over)
- **Refresh:** Page may show cached version
- **Note:** Undo on admin end may change stats

#### Multiple browser tabs showing different scores
- **Issue:** Tab not synced with live updates
- **Fix:** Refresh tab (Ctrl+R)
- **Prevent:** Use only one tab per match
- **Note:** Closes automatically after 5 minutes of inactivity

### Getting Help

**Technical Support:**
1. Note the team names and current score
2. Screenshot showing the issue
3. Check browser console for errors (F12 → Console tab)
4. Clear browser cache and try again

**Feature Requests:**
- GitHub Issues: https://github.com/adhokshjavali2005/AWL_Crick_Score

**Known Limitations:**
- No offline viewing (live sync requires internet)
- Mobile app not available (web-only)
- Historical matches limited (check date filters)
- Some international browsers may have delays

---

## Quick Reference

### Score Notation

| Notation | Meaning |
|----------|---------|
| **145/6** | 145 runs, 6 wickets down |
| **12.3** | 12 overs, 3 balls |
| **SR: 145.23** | Strike rate: 145.23 runs/100 balls |
| **ER: 8.50** | Economy: 8.50 runs/over |

### Dismissal Types

| Type | Meaning |
|------|---------|
| **Caught** | Fielder caught the ball |
| **Bowled** | Bowler broke the stumps |
| **LBW** | Leg Before Wicket |
| **Run Out** | Failed to reach crease |
| **Stumped** | Batter out of crease to stumping |
| **NOT OUT** | Batter still batting |

### Common abbreviations

- **LOI:** Limited Overs International
- **T20:** 20-over format
- **ODI:** One Day International (50 overs)
- **Maiden:** Over with 0 runs
- **Dot Ball:** Delivery with 0 runs

---

## Features Summary

✅ **What You Can Do:**
- View live match scores in real-time
- See detailed player statistics
- Watch ball-by-ball commentary
- View final match summary
- Download/share match reports
- Access match history

❌ **What You Cannot Do (Viewers):**
- Edit scores or match details
- Start/end matches
- Undo deliveries
- Change player assignments
- Access admin features

---

## Support & Feedback

**Application:** CricLive - Live Cricket Score Monitor  
**Version:** 1.0  
**Build Date:** March 3, 2026  
**Repository:** https://github.com/adhokshjavali2005/AWL_Crick_Score

If you have questions about how the app works or find any issues, please refer to the technical documentation in the repository.

---

**Last Updated:** March 3, 2026  
**Next Review:** Quarterly or upon feature release

---

## Enjoy Watching CricLive! 🏏
