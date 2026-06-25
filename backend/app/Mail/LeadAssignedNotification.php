<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class LeadAssignedNotification extends Mailable
{
    use Queueable, SerializesModels;

    public $lead;
    public $user;

    public function __construct($lead, $user)
    {
        $this->lead = $lead;
        $this->user = $user;
    }

    public function build()
    {
        return $this->subject('New Lead Assigned: ' . $this->lead->name)
                    ->view('emails.lead_assigned');
    }
}
