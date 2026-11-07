<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Throwable;

class SystemStatusController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $database = false;
        $notifications = false;
        try {
            DB::select('select 1');
            $database = true;
            $notifications = Schema::hasTable('notifications');
        } catch (Throwable) {
            // Report a failed check without exposing connection details.
        }

        return response()->json(['checks' => [
            ['status' => $database ? 'success' : 'error', 'message' => $database ? 'Database query succeeded.' : 'Database check failed.'],
            ['status' => $request->user() ? 'success' : 'error', 'message' => $request->user() ? 'Your session is authenticated.' : 'Authentication required.'],
            ['status' => $notifications ? 'success' : 'error', 'message' => $notifications ? 'Notification storage is available. Delivery and background workers require separate verification.' : 'Notification storage is unavailable.'],
        ]]);
    }
}
