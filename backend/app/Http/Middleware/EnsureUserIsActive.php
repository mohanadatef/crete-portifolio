<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsActive
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user() && !$request->user()->is_active) {
            $request->user()->currentAccessToken()->delete();
            return response()->json([
                'success' => false,
                'message' => 'Your account is inactive.',
            ], 401);
        }

        return $next($request);
    }
}
