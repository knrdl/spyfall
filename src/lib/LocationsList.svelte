<script>
    let { locations, selectedLocation = undefined } = $props();
</script>

<ul>
    {#each locations as location}
        <li class:selected={selectedLocation === location}>{location}</li>
    {/each}
    {#if selectedLocation === null}
        <li class="spy-hint">Spion</li>
    {/if}
</ul>

<style>
    ul {
        display: flex;
        flex-wrap: wrap;
        list-style: none;
        gap: 0.5rem;
        justify-content: flex-start;
        margin: 0;
        padding: 0;
        position: relative;
    }

    ul > li {
        min-width: 7rem;
        padding: 0.25rem;
    }

    .selected {
        background-color: var(--primary);
        border-radius: 5px;
        color: black;
    }

    .spy-hint {
        position: absolute;
        text-transform: uppercase;
        overflow: hidden;
        top: calc(50% - 3rem);
        left: calc(50% - 8rem);
        color: #fff4;
        font-size: 4rem;
        pointer-events: none;
        letter-spacing: 0.25rem;
        transform: rotate(-45deg);
        z-index: 100;
    }

    .spy-hint::before {
        content: 'Spion';
        position: absolute;
        text-transform: uppercase;
        overflow: hidden;
        left: 0;
        top: 0;
        color: #fff4;
    }

    ul:has(.spy-hint) {
        min-height: 10rem;
    }
</style>
