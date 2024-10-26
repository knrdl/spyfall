<script>
    import backgroundImg from '$lib/assets/background.jpg';
    import './styles.css';
</script>

<main style="background-image: url({backgroundImg});">
    <slot />
</main>

<style>
    main {
        min-height: 100vh;
        background-position-y: bottom;
        background-repeat: repeat-x;
        background-position-x: center;
    }

    @media screen and (min-height: 100vw) {
        /* The width is smaller than the height */
        main {
            background-size: cover;
        }
    }
</style>
