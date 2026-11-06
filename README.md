# Calculator Game
Calculator Game is a game where you need to find an expression that equals a given
target number by placing operations ('+', '-', '*', '/'), numbers and, optionally,
parentheses. The gameplay loosely resembles the arithmetic tasks in the show Countdown.
The game has two difficulty levels: Normal and Hard. On Normal level, you are given
the numbers already in the correct order and the target result. Your task is to 
correctly place the operations and, if necessary, parentheses. On Hard level, you also
have to arrange the numbers in the correct order. The game is a web app that can be 
turned into a native Windows / Linux application with Electron. The game was initially
vibe coded and then modified manually.

# Requirements
* Node.js (version >= 24)
* Docker on Linux (if you want to build the Electron app)

# Installation
```bash
npm install
```

# Building
Building the Web app:
```bash
npm run build 
# output files in the dist directory
```
Building Linux binaries on Linux (You can also use the following command to build 
Windows binaries on Windows if you allow the system user to create symbolic links):
```bash
npm run electron:build
# binaries in the release directory
```
Building Windows binaries on Linux:
```bash
sh ./electron-build-win.sh
# binaries in the release directory
```

# Launching
Launching the Web app:
```bash
npm run dev
# by default the app runs on port 5173
``` 

