<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @param  string  ...$roles
     */
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        if ($user->status !== 'active') {
            return response()->json([
                'message' => 'Your account is ' . $user->status . '. Please contact gym administration.'
            ], 403);
        }

        if (!empty($roles) && !in_array($user->role, $roles)) {
            return response()->json(['message' => 'Forbidden: You do not have permission to access this resource.'], 403);
        }

        return $next($request);
    }
}
