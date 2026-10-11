<?php

$root = dirname(__DIR__, 2);
$path = $root . '/.env';
if (!is_file($path)) {
    if (!copy($root . '/.env.example.dev', $path)) {
        throw new RuntimeException('Unable to create the local Craft environment.');
    }
}
$content = file_get_contents($path);
if (preg_match('/^CRAFT_SECURITY_KEY=\s*$/m', $content)) {
    $content = preg_replace_callback(
        '/^CRAFT_SECURITY_KEY=\s*$/m',
        static fn() => 'CRAFT_SECURITY_KEY=' . bin2hex(random_bytes(32)),
        $content
    );
    if (file_put_contents($path, $content) === false) {
        throw new RuntimeException('Unable to write the local Craft security key.');
    }
}
chmod($path, 0600);
echo "Local Craft environment is ready.\n";
