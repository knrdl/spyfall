<script>
    let { up = false, down = false, ondone = undefined } = $props();
    import { onMount } from 'svelte';

    onMount(() => {
        setTimeout(() => ondone?.(), 1000);
    });
</script>

<div class:up class:down>
    {#if up}
        👍
    {/if}
    {#if down}
        👎
    {/if}
</div>

<style>
    div {
        position: fixed;
        left: 50%;
        transform: translateX(-50%);
        z-index: 1000;
        user-select: none;
        width: min(50vh, 50vw);
        height: min(50vh, 50vw);
        overflow: hidden;

        display: flex;
        justify-content: center;
        align-items: center;

        color: white;
        background-color: #333c;
        border-radius: 100%;
        font-size: min(40vh, 40vw);
        opacity: 0;
    }

    .up {
        animation: move-up 2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }

    .down {
        animation: move-down 2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }

    @keyframes move-up {
        0% {
            margin-top: 100vh;
            opacity: 1;
        }
        80% {
            margin-top: 0vh;
            opacity: 1;
        }
        100% {
            margin-top: 0vh;
            opacity: 0;
        }
    }

    @keyframes move-down {
        0% {
            margin-top: -50vh;
            opacity: 1;
        }
        80% {
            margin-top: 50vh;
            opacity: 1;
        }
        100% {
            opacity: 0;
            margin-top: 50vh;
        }
    }
</style>
