<?php

namespace App\Providers;

use App\Domain\Identity\Models\User;
use App\Domain\Tenancy\Services\PermissionChecker;
use App\Domain\Tenancy\Services\TenantContext;
use App\Domain\Tenancy\Support\RoleCatalog;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        // One tenant context per app instance; cleared by ResolveOrganization after each request.
        $this->app->singleton(TenantContext::class);
    }

    public function boot(): void
    {
        $this->guardDataMode();

        ResetPassword::createUrlUsing(fn ($user, string $token) => rtrim(config('marketing.frontend_url'), '/')
            .'/reset-password?token='.$token.'&email='.urlencode($user->getEmailForPasswordReset()));

        // Permission keys double as Gate abilities: `can:projects.manage` middleware, Gate::allows(...).
        foreach (array_keys(RoleCatalog::PERMISSIONS) as $permission) {
            Gate::define($permission, function (User $user) use ($permission): bool {
                $org = app(TenantContext::class)->organization();

                return $org !== null && app(PermissionChecker::class)->can($user, $org, $permission);
            });
        }

        RateLimiter::for('api', fn (Request $r) => Limit::perMinute(240)->by($r->user()?->id ?: $r->ip()));
        RateLimiter::for('auth', fn (Request $r) => Limit::perMinute(10)->by($r->ip()));
    }

    /** Production must never silently run on demo data. */
    private function guardDataMode(): void
    {
        $mode = config('marketing.data_mode');
        if (! in_array($mode, ['live', 'demo'], true)) {
            throw new \RuntimeException("APP_DATA_MODE must be 'live' or 'demo', got '{$mode}'.");
        }
        if ($mode === 'demo' && $this->app->environment('production')) {
            throw new \RuntimeException('APP_DATA_MODE=demo is not allowed in production.');
        }
    }
}
