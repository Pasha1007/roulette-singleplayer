# Slot Game Project

## Project Updates & Structure Adjustments
- Added multiplayer mode functionality.
- Partially reorganized the previous project structure (limited to the PixiJS component).


## Overall Architecture
The project consists of two core components:
1. **PixiJS Client**: Responsible for game rendering, core logic execution, and UI presentation.
2. **Framework UI**: Manages all server interaction processes.


## Key Files & Interfaces (PixiJS Client)
- `roommgr.js` - Contains interfaces related to data interaction and roulette performance.

- Core workflow logic is implemented in the following interfaces:
  - `spinBtnAction`
  - `onGameModuleInfo`
  - `wheelEffectStart`
  - `playResultVideo`
  - `wheelEffectDone`