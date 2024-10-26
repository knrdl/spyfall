<script>
    import { onMount } from 'svelte';
    import { gameState } from '../../lib/peering.svelte';
    import LocationsList from '../../lib/LocationsList.svelte';
    import { fade } from 'svelte/transition';
    import Loader from '../../lib/Loader.svelte';
    import VoteButton from '../../lib/VoteButton.svelte';

    let intervalHandle;
    let secondsLeft = $state();

    let isYourVote = $derived(
        gameState.currentVoteBy !== null &&
            ((gameState.role === 'leader' && gameState.currentVoteBy === gameState.gameId) ||
                (gameState.role === 'follower' && gameState.currentVoteBy === gameState.connection.peerId)),
    );
    let canVote = $derived(
        (gameState.role === 'leader' && !gameState.voteInitiators.includes(null)) ||
            (gameState.role === 'follower' && !gameState.voteInitiators.includes(gameState.connection.peerId)),
    );

    function updateTimeLeft() {
        secondsLeft = gameState.roundMinutes * 60 - Math.floor((new Date().getTime() - gameState.startEpoch) / 1000);
        if (secondsLeft <= 0) {
            secondsLeft = 0;
            clearInterval(intervalHandle);
        }
    }

    function fmtTimeLeft(secondsLeft) {
        return `${Math.floor(secondsLeft / 60).toLocaleString(undefined, { minimumIntegerDigits: 2 })}:${(secondsLeft % 60).toLocaleString(undefined, { minimumIntegerDigits: 2 })}`;
    }

    onMount(() => {
        intervalHandle = setInterval(() => updateTimeLeft(), 1000);
        updateTimeLeft();
    });

    function requestVote() {
        if (canVote) gameState.connection.requestVote();
        else alert('Du darfst nur einmal pro Runde abstimmen lassen!');
    }

    function respondVote(accept) {
        gameState.connection.respondVote(accept);
    }
</script>

