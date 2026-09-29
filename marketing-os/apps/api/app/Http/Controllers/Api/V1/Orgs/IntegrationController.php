<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Orgs;

use App\Domain\Integrations\ProviderCatalog;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

class IntegrationController extends Controller
{
    public function index(ProviderCatalog $catalog): JsonResponse
    {
        return response()->json(['data' => $catalog->all()]);
    }
}
