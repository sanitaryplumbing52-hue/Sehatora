<?php

declare(strict_types=1);

namespace App\Domain\Identity\Services;

use App\Domain\Identity\Models\LoginActivity;
use App\Domain\Identity\Models\User;
use App\Support\IpAnonymizer;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

final class LoginActivityRecorder
{
    public function record(Request $request, string $email, string $outcome, ?User $user = null): void
    {
        LoginActivity::create([
            'user_id' => $user?->id,
            'email' => mb_strtolower($email),
            'outcome' => $outcome,
            'ip_address' => IpAnonymizer::apply($request->ip()),
            'user_agent' => Str::limit((string) $request->userAgent(), 500, ''),
        ]);
    }
}
