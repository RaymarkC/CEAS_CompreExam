<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DefenseCertificateRequest extends Model
{
    protected $guarded = [];

    protected $casts = ['released_at' => 'datetime', 'emailed_at' => 'datetime', 'history' => 'array', 'outcome_version' => 'integer'];

    public function defense()
    {
        return $this->belongsTo(DefenseRequest::class, 'defense_request_id');
    }
}
