<?php

use App\Http\Controllers\Api\V1\Auth\EmailVerificationController;
use App\Http\Controllers\Api\V1\Auth\LoginController;
use App\Http\Controllers\Api\V1\Auth\PasswordController;
use App\Http\Controllers\Api\V1\Auth\RegisterController;
use App\Http\Controllers\Api\V1\Me\ProfileController;
use App\Http\Controllers\Api\V1\Orgs\AuditLogController;
use App\Http\Controllers\Api\V1\Orgs\IntegrationController;
use App\Http\Controllers\Api\V1\Orgs\InvitationController;
use App\Http\Controllers\Api\V1\Orgs\MemberController;
use App\Http\Controllers\Api\V1\Orgs\OrganizationController;
use App\Http\Controllers\Api\V1\Orgs\RoleController;
use App\Http\Controllers\Api\V1\Projects\DashboardController;
use App\Http\Controllers\Api\V1\Projects\ProjectController;
use App\Http\Controllers\Api\V1\Projects\WebsiteController;
use App\Http\Controllers\Api\V1\System\HealthController;
use Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse;
use Illuminate\Cookie\Middleware\EncryptCookies;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Session\Middleware\StartSession;
use Illuminate\Support\Facades\Route;

/*
 * /api/v1 — every route here must be documented in packages/api-contract/openapi.yaml
 * (enforced by tests/Feature/OpenApiParityTest).
 */

// Health endpoints are stateless: no session, cookies or CSRF.
Route::withoutMiddleware([EncryptCookies::class, AddQueuedCookiesToResponse::class, StartSession::class, ValidateCsrfToken::class])->group(function () {
    Route::get('system/health', [HealthController::class, 'show']);
    Route::get('system/health/details', [HealthController::class, 'details'])->middleware('throttle:10,1');
});

// --- Guest auth ---------------------------------------------------------------
Route::prefix('auth')->group(function () {
    Route::post('register', RegisterController::class)->middleware('throttle:auth');
    Route::post('login', [LoginController::class, 'login']);
    Route::post('2fa/challenge', [LoginController::class, 'twoFactorChallenge']);
    Route::post('forgot-password', [PasswordController::class, 'forgot'])->middleware('throttle:auth');
    Route::post('reset-password', [PasswordController::class, 'reset'])->middleware('throttle:auth');
    Route::get('email/verify/{id}/{hash}', [EmailVerificationController::class, 'verify'])
        ->middleware(['signed', 'throttle:6,1'])->name('verification.verify');

    Route::middleware('auth')->group(function () {
        Route::post('logout', [LoginController::class, 'logout']);
        Route::post('email/resend', [EmailVerificationController::class, 'resend'])->middleware('throttle:6,1');
    });
});

// --- Authenticated user -------------------------------------------------------
Route::middleware('auth')->prefix('me')->group(function () {
    Route::get('/', [ProfileController::class, 'show']);
    Route::patch('/', [ProfileController::class, 'update']);
    Route::put('password', [ProfileController::class, 'updatePassword']);
    Route::get('sessions', [ProfileController::class, 'sessions']);
    Route::delete('sessions/{id}', [ProfileController::class, 'revokeSession']);
    Route::get('login-activity', [ProfileController::class, 'loginActivity']);
    Route::get('organizations', [ProfileController::class, 'organizations']);
    Route::post('2fa/enable', [ProfileController::class, 'twoFactorEnable']);
    Route::post('2fa/confirm', [ProfileController::class, 'twoFactorConfirm']);
    Route::delete('2fa', [ProfileController::class, 'twoFactorDisable']);
});

// --- Organizations (verified users only) --------------------------------------
Route::middleware(['auth', 'verified.email'])->group(function () {
    Route::post('orgs', [OrganizationController::class, 'store']);
    Route::post('invitations/accept', [InvitationController::class, 'accept']);
    Route::get('roles', [RoleController::class, 'index']);

    // Everything below runs inside a tenant context (membership verified, RLS active).
    Route::prefix('orgs/{org}')->middleware('org')->group(function () {
        Route::get('/', [OrganizationController::class, 'show'])->middleware('can:org.view');
        Route::patch('/', [OrganizationController::class, 'update'])->middleware('can:org.update');
        Route::delete('/', [OrganizationController::class, 'destroy'])->middleware('can:org.delete');
        Route::post('leave', [OrganizationController::class, 'leave']);

        Route::get('members', [MemberController::class, 'index'])->middleware('can:members.view');
        Route::patch('members/{user}', [MemberController::class, 'update'])->middleware('can:members.manage');
        Route::delete('members/{user}', [MemberController::class, 'destroy'])->middleware('can:members.manage');
        Route::get('invitations', [InvitationController::class, 'index'])->middleware('can:members.view');
        Route::post('invitations', [InvitationController::class, 'store'])->middleware('can:members.manage');
        Route::delete('invitations/{invitation}', [InvitationController::class, 'destroy'])->middleware('can:members.manage');

        Route::get('audit-logs', [AuditLogController::class, 'index'])->middleware('can:audit.view');
        Route::get('integrations', [IntegrationController::class, 'index'])->middleware('can:integrations.view');

        Route::middleware('can:projects.view')->group(function () {
            Route::get('projects', [ProjectController::class, 'index']);
            Route::get('projects/{project}', [ProjectController::class, 'show']);
            Route::get('projects/{project}/dashboard/overview', [DashboardController::class, 'overview']);
            Route::get('projects/{project}/websites', [WebsiteController::class, 'index']);
            Route::get('projects/{project}/websites/{website}', [WebsiteController::class, 'show']);
        });
        Route::middleware('can:projects.manage')->group(function () {
            Route::post('projects', [ProjectController::class, 'store']);
            Route::patch('projects/{project}', [ProjectController::class, 'update']);
            Route::delete('projects/{project}', [ProjectController::class, 'destroy']);
            Route::post('projects/{project}/websites', [WebsiteController::class, 'store']);
            Route::patch('projects/{project}/websites/{website}', [WebsiteController::class, 'update']);
            Route::delete('projects/{project}/websites/{website}', [WebsiteController::class, 'destroy']);
        });
    });
});
