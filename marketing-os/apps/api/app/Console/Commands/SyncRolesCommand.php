<?php

namespace App\Console\Commands;

use App\Domain\Billing\PlanCatalog;
use App\Domain\Tenancy\Support\RoleCatalog;
use Illuminate\Console\Command;

class SyncRolesCommand extends Command
{
    protected $signature = 'mios:sync-catalogs';

    protected $description = 'Sync system roles, permissions and plan entitlements from code/config into the database';

    public function handle(): int
    {
        (new RoleCatalog)->sync();
        (new PlanCatalog)->sync();
        $this->info('Roles, permissions and plans synced.');

        return self::SUCCESS;
    }
}
