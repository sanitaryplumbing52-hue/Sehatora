<?php

namespace Tests\Unit;

use App\Domain\Projects\Support\WebsiteUrl;
use InvalidArgumentException;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

class WebsiteUrlTest extends TestCase
{
    #[DataProvider('valid')]
    public function test_normalises(string $input, string $origin, string $host): void
    {
        $url = WebsiteUrl::parse($input);
        $this->assertSame($origin, $url->origin());
        $this->assertSame($host, $url->host);
    }

    public static function valid(): array
    {
        return [
            'bare domain defaults to https' => ['example.com', 'https://example.com', 'example.com'],
            'case, path, query, fragment dropped' => ['HTTPS://WWW.Example.COM/Path?q=1#x', 'https://www.example.com', 'www.example.com'],
            'default port removed' => ['http://example.com:80/', 'http://example.com', 'example.com'],
            'custom port kept' => ['https://example.com:8443', 'https://example.com:8443', 'example.com'],
            'trailing dot removed' => ['https://example.com./', 'https://example.com', 'example.com'],
            'idn to punycode' => ['https://bücher.de', 'https://xn--bcher-kva.de', 'xn--bcher-kva.de'],
            'subdomain' => ['shop.example.co.uk', 'https://shop.example.co.uk', 'shop.example.co.uk'],
        ];
    }

    #[DataProvider('invalid')]
    public function test_rejects(string $input): void
    {
        $this->expectException(InvalidArgumentException::class);
        WebsiteUrl::parse($input);
    }

    public static function invalid(): array
    {
        return [
            'empty' => [''], 'spaces' => ['exa mple.com'], 'ftp' => ['ftp://example.com'],
            'ipv4' => ['http://192.168.0.1'], 'ipv6' => ['http://[::1]/'], 'localhost' => ['http://localhost:3000'],
            'single label' => ['intranet'], 'internal tld' => ['https://db.internal'], 'credentials' => ['https://user:pw@example.com'],
            'javascript' => ['javascript:alert(1)'], 'bad port' => ['https://example.com:99999'], 'underscore host' => ['https://ex_ample.com'],
        ];
    }
}
