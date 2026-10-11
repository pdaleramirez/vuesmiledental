<?php

namespace modules\services;

/** Shared homepage schema for the migration and read-only API. */
final class HomepageContent
{
    /**
     * No arguments. Returns field definitions, editor instructions, and seed values.
     * Example: foreach (HomepageContent::definitions() as $field) { ... }
     * Defaults only seed new content; the public API reads saved Craft values.
     */
    public static function definitions(): array
    {
        return json_decode(file_get_contents(__DIR__ . '/homepage-content.json'), true, 512, JSON_THROW_ON_ERROR);
    }

    /** Convert an API key into its Craft field handle; e.g. heroTitle → homepageHeroTitle. */
    public static function handle(string $key): string
    {
        return 'homepage' . ucfirst($key);
    }
}
