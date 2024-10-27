<script>
</script>

<a href="https://github.com/knrdl/spyfall">
    <h1>SpyFall</h1>
</a>

<div class="buttons">
    <a href="./new" class="btn">Spiel erstellen</a>
    <a href="./join" class="btn">Spiel beitreten</a>
</div>

<style>
    h1 {
        margin: 0;
        font-weight: bold;
        font-size: 8rem;
        text-align: center;
        background-color: black;
        background-clip: text;
        color: rgba(0, 0, 0, 0.3);
        text-shadow: rgba(255, 255, 255, 0.3) 1px 1px 15px;
        word-wrap: break-word;

        animation: fade 1s backwards;
    }

    h1:before {
        content: '»';
    }
    h1:after {
        content: '«';
    }

    .buttons {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
    }

    .buttons > :nth-child(1) {
        animation: slide-left 0.5s forwards;
        animation-delay: 0.1s;
    }

    .buttons > :nth-child(2) {
        animation: slide-right 0.5s forwards;
        animation-delay: 0.1s;
    }

    @keyframes fade {
        from {
            opacity: 0%;
        }
        to {
            opacity: 100%;
        }
    }

    @keyframes slide-left {
        from {
            margin-left: -10rem;
        }
        to {
            margin-left: 0;
        }
    }

    @keyframes slide-right {
        from {
            margin-right: -10rem;
        }
        to {
            margin-right: 0;
        }
    }
</style>
