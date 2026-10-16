# Bami & Oluwatosin ❤️ — Online Couples Games

A mobile-first Firebase + Vercel starter for playing together online.

## Games included
- Private six-character room codes with a two-player limit
- Live room and game-state sync with Firestore
- Tic-Tac-Toe
- WHOT-inspired matching-card game
- Simplified two-player Ludo race (one token each, not full official Ludo)
- Couples Quiz
- Truth or Dare

## 1. Configure Firebase
1. Visit https://console.firebase.google.com/ and create a project.
2. Add a Web app in Project settings.
3. Copy its config into `firebase-config.js`, replacing all `PASTE_...` placeholders.
4. Create a Firestore database.
5. Publish the rules from `firestore.rules`.

**Security note:** these starter rules allow anyone who knows a six-character room code to read and write that room. Add Firebase Authentication and strict player-membership checks before promoting this publicly. Do not store sensitive information in rooms.

## 2. Deploy on Vercel
1. Visit https://vercel.com/new and import this GitHub repository.
2. Choose the **Other** framework preset.
3. Leave the build command and output directory empty.
4. Deploy, then open your `.vercel.app` link on both phones.

## 3. Play
One player creates a room and shares the six-character code. The other player enters their name and code, then joins. Both players choose the same game.

## Limitations
This is a starter prototype. WHOT and Ludo rules are simplified and need testing on two devices. Room codes are not authentication.
