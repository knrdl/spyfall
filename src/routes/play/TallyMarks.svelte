<script>
    let { value } = $props();
</script>

<ol>
    {#each Array(value) as _}
        <li></li>
    {/each}
</ol>

<style>
    ol {
        display: inline-block;
        margin: 0;
        padding: 0;
    }
    li {
        display: inline-block;
        height: 20px;
        border: 2px solid #fff;
        border-radius: 10px;
        margin: 0 4px 0 0;
        transform: rotate(15deg);
    }

    li:nth-child(5n) {
        transform: rotate(300deg);
        height: 35px;
        position: relative;
        left: -20px;
        top: 7px;
        margin-right: 10px;
        margin-top:-20px;
    }
</style>
