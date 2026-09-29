<?php

declare(strict_types=1);

namespace App\Domain\Projects\Support;

use InvalidArgumentException;

/**
 * Normalised website origin. Accepts "example.com", "HTTP://Example.com:80/path?x#y"
 * etc. and yields scheme + punycode host (+ non-default port). Paths, queries
 * and fragments are dropped: a website is an origin, pages are crawled later.
 * IP literals, "localhost" and single-label hosts are rejected.
 */
final readonly class WebsiteUrl
{
    private function __construct(
        public string $scheme,
        public string $host,
        public ?int $port,
    ) {}

    public static function parse(string $input): self
    {
        $input = trim($input);
        if ($input === '' || preg_match('/[\s<>"\'\\\\]/', $input)) {
            throw new InvalidArgumentException('The URL is not valid.');
        }
        if (! preg_match('#^[a-z][a-z0-9+.-]*://#i', $input)) {
            $input = 'https://'.$input;
        }

        $parts = parse_url($input);
        if ($parts === false || empty($parts['host']) || isset($parts['user']) || isset($parts['pass'])) {
            throw new InvalidArgumentException('The URL is not valid.');
        }

        $scheme = strtolower($parts['scheme'] ?? 'https');
        if (! in_array($scheme, ['http', 'https'], true)) {
            throw new InvalidArgumentException('Only http and https URLs are supported.');
        }

        $host = strtolower(rtrim($parts['host'], '.'));
        if (filter_var(trim($host, '[]'), FILTER_VALIDATE_IP) !== false) {
            throw new InvalidArgumentException('Use a domain name, not an IP address.');
        }
        $ascii = idn_to_ascii($host, IDNA_DEFAULT, INTL_IDNA_VARIANT_UTS46);
        if ($ascii === false || $ascii === '') {
            throw new InvalidArgumentException('The domain name is not valid.');
        }
        $host = $ascii;

        if (! str_contains($host, '.') || $host === 'localhost' || str_ends_with($host, '.localhost')
            || str_ends_with($host, '.local') || str_ends_with($host, '.internal')
            || ! preg_match('/^(?=.{1,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9-]{2,63}$/', $host)) {
            throw new InvalidArgumentException('The domain name is not valid.');
        }

        $port = $parts['port'] ?? null;
        if ($port !== null && ($port < 1 || $port > 65535)) {
            throw new InvalidArgumentException('The port is not valid.');
        }
        if (($scheme === 'http' && $port === 80) || ($scheme === 'https' && $port === 443)) {
            $port = null;
        }

        return new self($scheme, $host, $port);
    }

    public function origin(): string
    {
        return $this->scheme.'://'.$this->host.($this->port ? ':'.$this->port : '');
    }
}
