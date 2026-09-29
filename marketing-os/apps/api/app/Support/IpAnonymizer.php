<?php

declare(strict_types=1);

namespace App\Support;

/** Applies the configured IP storage policy (marketing.privacy.ip_mode). */
final class IpAnonymizer
{
    public static function apply(?string $ip): ?string
    {
        if ($ip === null || $ip === '') {
            return null;
        }

        return match (config('marketing.privacy.ip_mode')) {
            'full' => $ip,
            'hashed' => substr(hash_hmac('sha256', $ip, (string) config('app.key')), 0, 32),
            default => self::truncate($ip),
        };
    }

    private static function truncate(string $ip): string
    {
        if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4)) {
            $p = explode('.', $ip);
            $p[3] = '0';

            return implode('.', $p);
        }
        $packed = @inet_pton($ip);
        if ($packed === false) {
            return 'invalid';
        }

        return (string) inet_ntop(substr($packed, 0, 6).str_repeat("\0", 10)); // keep /48
    }
}
