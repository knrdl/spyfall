<script>
    import QRCode from 'qrcode/lib/browser';
    import { onMount, tick } from 'svelte';
    import CopyToClipboardButton from './CopyToClipboardButton.svelte';
    import { connection, createGame, gameState, startRound } from '../../lib/gamestate.svelte';
    import { retrieveData, storeData } from '../../lib/storage';
    import { fade } from 'svelte/transition';
    import PlayerCountDisplay from '../../lib/PlayerCountDisplay.svelte';
    import { goto } from '$app/navigation';

    let roundMinutes = $state(8);

    const defaultLocations = [
        'Autowerkstatt',
        'Bank',
        'Botschaft',
        'Casino',
        'Dschungel',
        'Filmstudio',
        'Firmenfeier',
        'Flugzeug',
        'Hotel',
        'Iglu',
        'Kathedrale',
        'Krankenhaus',
        'Kreuzfahrtschiff',
        'Militärstützpunkt',
        'Piratenschiff',
        'Pfadfinderheim',
        'Polarstation',
        'Polizeirevier',
        'Raumstation',
        'Restaurant',
        'Ritterburg',
        'Schule',
        'Sommerlager',
        'Strand',
        'Supermarkt',
        'Theater',
        'Therme',
        'U-Boot',
        'Universität',
        'Zirkuszelt',
        'Zoo',
        'Zug',
    ];

    let locations = $state(defaultLocations);
    let newLocation = $state('');

    let qrCodeCanvas = $state();

    const gameUrl = $derived(
        gameState.gameId ? location.origin + location.pathname.replace('/new', '/join') + '?' + new URLSearchParams({ id: gameState.gameId }).toString() : null,
    );

    $effect(() => {
        if (gameUrl)
            tick().then(() => {
                QRCode.toCanvas(qrCodeCanvas, gameUrl, { scale: 8, color: { dark: '#ffffffee', light: '#00000044' } }, (error) => {
                    if (error) console.error(error);
                });
            });
    });

    onMount(() => {
        const savedLocs = retrieveData('locations');
        if (savedLocs) locations = savedLocs;
    });
</script>

{#if !gameUrl}
    <article>
        <section>
            <header>Orte</header>
            <ul>
                {#each locations as location (location)}
                    <li transition:fade style="display: flex; gap: .25rem; align-items: center; justify-content: flex-start;">
                        <div>{location}</div>

                        <button
                            type="button"
                            title="Löschen"
                            style="background-color: brown; border: none; border-radius: 100%;width: 1.25rem;color:white;"
                            onclick={() => {
                                locations.splice(locations.indexOf(location), 1);
                                locations = locations;
                                storeData('locations', locations);
                            }}>&times;</button
                        >
                    </li>
                {/each}
                <li>
                    <form
                        onsubmit={(e) => {
                            e.preventDefault();
                            locations = [...locations, newLocation];
                            locations = locations.sort((a, b) => a.localeCompare(b));
                            newLocation = '';
                            storeData('locations', locations);
                        }}
                        class="inpbtn"
                    >
                        <input type="text" required bind:value={newLocation} placeholder="Neuer Ort" />
                        <button type="submit">+</button>
                    </form>
                </li>
            </ul>
        </section>

        <section>
            <header>Rundenzeit</header>
            <label style="display: flex; flex-wrap:wrap; min-height: 2rem; padding: 0 2rem; justify-content: center; align-items: end">
                <input style="flex-grow: 1;" type="range" min="2" max="14" bind:value={roundMinutes} />
                <output style="margin-left: 1rem;">{roundMinutes} Minuten</output>
            </label>
        </section>

        <section style="display: flex; flex-wrap: wrap; justify-content: center;align-items: center; margin-top: 1rem">
            <button type="button" onclick={() => createGame(roundMinutes, locations)} class="btn blue"> Spiel erstellen </button>
            <a href="./" class="btn red">Abbrechen</a>
        </section>
    </article>
{:else}
    <article>
        <section>
            <div style="display: flex; justify-content: center">
                <canvas bind:this={qrCodeCanvas}></canvas>
            </div>

            <div style="display: flex; justify-content: center;" class="inpbtn">
                <input type="text" readonly value={gameUrl} style="max-width: 30rem; width: 100%" />
                {#if navigator.share}
                    <button type="button" onclick={() => navigator.share({ url: gameUrl })}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" fill="white" style="width: 1rem;">
                            <!--!Font Awesome Free 6.6.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path
                                d="M352 224c53 0 96-43 96-96s-43-96-96-96s-96 43-96 96c0 4 .2 8 .7 11.9l-94.1 47C145.4 170.2 121.9 160 96 160c-53 0-96 43-96 96s43 96 96 96c25.9 0 49.4-10.2 66.6-26.9l94.1 47c-.5 3.9-.7 7.8-.7 11.9c0 53 43 96 96 96s96-43 96-96s-43-96-96-96c-25.9 0-49.4 10.2-66.6 26.9l-94.1-47c.5-3.9 .7-7.8 .7-11.9s-.2-8-.7-11.9l94.1-47C302.6 213.8 326.1 224 352 224z"
                            />
                        </svg>
                        Teilen
                    </button>
                {:else}
                    <CopyToClipboardButton value={gameUrl}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" fill="white" style="width: 1rem;">
                            <!--!Font Awesome Free 6.6.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path
                                d="M208 0L332.1 0c12.7 0 24.9 5.1 33.9 14.1l67.9 67.9c9 9 14.1 21.2 14.1 33.9L448 336c0 26.5-21.5 48-48 48l-192 0c-26.5 0-48-21.5-48-48l0-288c0-26.5 21.5-48 48-48zM48 128l80 0 0 64-64 0 0 256 192 0 0-32 64 0 0 48c0 26.5-21.5 48-48 48L48 512c-26.5 0-48-21.5-48-48L0 176c0-26.5 21.5-48 48-48z"
                            />
                        </svg>
                        Kopieren
                    </CopyToClipboardButton>
                {/if}
            </div>
        </section>

        <section style="margin: 2rem;">
            <PlayerCountDisplay />
        </section>

        <section style="display: flex; justify-content: center; flex-wrap: wrap">
            <button
                type="button"
                class="btn blue"
                onclick={async () => {
                    if (gameState.playerCount >= 3) {
                        await startRound();
                    } else alert('Es werden mindestens 3 Mitspielende benötigt');
                }}
            >
                Spiel starten
            </button>
            <button
                type="button"
                class="btn red"
                onclick={() => {
                    gameState.gameId = undefined;
                    connection.disconnect()
                    goto('./');
                }}
            >
                abbrechen
            </button>
        </section>
    </article>
{/if}

<style>
    ul {
        display: flex;
        flex-wrap: wrap;
        list-style: none;
        padding: 1rem;
        gap: 1rem;
        justify-content: flex-start;
    }

    ul > li {
        min-width: 10rem;
    }
</style>
