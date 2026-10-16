# Bami & Oluwatosin ❤️ — Online Couples Games

Mobile-first Firebase + Vercel couples games with live two-player rooms.

## Games
- **Naija WHOT:** 54-card Nigerian deck: 12 Circle cards, 12 Triangle cards, 9 Cross cards, 9 Square cards, 7 Star cards and five WHOT 20 wild cards. It supports shape/number matching, calling a shape with WHOT 20, Hold On (1), Pick Two (2), Pick Three (5), Suspension (8), and General Market (14). Pick Two and Pick Three can be defended and stacked.
- **Classic four-colour Ludo board:** 52 unique outer-track spaces, four tokens per player, six to leave the yard, safe squares, captures, coloured home lanes, and exact roll to finish. Red and blue are playable in this two-player version; green and yellow are displayed as part of the classic four-colour board.
- Tic-Tac-Toe
- Couples Quiz
- Truth or Dare

Naija WHOT and Ludo have house-rule variations. This site implements the specific rules shown in the game UI.

## Firebase setup
1. Configure \`firebase-config.js\` with your Firebase web app settings.
2. Create a Firestore database.
3. Publish the rules from \`firestore.rules\`.

**Security note:** the prototype rules permit any signed-in user who knows a six-character room code to read/write that room. Add strict player-membership and state validation before public launch.

## Deploy
Import this repository into Vercel using the Other preset, with no build command or output directory. Pushes to the connected branch trigger deployments automatically, or deploy manually in Vercel.

## Play
Create a room, share its six-character code, and have your partner join from another device. Game state and game selection sync through Firestore.
