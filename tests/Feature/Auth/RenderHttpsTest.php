<?php

use Illuminate\Http\Middleware\TrustProxies;

test('Render recognizes HTTPS forwarded by its proxy', function () {
    $previous = getenv('RENDER');
    putenv('RENDER=true');

    try {
        $this->refreshApplication();

        $this->withServerVariables(['REMOTE_ADDR' => '10.0.0.1'])
            ->withHeaders(['X-Forwarded-Proto' => 'https'])
            ->get('http://gradschool.onrender.com/login')
            ->assertSuccessful();

        expect(route('login'))->toBe('https://gradschool.onrender.com/login');
        expect(asset('build/assets/app.js'))->toBe('https://gradschool.onrender.com/build/assets/app.js');
    } finally {
        putenv($previous === false ? 'RENDER' : 'RENDER='.$previous);
        TrustProxies::flushState();
    }
});
