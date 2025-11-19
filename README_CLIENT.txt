# Slot Game Project

## New
## The new modifications in integrated-server.js are as follows:
- The structure of the gamecfg message has been modified to resolve the data hierarchy issue.
- A new "gold" field has been added to the collectinfo message, which is used to indicate the player's latest balance after server settlement.

## The project has been modified based on the multiplayer mode, with the automatic Spin function removed.
## If you need to add it back or make other modifications, please let me know.

## Project Updates & Structure Adjustments
- The multiplayer mode function has been added; please refer to the "multiplayer" branch in the git repository.
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