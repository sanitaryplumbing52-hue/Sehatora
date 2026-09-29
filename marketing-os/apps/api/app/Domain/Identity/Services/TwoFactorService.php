<?php

declare(strict_types=1);

namespace App\Domain\Identity\Services;

use App\Domain\Identity\Models\User;
use BaconQrCode\Renderer\Image\SvgImageBackEnd;
use BaconQrCode\Renderer\ImageRenderer;
use BaconQrCode\Renderer\RendererStyle\RendererStyle;
use BaconQrCode\Writer;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use PragmaRX\Google2FA\Google2FA;

/** TOTP two-factor auth: enrolment (secret -> confirm), verification, single-use recovery codes. */
final class TwoFactorService
{
    public function __construct(private readonly Google2FA $google2fa) {}

    /** @return array{secret: string, otpauth_url: string, qr_svg: string} */
    public function beginEnrolment(User $user): array
    {
        $secret = $this->google2fa->generateSecretKey(32);
        $user->forceFill(['two_factor_secret' => $secret, 'two_factor_confirmed_at' => null, 'two_factor_recovery_codes' => null])->save();

        $url = $this->google2fa->getQRCodeUrl(config('app.name'), $user->email, $secret);
        $svg = (new Writer(new ImageRenderer(new RendererStyle(192, 1), new SvgImageBackEnd)))->writeString($url);

        return ['secret' => $secret, 'otpauth_url' => $url, 'qr_svg' => $svg];
    }

    /** @return list<string>|null plaintext recovery codes (shown once), or null if the code is wrong */
    public function confirmEnrolment(User $user, string $code): ?array
    {
        if ($user->two_factor_secret === null || $user->hasTwoFactorEnabled() || ! $this->verifyTotp($user, $code)) {
            return null;
        }
        $plain = collect(range(1, 8))->map(fn () => Str::lower(Str::random(5).'-'.Str::random(5)))->all();
        $user->forceFill([
            'two_factor_confirmed_at' => now(),
            'two_factor_recovery_codes' => array_map(fn ($c) => hash('sha256', $c), $plain),
        ])->save();

        return $plain;
    }

    public function disable(User $user): void
    {
        $user->forceFill(['two_factor_secret' => null, 'two_factor_recovery_codes' => null, 'two_factor_confirmed_at' => null])->save();
    }

    public function verifyTotp(User $user, string $code): bool
    {
        $code = preg_replace('/\s+/', '', $code) ?? '';
        if (! preg_match('/^\d{6}$/', $code) || $user->two_factor_secret === null) {
            return false;
        }
        // Reject replay of a code already accepted within its validity window.
        $replayKey = 'totp-used:'.$user->id.':'.$code;
        if (Cache::has($replayKey)) {
            return false;
        }
        if (! $this->google2fa->verifyKey($user->two_factor_secret, $code, 1)) {
            return false;
        }
        Cache::put($replayKey, true, 120);

        return true;
    }

    public function consumeRecoveryCode(User $user, string $code): bool
    {
        $hash = hash('sha256', Str::lower(trim($code)));
        $codes = $user->two_factor_recovery_codes ?? [];
        $index = array_search($hash, $codes, true);
        if ($index === false) {
            return false;
        }
        unset($codes[$index]);
        $user->forceFill(['two_factor_recovery_codes' => array_values($codes)])->save();

        return true;
    }
}
