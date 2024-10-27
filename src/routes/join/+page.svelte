<script>
    import QrCodeScanner from './QrCodeScanner.svelte';
    import { joinGame, gameState, connection } from '../../lib/gamestate.svelte';
    import { onMount } from 'svelte';
    import PlayerCountDisplay from '../../lib/PlayerCountDisplay.svelte';
    import LocationsList from '../../lib/LocationsList.svelte';
    import { goto } from '$app/navigation';
    import { navigating } from '$app/stores';

    let gameId = $state();
    let isMounted = $state(false);

    onMount(() => {
        loadGameId();
        isMounted = true;
    });

    $effect(() => {
        if ($navigating) loadGameId();
    });

    function loadGameId() {
        if (!gameId) {
            gameId = new URLSearchParams(location.search).get('id') || null;
            if (gameId) joinGame(gameId);
        }
    }
</script>

<article>
    {#if isMounted && !gameId}
        <section>
            <QrCodeScanner />
        </section>
        <section>
            <a href="./" class="btn">Zurück</a>
        </section>
    {:else if isMounted && gameState.playerCount}
        {#if gameState.locations}
            <section>
                <header>Mögliche Orte</header>
                <div style="margin: 1rem;">
                    <LocationsList locations={gameState.locations} />
                </div>
            </section>
        {/if}
        <section>
            <header>
                Spielregeln

                <a style="float: right; color:#ccc" target="_blank" rel="noopener noreferrer" href="https://spielewiki.org/wiki/Spyfall"> Anleitung</a>
            </header>
            <ol style="padding-left:1rem">
                <li>Ihr befindet euch alle am selben Ort</li>
                <li>Der Spion unter euch kennt ihn nicht</li>
                <li>Stellt Fragen um den Spion zu enttarnen, ohne den Ort zu verraten</li>
                <li>Wer befragt wurde, muss eine andere Person befragen</li>
                <li>Du hast erraten wer der Spion ist? Drücke <span style="text-transform: uppercase;">Stop</span> zum Abstimmen!</li>
                <li>Du bist der Spion und hast den Ort erraten? Drücke <span style="text-transform: uppercase;">Stop</span>!</li>
            </ol>
        </section>
        <section>
            <PlayerCountDisplay />
            <div style="text-align: center; color: #aaa">Nur wer das Spiel erstellt hat, kann es auch starten.</div>
        </section>
        <section style="display: flex; justify-content: center;">
            <button
                type="button"
                class="btn red"
                onclick={() => {
                    gameState.gameId = undefined;
                    connection.disconnect();
                    goto('./');
                }}
            >
                Spiel verlassen
            </button>
        </section>
    {:else}
        <section>Verbinde ...</section>

        <section style="display: flex; justify-content: center;">
            <a href="./" class="btn">Zurück</a>
        </section>
    {/if}
</article>
