<script>
    let { accept=false, reject=false, waiting=false, disabled=false, onclick, children } = $props();
</script>

<button type="button" class="vote" class:accept={accept}  class:reject={reject} {onclick} {disabled}> 
    {#if waiting}
    <span class="loader"></span>
    {/if}
    {@render children()}
</button>

<style>
    .vote {
        display: block;
        width: 10rem;
        height: 10rem;
        border-radius: 300px;
        border-width: 0.5rem;
        border-style: solid;
        box-shadow: 2px 2px 7px rgba(0, 0, 0, 0.2);
        text-shadow: 0 1px 0 rgba(255, 255, 255, 0.7);
        text-align: center;
        font-size: x-large;
        margin: 1rem;
        position: relative;
        color: white;
    }

    .vote:disabled{
        color: #9993;
    }

    .vote:hover {
        transform: scale(1.05);
    }

    .accept {
        background-color: rgb(53, 195, 53);
        border-color: rgba(25, 95, 25, 0.5);
    }

    .reject {
        background-color: rgb(220, 63, 63);
        border-color: rgba(82, 24, 24, 0.5);
    }

    .loader {
        position: absolute;
        left:-3px;
        top: -3px;
        width: calc(100% + 6px);
        height: calc(100% + 6px);
        border: 5px solid #FFF;
        border-bottom-color: transparent;
        border-radius: 50%;
        display: inline-block;
        box-sizing: border-box;
        animation: rotation 1s linear infinite;
    }

    @keyframes rotation {
        0% {
            transform: rotate(0deg);
        }
        100% {
            transform: rotate(360deg);
        }
    } 
</style>
