<?php

use craft\config\GeneralConfig;

return GeneralConfig::create()
    ->defaultWeekStartDay(1)
    ->omitScriptNameInUrls()
    ->preloadSingles()
    ->preventUserEnumeration()
    ->useEmailAsUsername(true)
    ->aliases([
        '@webroot' => dirname(__DIR__) . '/web',
    ]);
