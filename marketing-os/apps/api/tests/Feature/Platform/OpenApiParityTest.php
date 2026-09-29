<?php

namespace Tests\Feature\Platform;

use Illuminate\Support\Facades\Route;
use Symfony\Component\Yaml\Yaml;
use Tests\TestCase;

/** Keeps packages/api-contract/openapi.yaml honest: every route documented, nothing documented that doesn't exist. */
class OpenApiParityTest extends TestCase
{
    private function spec(): array
    {
        return Yaml::parseFile(base_path('../../packages/api-contract/openapi.yaml'));
    }

    /** @return array<string, true> "METHOD /path" */
    private function routes(): array
    {
        $out = [];
        foreach (Route::getRoutes() as $route) {
            if (! str_starts_with($route->uri(), 'api/v1/')) {
                continue;
            }
            $path = substr($route->uri(), strlen('api/v1'));
            foreach ($route->methods() as $m) {
                if ($m !== 'HEAD') {
                    $out[strtolower($m).' '.$path] = true;
                }
            }
        }

        return $out;
    }

    public function test_every_route_is_documented_and_every_operation_exists(): void
    {
        $documented = [];
        foreach ($this->spec()['paths'] as $path => $ops) {
            foreach (array_keys($ops) as $method) {
                $documented[$method.' '.$path] = true;
            }
        }
        $routes = $this->routes();

        $this->assertSame([], array_keys(array_diff_key($routes, $documented)), 'routes missing from openapi.yaml');
        $this->assertSame([], array_keys(array_diff_key($documented, $routes)), 'openapi.yaml documents routes that do not exist');
    }

    public function test_operations_have_ids_tags_and_error_contracts(): void
    {
        $ids = [];
        foreach ($this->spec()['paths'] as $path => $ops) {
            foreach ($ops as $method => $op) {
                $this->assertNotEmpty($op['operationId'] ?? null, "$method $path needs operationId");
                $this->assertNotContains($op['operationId'], $ids, 'operationId must be unique');
                $ids[] = $op['operationId'];
                $this->assertNotEmpty($op['tags'] ?? null);
                if (str_starts_with($path, '/orgs/{org}')) {
                    $this->assertArrayHasKey('404', $op['responses'], "$method $path must document tenant 404");
                    $this->assertArrayHasKey('401', $op['responses']);
                }
            }
        }
    }

    public function test_every_schema_reference_resolves(): void
    {
        $raw = file_get_contents(base_path('../../packages/api-contract/openapi.yaml'));
        $spec = $this->spec();
        preg_match_all('~#/components/(\w+)/(\w+)~', $raw, $m, PREG_SET_ORDER);
        foreach ($m as [$full, $section, $name]) {
            $this->assertArrayHasKey($name, $spec['components'][$section], "dangling reference $full");
        }
    }
}
