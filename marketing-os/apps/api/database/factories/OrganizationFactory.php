<?php

namespace Database\Factories;

use App\Domain\Identity\Models\User;
use App\Domain\Tenancy\Models\Organization;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Organization> */
class OrganizationFactory extends Factory
{
    protected $model = Organization::class;

    public function definition(): array
    {
        $name = fake()->unique()->company();

        return ['name' => $name, 'slug' => Organization::uniqueSlug($name), 'owner_id' => User::factory()];
    }
}
