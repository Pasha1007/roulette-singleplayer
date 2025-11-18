# Slot Game Project

## Project Structure

1. `roulettetable.js` - Handles game root node initialization and resource loading.

2. `gamedefine.js` - Configures the roulette and whether the current UI is used for winning displays, facilitating replacement of roulette and winning effects.

3. `mainboard.js` - Manages UI and logic related to the game's main interface.

4. `gamestate.js` - Handles server interaction interfaces and maintains partial game data.

5. `tablerect.js` - Processes user input interactions.


## Newly Added

`roommgr.js`

To facilitate further modifications to the project, `roommgr.js` reorganizes the previous project structure and centralizes modifiable logic within itself as much as possible.


### Data-related Interfaces in `roommgr`

- `onCrashInfo`  
  A timed message sent by the server, each containing a countdown to the next draw. This message is received periodically regardless of whether the player has placed a bet.  
  When `actinID` is `prepareToPlay`, it indicates a server draw message containing the winning number (but not the player's winnings).

- `onGameModuleInfo`  
  A result message received in the following four scenarios:  
  - Upon login (if the player refreshes the page during the draw-settlement period, re-login will include previous winning data).  
  - After the player sends a bet to the server.  
  - After the player cancels a bet with the server.  
  - After a successful bet and server draw (includes winning number and player's winnings).  


### Presentation-related Interfaces in `roommgr`

- `wheelEffectStart`  
  Triggers the roulette animation. Currently triggered during `prepareToPlay`, but can be moved to the `gamemoduleinfo` result message if game design roulette effects  not display when the player hasn't placed a bet.

- `wheelEffectDone`  
  Called when the roulette animation ends, typically invoked by the roulette display upon completion.