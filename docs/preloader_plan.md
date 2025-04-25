# Plan: Visual Preloader with Progress Indicator

**Goal:** Implement a visual loading screen with a progress bar that displays while game assets are loaded between levels. This enhances user experience by providing feedback during potentially long loading times.

**Implementation Steps:**

1.  **Modify `AssetLoader` (`src/utils/assetLoader.ts`):**
    *   **Add Progress Callback:** Update level-specific loading functions (`loadLevel2Assets`, `loadLevel3Assets`, potentially `loadBasicAssets` and `loadFloraAssets` if needed for initial load) to accept an optional `onProgress` callback argument: `onProgress?: (loaded: number, total: number) => void`.
    *   **Track Progress:**
        *   Determine the total number of assets (promises) being loaded for the function.
        *   Maintain a counter for successfully loaded assets.
        *   Iterate through individual asset loading promises. As each promise resolves, increment the loaded counter and invoke `onProgress(loaded, total)`.
        *   Ensure `onProgress(total, total)` is called upon completion.

2.  **Modify `useGameState` (`src/hooks/useGameState.ts`):**
    *   **Centralize Loading Logic:** Ensure `selectLevel` is the sole trigger for level-specific asset loading.
    *   **Add State:**
        *   `const [isLoadingAssets, setIsLoadingAssets] = useState(false);`
        *   `const [loadingProgress, setLoadingProgress] = useState(0);` // Percentage (0-100)
    *   **Implement Callback:** Create `handleLoadingProgress(loaded, total)` to calculate percentage and call `setLoadingProgress`.
    *   **Modify `selectLevel`:**
        *   Set `setIsLoadingAssets(true)` and `setLoadingProgress(0)` at the start.
        *   Wrap asset loading calls (`await assetLoader.loadLevelXAssets(...)`) in `try...finally`.
        *   Pass `handleLoadingProgress` to the asset loader calls.
        *   Set `setIsLoadingAssets(false)` in the `finally` block.
    *   **Return State:** Return `isLoadingAssets` and `loadingProgress` from the hook.

3.  **Refactor `MusicReactiveOceanGame.tsx`:**
    *   **Remove Redundant Loading:** Eliminate `useEffect` hooks and `startGame` logic that duplicates asset loading handled by `useGameState.selectLevel`.
    *   **Remove Local State:** Remove local `isLoading`, `levelXAssetsLoaded` state variables.
    *   **Consume Central State:** Get `isLoadingAssets` and `loadingProgress` from the `useGameState()` hook.

4.  **Create UI Component (`src/components/GameUI/LoadingScreen.tsx`):**
    *   Create the new file `src/components/GameUI/LoadingScreen.tsx`.
    *   Define props: `interface LoadingScreenProps { progress: number; }`.
    *   Implement a component rendering a full-screen overlay.
    *   Display the progress visually (e.g., text `Loading... {props.progress}%` and/or a progress bar element styled with CSS).

5.  **Conditional Rendering (`MusicReactiveOceanGame.tsx`):**
    *   Import `LoadingScreen`.
    *   In the main component's JSX, add conditional rendering: `{isLoadingAssets && <LoadingScreen progress={loadingProgress} />}`.

**Sequence Diagram:**

```mermaid
sequenceDiagram
    participant User
    participant GameUI (MusicReactiveOceanGame)
    participant useGameState
    participant AssetLoader
    participant LoadingScreen

    User->>GameUI: Selects Level (e.g., Level 2)
    GameUI->>useGameState: Calls selectLevel(level2)
    useGameState->>useGameState: Sets isLoadingAssets=true, loadingProgress=0
    useGameState-->>GameUI: State update (isLoadingAssets=true, progress=0)
    GameUI->>LoadingScreen: Renders LoadingScreen(progress=0)
    useGameState->>AssetLoader: Calls loadLevel2Assets(handleLoadingProgress)
    loop Loading Assets
        AssetLoader->>AssetLoader: Loads asset N
        AssetLoader->>useGameState: Calls handleLoadingProgress(N, Total)
        useGameState->>useGameState: Updates loadingProgress state
        useGameState-->>GameUI: State update (progress=X%)
        GameUI->>LoadingScreen: Updates LoadingScreen(progress=X%)
    end
    AssetLoader-->>useGameState: All assets loaded
    useGameState->>useGameState: Sets isLoadingAssets=false
    useGameState-->>GameUI: State update (isLoadingAssets=false)
    GameUI->>LoadingScreen: Hides LoadingScreen component
    User->>GameUI: Clicks Start Game
    GameUI->>useGameState: Calls startGame()
    useGameState->>useGameState: Starts audio & game loop
```

**Next Steps:**

*   Implement the changes outlined above.
*   Conduct the general performance audit after the preloader is functional.