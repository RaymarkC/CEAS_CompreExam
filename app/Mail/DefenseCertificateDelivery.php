<?php

namespace App\Mail;

use Illuminate\Mail\Mailable;

class DefenseCertificateDelivery extends Mailable
{
    public function __construct(public string $studentName, public string $stage, public string $pdfPath) {}

    public function build()
    {
        return $this->subject('Your defense certificate is available')->view('emails.defense-certificate')
            ->attachFromStorageDisk('local', $this->pdfPath, 'Defense-Certificate.pdf', ['mime' => 'application/pdf']);
    }
}
