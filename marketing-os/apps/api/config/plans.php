<?php

/*
 * Plan entitlements. Numbers below are PLACEHOLDER product decisions for Phase 1
 * (only the Free plan is assignable until billing ships in Phase 10). Feature
 * checks in code must go through App\Domain\Billing\Entitlements — never compare
 * plan keys directly.
 *
 * Values: bool = feature flag; int = limit; 'unlimited' = no limit.
 */
return [
    'default' => 'free',
    'plans' => [
        'free' => ['name' => 'Free', 'features' => [
            'projects.max' => 3, 'websites.per_project.max' => 3, 'members.max' => 3,
        ]],
        'starter' => ['name' => 'Starter', 'features' => [
            'projects.max' => 10, 'websites.per_project.max' => 5, 'members.max' => 5,
        ]],
        'professional' => ['name' => 'Professional', 'features' => [
            'projects.max' => 30, 'websites.per_project.max' => 10, 'members.max' => 15,
        ]],
        'agency' => ['name' => 'Agency', 'features' => [
            'projects.max' => 150, 'websites.per_project.max' => 25, 'members.max' => 50,
        ]],
        'enterprise' => ['name' => 'Enterprise', 'features' => [
            'projects.max' => 'unlimited', 'websites.per_project.max' => 'unlimited', 'members.max' => 'unlimited',
        ]],
    ],
];
