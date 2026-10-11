<?php

namespace modules\services\controllers;

use Craft;
use craft\elements\Entry;
use craft\web\Controller;
use yii\web\MethodNotAllowedHttpException;
use yii\web\Response;

class ServicesController extends Controller
{
    // Only this read-only action is public; editors use Craft's authenticated CP.
    protected array|bool|int $allowAnonymous = ['index'];

    /**
     * GET /api/services returns published cards in their Craft structure order.
     * No parameters are required. Drafts, disabled entries, and future posts are
     * excluded. Returns a JSON array matching the Nuxt DentalService type.
     * Example: const { data } = await useApi('/api/services', { server: false })
     */
    public function actionIndex(): Response
    {
        $request = Craft::$app->getRequest();
        if (!$request->getIsGet() && !$request->getIsHead()) {
            throw new MethodNotAllowedHttpException('Use GET to read published services.');
        }

        $entries = Entry::find()
            ->section('services')
            ->siteId(Craft::$app->getSites()->getPrimarySite()->id)
            ->status('live')
            ->drafts(false)
            ->revisions(false)
            ->orderBy('lft ASC')
            ->all();

        $services = array_map(static fn(Entry $entry): array => [
            'id' => $entry->id,
            'name' => $entry->title,
            'group' => $entry->getFieldValue('serviceGroup')->value,
            'icon' => $entry->getFieldValue('serviceIcon')->value,
            'description' => (string)$entry->getFieldValue('serviceDescription'),
            'tag' => (string)$entry->getFieldValue('serviceLinkText'),
        ], $entries);

        // Keep editor changes visible on the next page load, including removals.
        $response = $this->asJson($services);
        $response->getHeaders()->set('Cache-Control', 'no-store');
        return $response;
    }
}
