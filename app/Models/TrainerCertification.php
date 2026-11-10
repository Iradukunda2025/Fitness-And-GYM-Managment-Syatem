<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TrainerCertification extends Model
{
    use HasFactory;

    protected $fillable = [
        'trainer_id',
        'title',
        'issuing_organization',
        'issue_date',
        'expiry_date',
        'document_path',
    ];

    public function trainer()
    {
        return $this->belongsTo(User::class, 'trainer_id');
    }
}
