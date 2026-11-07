<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

class DefenseCountdownReminder extends Mailable
{
    use Queueable;

    public function __construct(public string $firstName, public string $reminder) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Reminder about your upcoming defense');
    }

    public function content(): Content
    {
        return new Content(view: 'emails.defense-countdown-reminder');
    }
}
