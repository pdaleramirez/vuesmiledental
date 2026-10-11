<?php

namespace modules\services\controllers;

use Craft;
use craft\elements\Entry;
use craft\web\Controller;
use modules\services\HomepageContent;
use yii\web\MethodNotAllowedHttpException;
use yii\web\NotFoundHttpException;
use yii\web\Response;

class HomepageController extends Controller
{
    protected array|bool|int $allowAnonymous = ['index'];

    /**
     * GET /api/homepage, no parameters. Returns saved, published Homepage fields.
     * Drafts and disabled content are never exposed. Images return URLs or null;
     * tables return ordered rows. Example: await useApi('/api/homepage', { server: false }).
     * Read-only endpoint; editing requires Craft's authenticated control panel.
     */
    public function actionIndex(): Response
    {
        if (!Craft::$app->getRequest()->getIsGet() && !Craft::$app->getRequest()->getIsHead()) {
            throw new MethodNotAllowedHttpException('Use GET to read the homepage.');
        }
        $entry = Entry::find()->section('homepage')->siteId(Craft::$app->getSites()->getPrimarySite()->id)
            ->status('live')->drafts(false)->revisions(false)->one();
        if (!$entry) {
            throw new NotFoundHttpException('No published homepage.');
        }
        $content = [];
        foreach (HomepageContent::definitions() as $definition) {
            $value = $entry->getFieldValue(HomepageContent::handle($definition['key']));
            $content[$definition['key']] = match ($definition['kind']) {
                'asset' => $value->one()?->getUrl(),
                'boolean' => (bool)$value,
                // Send only the named columns, not Craft's internal col1/col2 aliases.
                'table' => array_map(static function (array $row) use ($definition): array {
                    $result = [];
                    foreach ($definition['columns'] as $key => $_) {
                        $result[$key] = (string)($row[$key] ?? '');
                    }
                    return $result;
                }, $value ?? []),
                default => (string)$value,
            };
        }
        $response = $this->asJson($content);
        $response->getHeaders()->set('Cache-Control', 'no-store');
        return $response;
    }
}
