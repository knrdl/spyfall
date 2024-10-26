<script>
    import { page } from '$app/stores';
</script>

<h1>{$page.status || ''} {$page.error.message}</h1>

<style>
    h1 {
        text-align: center;
        margin: 0;
        padding-top: 3rem;
        text-shadow: rgba(255, 255, 255, 0.9) 2px 2px 15px;
    }
</style>
