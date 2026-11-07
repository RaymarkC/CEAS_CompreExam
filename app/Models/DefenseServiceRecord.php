<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DefenseServiceRecord extends Model
{
    protected $guarded = [];

    protected $casts = ['participants' => 'array', 'history' => 'array', 'completed_on' => 'date', 'confirmed_at' => 'datetime'];
}
