<?php

return [
    /*
     * live: only real, connected data is ever shown.
     * demo: development-only fixtures. Booting production in demo mode is a fatal error.
     */
    'data_mode' => env('APP_DATA_MODE', 'live'),

    'frontend_url' => env('FRONTEND_URL', 'http://localhost:3000'),

    'privacy' => [
        // full | truncated | hashed — how IPs are stored in audit_logs and login_activities.
        'ip_mode' => env('PRIVACY_IP_MODE', 'truncated'),
    ],

    'health' => [
        // Bearer token required for the detailed health endpoint. Empty = detailed endpoint disabled.
        'token' => env('HEALTH_CHECK_TOKEN'),
    ],

    'invitations' => ['ttl_days' => 7],
];
