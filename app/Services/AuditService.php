<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Http\Request;

class AuditService
{
    public static function log(
        ?int $userId,
        string $action,
        ?string $entityType = null,
        ?int $entityId = null,
        ?array $details = null
    ): AuditLog {
        return AuditLog::create([
            'user_id' => $userId,
            'action' => $action,
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'details' => $details,
            'ip_address' => request()?->ip(),
            'user_agent' => request()?->userAgent(),
        ]);
    }
}
