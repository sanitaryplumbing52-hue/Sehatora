<?php

declare(strict_types=1);

namespace App\Domain\Analytics;

/** The closed vocabulary for "why is there (no) number here". Never substitute a fabricated value. */
enum DataStatus: string
{
    case Ok = 'ok';
    case NotConnected = 'not_connected';
    case Unavailable = 'unavailable';          // the provider does not supply this
    case InsufficientData = 'insufficient_data';
    case Stale = 'stale';
    case Error = 'error';
    case NoData = 'no_data';                   // connected, zero rows
}
