<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class PasswordResetMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public string $token, public string $email)
    {
    }

    public function build()
    {
        return $this->subject('Reset Your Admin Password')
                    ->html('
                        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                            <h2 style="color: #1e3678;">CRETE Developments</h2>
                            <p>You are receiving this email because we received a password reset request for your account.</p>
                            <p>Please use the following token to reset your password:</p>
                            <div style="background: #f4f4f4; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #c89f45; border-radius: 5px; margin: 20px 0;">
                                ' . $this->token . '
                            </div>
                            <p>This password reset token will expire in 60 minutes.</p>
                            <p>If you did not request a password reset, no further action is required.</p>
                            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                            <p style="font-size: 12px; color: #888;">CRETE Developments - Real Estate Leadership.</p>
                        </div>
                    ');
    }
}
