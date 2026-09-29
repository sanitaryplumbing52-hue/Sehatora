<?php

declare(strict_types=1);

namespace App\Support;

use RuntimeException;

/** A business-rule failure with a stable machine code, rendered as problem-details. */
class DomainRuleViolation extends RuntimeException
{
    /** @param array<string, mixed> $extra */
    public function __construct(
        string $message,
        public readonly string $errorCode,
        public readonly int $status = 422,
        public readonly ?string $detail = null,
        public readonly array $extra = [],
    ) {
        parent::__construct($message);
    }
}
