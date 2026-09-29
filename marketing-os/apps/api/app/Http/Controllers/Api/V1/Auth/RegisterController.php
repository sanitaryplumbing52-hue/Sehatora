<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Auth;

use App\Domain\Audit\Audit;
use App\Domain\Identity\Models\User;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Resources\UserResource;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class RegisterController extends Controller
{
    public function __invoke(RegisterRequest $request, Audit $audit): JsonResponse
    {
        $user = User::create($request->safe()->only(['name', 'email', 'password']));
        event(new Registered($user)); // sends the verification email

        Auth::login($user);
        $request->session()->regenerate();
        $audit->record('auth.registered', $user, actor: $user);

        return (new UserResource($user))->response()->setStatusCode(201);
    }
}
