<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" @class(['tema-pengelola' => $page['props']['temaPanel'] ?? false])>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        @if ($page['props']['temaPanel'] ?? false)
            {{-- Mode gelap panel pengelola dipasang sebelum halaman tampil supaya tidak berkedip (lihat Components/pengelola/tema.ts) --}}
            <script>
                (function () {
                    var c = document.cookie.match(/(?:^|; )tema_pengelola=(gelap|terang)/);
                    var gelap = c ? c[1] === 'gelap' : window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
                    if (gelap) document.documentElement.classList.add('dark');
                })();
            </script>
        @endif

        <title inertia>{{ config('app.name', 'Laravel') }}</title>

        <!-- Scripts -->
        @routes
        @viteReactRefresh
        @vite(['resources/js/app.tsx', "resources/js/Pages/{$page['component']}.tsx"])
        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        @inertia
    </body>
</html>