<article>
    <section class="playtime">
        <output class:blink={secondsLeft < 30}>{fmtTimeLeft(secondsLeft)}</output>
        <progress value={secondsLeft} min="0" max={gameState.roundMinutes * 60} title={fmtTimeLeft(secondsLeft)}></progress>
    </section>

    <section>
        <details open>
            <summary>Ort</summary>
            <LocationsList locations={gameState.locations} selectedLocation={gameState.location} />
        </details>
    </section>

    <section style="display: flex; flex-wrap: wrap; justify-content: center;">
        {#if !gameState.currentVoteBy}
            {#if canVote}
                <button type="button" aria-label="Stopp" class="stop" onclick={requestVote} in:fade>
                    <svg xmlns="http://www.w3.org/2000/svg" style="width: 10rem;height:10rem;" viewBox="0 0 122.88 122.88">
                        <polygon
                            fill-rule="evenodd"
                            fill="#fff"
                            points="100.64 22.24 84.39 5.99 38.47 6 5.99 38.49 6 84.41 38.49 116.89 84.41 116.88 116.89 84.39 116.88 38.47 100.64 22.24 100.64 22.24"
                        />
                        <path
                            fill-rule="evenodd"
                            fill="#d92d27"
                            d="M82,11.82,96.52,26.35l14.53,14.53V82L96.53,96.52,82,111.05H40.9L26.36,96.53,11.83,82V40.9L26.35,26.36,40.88,11.83H82Zm5.77-11L122,35.1a3,3,0,0,1,.88,2.26V85.64a3,3,0,0,1-.87,2.11L87.78,122a3,3,0,0,1-2.26.88H37.24a3,3,0,0,1-2.11-.87L.89,87.78A3,3,0,0,1,0,85.52V37.24a3,3,0,0,1,.87-2.11L35.1.89A3,3,0,0,1,37.36,0H85.64a3,3,0,0,1,2.11.87Zm12.89,21.37L84.39,6H38.47L6,38.49V84.41l32.49,32.48H84.41l32.48-32.49V38.47L100.64,22.24Z"
                        />
                        <path
                            fill="#fff"
                            d="M31.38,73c-.68,0-1.33,0-2-.06s-1.28-.1-1.9-.18-1.22-.17-1.79-.27-1.12-.23-1.65-.37V67.4q1,.09,2.25.15l2.44.1,2.31,0a7.84,7.84,0,0,0,1.68-.16,2,2,0,0,0,1-.49,1.21,1.21,0,0,0,.34-.91v-.37a1.16,1.16,0,0,0-.48-1,1.87,1.87,0,0,0-1.11-.34H30.89a8.09,8.09,0,0,1-5.38-1.55c-1.22-1-1.84-2.79-1.84-5.23v-1a6.17,6.17,0,0,1,2-5,8.92,8.92,0,0,1,5.81-1.66,25.45,25.45,0,0,1,2.7.13c.85.1,1.65.21,2.39.34s1.41.27,2,.41v4.71c-.94-.08-2-.15-3.16-.2s-2.24-.07-3.2-.07a8.8,8.8,0,0,0-1.53.12,1.85,1.85,0,0,0-1,.49,1.42,1.42,0,0,0-.37,1.07v.3a1.39,1.39,0,0,0,.49,1.16,2.3,2.3,0,0,0,1.5.4h2a7.08,7.08,0,0,1,3.56.81A5.21,5.21,0,0,1,39,61.79,6.79,6.79,0,0,1,39.72,65v1a8,8,0,0,1-1,4.44,5,5,0,0,1-2.87,2.06,16.18,16.18,0,0,1-4.46.53ZM47,72.81V55.42H41.31V50.1H58.67v5.32H53V72.81Zm22.8.18a16.67,16.67,0,0,1-4.23-.47,6.47,6.47,0,0,1-3-1.7,7.6,7.6,0,0,1-1.84-3.5,23.14,23.14,0,0,1-.61-5.88,23.14,23.14,0,0,1,.61-5.88,7.6,7.6,0,0,1,1.84-3.5,6.47,6.47,0,0,1,3-1.7,19.27,19.27,0,0,1,8.46,0,6.55,6.55,0,0,1,3,1.7,7.68,7.68,0,0,1,1.83,3.5,23.14,23.14,0,0,1,.61,5.88,23.14,23.14,0,0,1-.61,5.88,7.68,7.68,0,0,1-1.83,3.5,6.55,6.55,0,0,1-3,1.7,16.67,16.67,0,0,1-4.23.47Zm0-5.31a5.6,5.6,0,0,0,1.9-.28,2.21,2.21,0,0,0,1.14-1,4.85,4.85,0,0,0,.58-1.89,24.09,24.09,0,0,0,.17-3.12,24.85,24.85,0,0,0-.17-3.21,4.74,4.74,0,0,0-.58-1.88,2.08,2.08,0,0,0-1.14-.9,7.27,7.27,0,0,0-3.78,0,2.05,2.05,0,0,0-1.16.9,4.74,4.74,0,0,0-.58,1.88A24.85,24.85,0,0,0,66,61.44a24.09,24.09,0,0,0,.17,3.12,4.85,4.85,0,0,0,.58,1.89,2.18,2.18,0,0,0,1.16,1,5.6,5.6,0,0,0,1.88.28Zm12.5,5.13V50.1h10a11.63,11.63,0,0,1,2.38.26,5.38,5.38,0,0,1,2.25,1.07,5.59,5.59,0,0,1,1.65,2.44,12.48,12.48,0,0,1,.62,4.36,13.09,13.09,0,0,1-.61,4.42A5.75,5.75,0,0,1,97,65.15a5.3,5.3,0,0,1-2.12,1.14,9.24,9.24,0,0,1-2.25.28c-.38,0-.79,0-1.2-.06s-.83-.09-1.23-.16l-1.1-.22L88.26,66v6.85Zm5.93-11.55h3.43a1.37,1.37,0,0,0,1-.34,1.85,1.85,0,0,0,.49-1,8.35,8.35,0,0,0,.14-1.64,6.5,6.5,0,0,0-.17-1.59,1.91,1.91,0,0,0-.51-1,1.23,1.23,0,0,0-.91-.32H88.26v5.84Z"
                        />
                    </svg>
                </button>
            {:else}
                <div style="display: flex; place-items: center; gap: .5rem; font-size: large; margin: 1rem">
                    <span style="font-size: xx-large;">🙁</span> Deine Abstimmung wurde nicht einstimmig angenommen.
                </div>
            {/if}
        {:else if isYourVote}
            <div style="display: flex; flex-direction: column; place-items: center; margin: 1rem 0">
                <div style="font-size: x-large;margin-bottom: .5rem">Abstimmung läuft</div>
                <Loader />
            </div>
        {:else}
            <div style="display: flex; flex-wrap: wrap" in:fade>
                <VoteButton accept waiting={gameState.currentVoteAccepted === true} disabled={gameState.currentVoteAccepted !== null} onclick={() => respondVote(true)}
                    >Zustimmen</VoteButton
                >
                <VoteButton reject waiting={gameState.currentVoteAccepted === false} disabled={gameState.currentVoteAccepted !== null} onclick={() => respondVote(false)}
                    >Ablehnen</VoteButton
                >
            </div>
        {/if}
    </section>

    <section>
        <div class="announce spy">Spion</div>
        <div class="announce non-spy">Kein Spion</div>
    </section>

    <section style="display: flex; flex-wrap: wrap; justify-content: center;">
        {#if gameState.role === 'leader'}
            <VoteButton accept onclick={() => {}}>Spion enttarnt</VoteButton>
            <VoteButton reject onclick={() => {}}>Falsche Person</VoteButton>
        {/if}
    </section>
</article>

<style>
    .playtime {
        position: relative;
    }

    .playtime output {
        position: absolute;
        text-align: center;
        left: 0;
        right: 0;
        top: 0;
        bottom: 0;
        font-size: 1.25rem;
        font-family: monospace;
    }

    .playtime output.blink {
        animation: blinker 0.5s cubic-bezier(0.5, 0, 1, 1) infinite alternate;
    }

    @keyframes blinker {
        90% {
            opacity: 0%;
        }
        100% {
            opacity: 0%;
        }
    }

    progress {
        text-align: center;
        height: 2rem;
        width: 100%;
        border: none;
        background-color: var(--primary);
    }

    .stop {
        display: block;
        background: none;
        border: none;
        margin: 1rem;
    }

    .stop:hover {
        transform: scale(1.05);
    }

    .announce {
        text-transform: uppercase;
        font-weight: bold;
        font-size: 5rem;
        text-align: center;
        position: relative;
        padding-top: 1rem;
        padding-bottom: 1rem;
        user-select: none;
    }

    .announce:before,
    .announce:after {
        content: '';
        position: absolute;
        display: block;
        height: 1rem;
        width: 100%;
        background: repeating-linear-gradient(-45deg, #ffffff77, #ffffff99 12px, transparent 10px, transparent 23px);
        backface-visibility: hidden;
        border-bottom: 10px;
    }

    .announce:before {
        top: 0;
    }

    .announce:after {
        bottom: 0;
    }

    .announce.spy {
        background-color: rgba(255, 0, 0, 0.761);
    }
    .announce.non-spy {
        background-color: rgba(15, 0, 128, 0.729);
    }
</style>
