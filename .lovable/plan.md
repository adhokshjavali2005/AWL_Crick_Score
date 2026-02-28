

## Plan: Add "Change Batsman/Bowler" Options to ScoreBoard

### What changes
Add inline dropdown selectors next to the Striker, Non-Striker, and Bowler rows in the Players section of `ScoreBoard.tsx`. These controls will only be visible to admin users, allowing them to quickly swap players mid-match without navigating to the Admin Panel.

### Changes Required

**1. `src/components/ScoreBoard.tsx`**
- Import `useAuth` from AuthContext, `useState` from React, and `Select` components from `@/components/ui/select`
- Import `setStriker`, `setNonStriker`, `setBowler`, `battingPlayers`, `bowlingPlayers` from `useMatch()`
- For each player row (Striker, Non-Striker, Bowler), add a small "Change" button visible only to admins
- Clicking "Change" opens a Select dropdown listing available players from the correct team (batting players for batsmen, bowling players for bowler)
- Selecting a player calls the corresponding setter (`setStriker`, `setNonStriker`, `setBowler`) and closes the dropdown
- Non-admin users see the player info as before with no change option

### Technical Details

- Use a local `editing` state (`'striker' | 'nonStriker' | 'bowler' | null`) to toggle which row shows the dropdown
- Batting team players populate the Striker/Non-Striker dropdowns; bowling team players populate the Bowler dropdown
- Filter out the other selected player from each dropdown (e.g., the current non-striker won't appear in the striker dropdown)
- Use the existing Radix `Select` component for consistent styling
- The "Change" button will be a small icon button (e.g., a pencil or swap icon from lucide-react)

