<script>
    import { fade } from "svelte/transition";

    let { children, value } = $props();

    let inputElement;
    let timeoutHandle = $state(null);

    async function copyToClipboard() {
        clearTimeout(timeoutHandle)
        timeoutHandle = null;
        inputElement.select();
        inputElement.setSelectionRange(0, 99999);
        await navigator.clipboard.writeText(inputElement.value);
        timeoutHandle = setTimeout(() => {
            clearTimeout(timeoutHandle)
            timeoutHandle = null;
        }, 500);
    }
</script>

<input type="text" hidden {value} bind:this={inputElement} />
<button type="button" onclick={copyToClipboard}>
    {#if timeoutHandle !==null}
    <span in:fade>Kopiert!</span>
    {:else}
    {@render children()}
    {/if}
</button>
