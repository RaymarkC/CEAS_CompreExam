<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DefenseAcademicOutcome extends Model
{
    protected $guarded = [];

    protected $casts = ['completed_on' => 'date', 'history' => 'array', 'version' => 'integer'];
}
