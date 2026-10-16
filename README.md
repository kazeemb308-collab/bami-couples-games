# Bami & Oluwatosin ❤️ — Online Couples Games

A mobile-first Firebase + Vercel couples games site with live two-player rooms.

## Games
- **WHOT!**: 65-card deck, six cards each, five shapes plus WHOT cards, shape calling, matching by shape or number, and special-card effects (1 Hold On, 2 Pick Two, 5 WHOT, 8 Suspension, 14 General Market).
- **Two-player Ludo**: four tokens per player, six to leave the yard, safe squares, captures, home lane, exact finish, and extra turns for a six, capture, or finishing a token.
- Tic-Tac-Toe
- Couples Quiz
- Truth or Dare

WHOT house rules vary. The implemented special-card behavior is shown in the game screen. Ludo is a two-player adaptation; it uses the classic 52-square outer track and a shared home lane for each player.

## Firebase setup
1. Set up a Firebase web app and put its settings in \`firebase-config.js\`.
2. Create a Firestore database.
3. Publish the rules from \`firestore.rules\`.

**Security note:** the prototype rules permit any signed-in user who knows a six-character room code to read/write that room. Add strict player membership and state validation before a public launch. Do not store sensitive information in room documents.

## Deploy
Import this repository into Vercel using the **Other** preset, with no build command or output directory. Pushes to the connected branch trigger deployments automatically, or deploy manually in Vercel.

## Play
Create a room, share its six-character code, and have your partner join from another device. Game state and game selection sync through Firestore.
