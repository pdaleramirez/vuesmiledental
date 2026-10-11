<?php

use craft\helpers\App;

return [
    'id' => App::env('CRAFT_APP_ID') ?: 'VueSmileDental',
    'modules' => [
        'services-api' => ['class' => \modules\services\Module::class],
    ],
    'bootstrap' => [],
];
