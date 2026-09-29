<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Projects;

use App\Domain\Analytics\OverviewService;
use App\Domain\Projects\Models\Project;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function overview(Request $request, Project $project, OverviewService $overview): JsonResponse
    {
        $org = $request->attributes->get('organization');
        $metrics = array_map(fn ($m) => $m->toArray(), $overview->metrics($project, $org->slug));

        return response()->json(['data' => [
            'project_id' => $project->id,
            'onboarding' => [
                ['key' => 'website', 'label' => 'Add a website', 'done' => $project->websites()->exists()],
                ['key' => 'google_search_console', 'label' => 'Connect Google Search Console', 'done' => false],
                ['key' => 'google_analytics_4', 'label' => 'Connect Google Analytics 4', 'done' => false],
                ['key' => 'google_ads', 'label' => 'Connect Google Ads', 'done' => false],
                ['key' => 'meta_ads', 'label' => 'Connect Meta Ads', 'done' => false],
            ],
            'metrics' => $metrics,
        ]]);
    }
}
