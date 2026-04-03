# Feature Backlog

## Update README
Rewrite readme.md with proper project description, screenshots, setup instructions, and tech stack info.

## User Profiles
Add a name entry screen on first launch. Store the chosen name in localStorage. Display the player name on the HUD and game-over screen. Support switching profiles.

## Operation Unlock System
Let players choose which math operations to practice (+, −, ×, ÷). Start with only addition unlocked. Reaching a score threshold on an operation unlocks the next harder one (+ → − → × → ÷). Show lock/unlock state on an operation select screen before starting a game.

## Publish to Windows Store
Package the app as an MSIX using PWABuilder or similar tooling. Create store listing assets (icons, screenshots, description). Submit to the Microsoft Store.

## Publish to Apple App Store
Wrap the app with Capacitor (or PWABuilder) for iOS. Create an Xcode project, configure signing, and generate store listing assets. Submit to the Apple App Store.
