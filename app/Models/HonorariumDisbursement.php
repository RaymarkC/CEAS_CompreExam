<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HonorariumDisbursement extends Model
{
    protected $guarded = [];

    protected $casts = ['amount' => 'decimal:2', 'history' => 'array', 'requires_review' => 'boolean', 'disbursed_on' => 'date', 'claimed_on' => 'date', 'service_evidence' => 'array'];

    public function defenseRequest()
    {
        return $this->belongsTo(DefenseRequest::class);
    }
}
