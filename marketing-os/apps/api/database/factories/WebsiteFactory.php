<?php

namespace Database\Factories;

use App\Domain\Projects\Models\Website;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Website> */
class WebsiteFactory extends Factory
{
    protected $model = Website::class;

    public function definition(): array
    {
        return ['url' => 'https://'.fake()->unique()->domainName(), 'cms' => 'unknown'];
    }
}
