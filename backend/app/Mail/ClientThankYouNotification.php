<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class ClientThankYouNotification extends Mailable
{
    use Queueable, SerializesModels;

    public $subjectStr;
    public $bodyStr;

    public function __construct(string $subjectStr, string $bodyStr)
    {
        $this->subjectStr = $subjectStr;
        $this->bodyStr = $bodyStr;
    }

    public function build()
    {
        return $this->subject($this->subjectStr)
                    ->view('emails.client_thank_you');
    }
}
