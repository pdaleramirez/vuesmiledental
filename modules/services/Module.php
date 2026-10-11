<?php

namespace modules\services;

/** Registers the services controller used by the public /api/services route. */
class Module extends \yii\base\Module
{
    public function init(): void
    {
        parent::init();
        $this->controllerNamespace = 'modules\\services\\controllers';
    }
}
