<script>
    import { spring } from 'svelte/motion';
    import { gameState } from './gamestate.svelte';

    const displayed_count = spring(0);

    $effect(() => {
        if (gameState.playerCount > 0) $displayed_count = gameState.playerCount;
    });
</script>

<div style="display: flex; flex-wrap: wrap; justify-content: center; align-items: center;font-size: x-large;">
    Warte auf Mitspielende . . .
    <div class="counter-viewport">
        <div class="counter-digits" style="transform: translate(0, {100 * ($displayed_count % 1)}%)">
            <strong class="hidden" aria-hidden="true">{Math.floor($displayed_count + 1)}</strong>
            <strong>{Math.floor($displayed_count)}</strong>
        </div>
    </div>
    / 3+
</div>

<style>
    .counter-viewport {
        width: 2.25em;
        height: 4em;
        overflow: hidden;
        text-align: center;
        position: relative;
    }

    .counter-viewport strong {
        position: absolute;
        display: flex;
        width: 100%;
        height: 100%;
        font-weight: 400;
        font-size: 3rem;
        align-items: center;
        justify-content: center;
    }

    .counter-digits {
        position: absolute;
        width: 100%;
        height: 100%;
    }

    .hidden {
        top: -100%;
        user-select: none;
    }
</style>
