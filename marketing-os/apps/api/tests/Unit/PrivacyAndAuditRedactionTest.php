<?php

namespace Tests\Unit;

use App\Domain\Audit\Audit;
use App\Support\IpAnonymizer;
use Tests\TestCase;

class PrivacyAndAuditRedactionTest extends TestCase
{
    public function test_ip_modes(): void
    {
        config(['marketing.privacy.ip_mode' => 'full']);
        $this->assertSame('203.0.113.77', IpAnonymizer::apply('203.0.113.77'));

        config(['marketing.privacy.ip_mode' => 'truncated']);
        $this->assertSame('203.0.113.0', IpAnonymizer::apply('203.0.113.77'));
        $this->assertSame('2001:db8:1::', IpAnonymizer::apply('2001:db8:1:2:3:4:5:6'));

        config(['marketing.privacy.ip_mode' => 'hashed']);
        $h = IpAnonymizer::apply('203.0.113.77');
        $this->assertSame(32, strlen($h));
        $this->assertSame($h, IpAnonymizer::apply('203.0.113.77'));
        $this->assertNotSame($h, IpAnonymizer::apply('203.0.113.78'));
        $this->assertNull(IpAnonymizer::apply(null));
    }

    public function test_audit_metadata_redacts_secrets_recursively(): void
    {
        $out = Audit::redact([
            'name' => 'Acme', 'password' => 'hunter2', 'nested' => ['access_token' => 'abc', 'ok' => 1],
            'recovery_codes' => ['a'], 'Authorization' => 'Bearer x', 'role' => 'admin',
        ]);
        $this->assertSame('Acme', $out['name']);
        $this->assertSame('admin', $out['role']);
        $this->assertSame('[redacted]', $out['password']);
        $this->assertSame('[redacted]', $out['nested']['access_token']);
        $this->assertSame(1, $out['nested']['ok']);
        $this->assertSame('[redacted]', $out['recovery_codes']);
        $this->assertSame('[redacted]', $out['Authorization']);
    }
}
