<?php

namespace App\Services;

use App\Http\Controllers\Api\ComprehensiveExamEligibilityController;
use Illuminate\Http\Request;

class ComprehensiveEligibilityService
{
    public function check(Request $request): array
    {
        return app(ComprehensiveExamEligibilityController::class)->checkEligibility($request)->getData(true);
    }
}
