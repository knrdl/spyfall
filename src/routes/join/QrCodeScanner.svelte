<script>
    import { onDestroy, onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import QrScanner from 'qr-scanner';
    import { fade } from 'svelte/transition';

    let videoElement = $state();
    let hasCamera = $state(true);
    let errMsg = $state('');

    let qrScanner;

    onMount(async () => {
        if (await QrScanner.hasCamera()) {
            qrScanner = new QrScanner(
                videoElement,
                (result) => {
                    const gameUrl = result.data;
                    if (gameUrl.startsWith(location.origin + location.pathname) && gameUrl.includes('id=')) {
                        goto(gameUrl);
                    } else {
                        errMsg = 'Falsche Webadresse';
                    }
                },
                {
                    onDecodeError: (error) => {
                        errMsg = error + '';
                    },
                    preferredCamera: 'environment',
                    highlightScanRegion: true,
                    highlightCodeOutline: true,
                    returnDetailedScanResult: true,
                },
            );
            qrScanner.setInversionMode('invert');
            qrScanner.start();
        } else {
            hasCamera = false;
            errMsg = 'Kein Kamerazugriff';
        }
    });

    onDestroy(() => {
        qrScanner?.destroy();
    });
</script>

{#if errMsg}
    <p style="text-align: center;" transition:fade>
        {errMsg}
    </p>
{/if}

<!-- svelte-ignore a11y_media_has_caption -->
<video bind:this={videoElement} style="width: 100%; max-height: 100vh;min-height: 50vh;border: 1px solid black; background-color: #ccc;"></video>
