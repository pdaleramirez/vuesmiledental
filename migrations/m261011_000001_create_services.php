<?php

namespace craft\contentmigrations;

use Craft;
use DateTime;
use DateTimeZone;
use RuntimeException;
use craft\db\Migration;
use craft\elements\Entry;
use craft\elements\User;
use craft\fieldlayoutelements\CustomField;
use craft\fieldlayoutelements\TitleField;
use craft\fields\Dropdown;
use craft\fields\PlainText;
use craft\models\EntryType;
use craft\models\FieldLayout;
use craft\models\Section;
use craft\models\Section_SiteSettings;

/**
 * Provision the editable homepage services and seed the existing six cards.
 * Run from the project root: ddev exec php craft migrate/up --interactive=0
 * Existing fields, sections, and entries are reused; edited entries are not reset.
 * Craft writes the resulting schema into config/project for other environments.
 */
class m261011_000001_create_services extends Migration
{
    public function safeUp(): bool
    {
        $fieldsService = Craft::$app->getFields();
        $definitions = [
            'serviceGroup' => [
                'type' => Dropdown::class,
                'name' => 'Care category',
                'instructions' => 'Choose the homepage filter for this service.',
                'options' => [
                    ['label' => 'Maintain', 'value' => 'Maintain', 'default' => true],
                    ['label' => 'Restore', 'value' => 'Restore'],
                    ['label' => 'Brighten', 'value' => 'Brighten'],
                ],
            ],
            'serviceDescription' => [
                'type' => PlainText::class,
                'name' => 'Description',
                'instructions' => 'Short explanation shown on the service card.',
                'multiline' => true,
                'initialRows' => 3,
                'charLimit' => 600,
            ],
            'serviceIcon' => [
                'type' => Dropdown::class,
                'name' => 'Card icon',
                'instructions' => 'Choose an icon from the website’s existing icon set.',
                'options' => [
                    ['label' => 'Tooth', 'value' => 'tooth', 'default' => true],
                    ['label' => 'Shield / checkup', 'value' => 'shield'],
                    ['label' => 'Restoration', 'value' => 'restore'],
                    ['label' => 'Crown', 'value' => 'crown'],
                    ['label' => 'Smile / dentures', 'value' => 'smile'],
                    ['label' => 'Sparkle / whitening', 'value' => 'sparkle'],
                ],
            ],
            'serviceLinkText' => [
                'type' => PlainText::class,
                'name' => 'Appointment link text',
                'instructions' => 'Text below the description. The link selects this service in the appointment form.',
                'charLimit' => 120,
            ],
        ];

        $fields = [];
        foreach ($definitions as $handle => $definition) {
            $field = $fieldsService->getFieldByHandle($handle);
            if (!$field) {
                $field = $fieldsService->createField(['handle' => $handle] + $definition);
                if (!$fieldsService->saveField($field)) {
                    throw new RuntimeException("Unable to save $handle: " . json_encode($field->getErrors()));
                }
            }
            $fields[$handle] = $field;
        }

        $entriesService = Craft::$app->getEntries();
        $entryType = $entriesService->getEntryTypeByHandle('dentalService');
        if (!$entryType) {
            $layoutElements = [['type' => TitleField::class, 'label' => 'Service name']];
            foreach ($fields as $field) {
                $layoutElements[] = [
                    'type' => CustomField::class,
                    'fieldUid' => $field->uid,
                    'required' => true,
                ];
            }
            $entryType = new EntryType(['name' => 'Dental service', 'handle' => 'dentalService']);
            $entryType->setFieldLayout(FieldLayout::createFromConfig([
                'type' => Entry::class,
                'tabs' => [['name' => 'Service details', 'elements' => $layoutElements]],
            ]));
            if (!$entriesService->saveEntryType($entryType)) {
                throw new RuntimeException('Unable to save service entry type: ' . json_encode($entryType->getErrors()));
            }
        }

        $site = Craft::$app->getSites()->getPrimarySite();
        $section = $entriesService->getSectionByHandle('services');
        if (!$section) {
            $section = new Section([
                'name' => 'Services',
                'handle' => 'services',
                'type' => Section::TYPE_STRUCTURE,
                'maxLevels' => 1,
                'defaultPlacement' => Section::DEFAULT_PLACEMENT_END,
                'entryTypes' => [$entryType],
                'previewTargets' => [],
                'siteSettings' => [
                    $site->id => new Section_SiteSettings([
                        'siteId' => $site->id,
                        'enabledByDefault' => true,
                        'hasUrls' => false,
                    ]),
                ],
            ]);
            if (!$entriesService->saveSection($section)) {
                throw new RuntimeException('Unable to save Services section: ' . json_encode($section->getErrors()));
            }
            // The structure is created by project config; reload its generated ID.
            $section = $entriesService->getSectionById($section->id);
        }

        $author = User::find()->admin(true)->one();
        $services = [
            ['checkup-cleaning', 'Checkup & cleaning', 'Maintain', 'shield', 'Make room for the basics. Start with a dental checkup and ask about professional cleaning.', 'A healthy foundation'],
            ['tooth-restoration', 'Tooth restoration', 'Restore', 'restore', 'Chipped or damaged tooth? Talk to us about restoring its shape and function.', 'Care for a damaged tooth'],
            ['dental-crowns', 'Dental crowns', 'Restore', 'crown', 'Explore a crown to restore a tooth. A consultation helps you understand your options.', 'Restore your smile'],
            ['root-canal-treatment', 'Root canal treatment', 'Restore', 'tooth', 'Have a conversation about your tooth and whether root canal treatment is appropriate.', 'Explore your options'],
            ['dentures', 'Dentures', 'Restore', 'smile', 'Missing teeth? Ask about denture options and what to expect from your consultation.', 'Make your smile complete'],
            ['teeth-whitening', 'Teeth whitening', 'Brighten', 'sparkle', 'Thinking of a brighter smile? Ask about professional whitening and suitability for your teeth.', 'A little more brightness'],
        ];

        foreach ($services as [$slug, $title, $group, $icon, $description, $linkText]) {
            if (Entry::find()->sectionId($section->id)->siteId($site->id)->slug($slug)->status(null)->one()) {
                continue;
            }
            $entry = new Entry([
                'sectionId' => $section->id,
                'typeId' => $entryType->id,
                'siteId' => $site->id,
                'authorId' => $author?->id,
                'title' => $title,
                'slug' => $slug,
                'enabled' => true,
                'postDate' => new DateTime('now', new DateTimeZone('UTC')),
            ]);
            $entry->setFieldValues([
                'serviceGroup' => $group,
                'serviceIcon' => $icon,
                'serviceDescription' => $description,
                'serviceLinkText' => $linkText,
            ]);
            if (!Craft::$app->getElements()->saveElement($entry)) {
                throw new RuntimeException("Unable to save $title: " . json_encode($entry->getErrors()));
            }
            if (!Craft::$app->getStructures()->appendToRoot($section->structureId, $entry)) {
                throw new RuntimeException("Unable to place $title in the Services structure.");
            }
        }

        return true;
    }

    public function safeDown(): bool
    {
        // Preserve editor content; reverting this migration must not delete entries.
        echo "Services contains editable content and cannot be automatically removed.\n";
        return false;
    }
}
