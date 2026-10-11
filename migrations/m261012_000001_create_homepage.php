<?php

namespace craft\contentmigrations;

use Craft;
use RuntimeException;
use craft\db\Migration;
use craft\elements\Asset;
use craft\elements\Entry;
use craft\fieldlayoutelements\CustomField;
use craft\fieldlayoutelements\TitleField;
use craft\fields\Assets;
use craft\fields\Lightswitch;
use craft\fields\PlainText;
use craft\fields\Table;
use craft\fs\Local;
use craft\models\EntryType;
use craft\models\FieldLayout;
use craft\models\Section;
use craft\models\Section_SiteSettings;
use craft\models\Volume;
use modules\services\HomepageContent;

/**
 * Create the Homepage single, organized fields, upload volume, and seeded content.
 * Run: ddev exec php craft migrate/up --interactive=0
 * No parameters; safeUp returns success or throws with Craft validation details.
 * Reuses existing schema/content and does not overwrite editor changes.
 * Schema lives in config/project; entries and uploaded files must also be deployed.
 */
class m261012_000001_create_homepage extends Migration
{
    public function safeUp(): bool
    {
        $fs = Craft::$app->getFs()->getFilesystemByHandle('homepageUploads');
        if (!$fs) {
            $fs = new Local([
                'name' => 'Homepage uploads', 'handle' => 'homepageUploads',
                'path' => '@webroot/uploads/homepage', 'hasUrls' => true,
                'url' => '/uploads/homepage',
            ]);
            if (!Craft::$app->getFs()->saveFilesystem($fs)) {
                throw new RuntimeException(json_encode($fs->getErrors()));
            }
        }
        $volume = Craft::$app->getVolumes()->getVolumeByHandle('homepageImages');
        if (!$volume) {
            $volume = new Volume(['name' => 'Homepage images', 'handle' => 'homepageImages', 'fsHandle' => $fs->handle]);
            if (!Craft::$app->getVolumes()->saveVolume($volume)) {
                throw new RuntimeException(json_encode($volume->getErrors()));
            }
        }
        $tabs = [];
        foreach (HomepageContent::definitions() as $definition) {
            $handle = HomepageContent::handle($definition['key']);
            $field = Craft::$app->getFields()->getFieldByHandle($handle);
            if (!$field) {
                $config = ['handle' => $handle, 'name' => $definition['label'], 'instructions' => $definition['instructions']];
                switch ($definition['kind']) {
                    case 'table':
                        $columns = [];
                        foreach ($definition['columns'] as $key => $heading) {
                            $columns['col' . (count($columns) + 1)] = ['heading' => $heading, 'handle' => $key, 'type' => 'multiline'];
                        }
                        $config += ['type' => Table::class, 'columns' => $columns, 'defaults' => [], 'addRowLabel' => 'Add item'];
                        break;
                    case 'asset':
                        $config += ['type' => Assets::class, 'sources' => ['volume:' . $volume->uid], 'defaultUploadLocationSource' => 'volume:' . $volume->uid, 'restrictFiles' => true, 'allowedKinds' => ['image'], 'maxRelations' => 1];
                        break;
                    case 'boolean':
                        $config += ['type' => Lightswitch::class, 'default' => true];
                        break;
                    default:
                        $config += ['type' => PlainText::class, 'multiline' => true, 'initialRows' => 2];
                }
                $field = Craft::$app->getFields()->createField($config);
                if (!Craft::$app->getFields()->saveField($field)) {
                    throw new RuntimeException("Unable to save $handle: " . json_encode($field->getErrors()));
                }
            }
            $tabs[$definition['tab']][] = ['type' => CustomField::class, 'fieldUid' => $field->uid];
        }
        $entryType = Craft::$app->getEntries()->getEntryTypeByHandle('homepage');
        if (!$entryType) {
            $layoutTabs = [['name' => 'Overview', 'elements' => [['type' => TitleField::class, 'label' => 'Entry name (internal)']]]];
            foreach ($tabs as $name => $elements) {
                $layoutTabs[] = ['name' => $name, 'elements' => $elements];
            }
            $entryType = new EntryType(['name' => 'Homepage', 'handle' => 'homepage']);
            $entryType->setFieldLayout(FieldLayout::createFromConfig(['type' => Entry::class, 'tabs' => $layoutTabs]));
            if (!Craft::$app->getEntries()->saveEntryType($entryType)) {
                throw new RuntimeException(json_encode($entryType->getErrors()));
            }
        }
        $site = Craft::$app->getSites()->getPrimarySite();
        $section = Craft::$app->getEntries()->getSectionByHandle('homepage');
        if (!$section) {
            $section = new Section([
                'name' => 'Homepage', 'handle' => 'homepage', 'type' => Section::TYPE_SINGLE,
                'entryTypes' => [$entryType], 'previewTargets' => [],
                'siteSettings' => [$site->id => new Section_SiteSettings(['siteId' => $site->id, 'hasUrls' => false, 'enabledByDefault' => true])],
            ]);
            if (!Craft::$app->getEntries()->saveSection($section)) {
                throw new RuntimeException(json_encode($section->getErrors()));
            }
        }
        $entry = Entry::find()->section('homepage')->siteId($site->id)->status(null)->one();
        // Craft automatically creates the Single. Only initialize its empty content.
        if ($entry && $entry->getFieldValue('homepageClinicName')) {
            return true;
        }
        $entry ??= new Entry(['sectionId' => $section->id, 'typeId' => $entryType->id, 'siteId' => $site->id]);
        $entry->title = 'Homepage';
        $entry->enabled = true;
        $values = [];
        foreach (HomepageContent::definitions() as $definition) {
            $value = $definition['value'];
            if ($definition['kind'] === 'asset') {
                $asset = Asset::find()->volumeId($volume->id)->filename($value)->one();
                if (!$asset) {
                    $folder = Craft::$app->getAssets()->getRootFolderByVolumeId($volume->id);
                    $source = Craft::getAlias('@root') . '/frontend/public/images/' . $value;
                    $temp = tempnam(Craft::$app->getPath()->getTempPath(), 'homepage-');
                    if (!copy($source, $temp)) {
                        throw new RuntimeException("Cannot copy seed image $source");
                    }
                    $asset = new Asset([
                        'tempFilePath' => $temp, 'filename' => $value, 'newFolderId' => $folder->id,
                        'volumeId' => $volume->id, 'title' => $definition['label'],
                        'scenario' => Asset::SCENARIO_CREATE,
                    ]);
                    if (!Craft::$app->getElements()->saveElement($asset)) {
                        throw new RuntimeException(json_encode($asset->getErrors()));
                    }
                }
                $value = [$asset->id];
            }
            $values[HomepageContent::handle($definition['key'])] = $value;
        }
        $entry->setFieldValues($values);
        if (!Craft::$app->getElements()->saveElement($entry)) {
            throw new RuntimeException(json_encode($entry->getErrors()));
        }
        return true;
    }

    public function safeDown(): bool
    {
        echo "Homepage contains editor content and uploaded images; automatic removal is disabled.\n";
        return false;
    }
}
