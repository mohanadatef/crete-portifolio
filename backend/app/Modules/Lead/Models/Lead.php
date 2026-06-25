<?php

namespace App\Modules\Lead\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\User;
use App\Modules\Page\Models\LandingPage;
use App\Modules\Project\Models\Project;
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\Activitylog\LogOptions;

class Lead extends Model
{
    use HasFactory, SoftDeletes, LogsActivity;

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logAll()
            ->logOnlyDirty();
    }

    private static function configureMail($settings)
    {
        $mailHost = $settings->get('mail_host');
        $mailPort = $settings->get('mail_port');
        $mailUsername = $settings->get('mail_username');
        $mailPassword = $settings->get('mail_password');
        $mailEncryption = $settings->get('mail_encryption');
        $mailFromAddress = $settings->get('mail_from_address');
        $mailFromName = $settings->get('mail_from_name');

        if ($mailHost && $mailPort && $mailUsername && $mailPassword) {
            config([
                'mail.default' => 'smtp',
                'mail.mailers.smtp.transport' => 'smtp',
                'mail.mailers.smtp.host' => $mailHost,
                'mail.mailers.smtp.port' => (int)$mailPort,
                'mail.mailers.smtp.username' => $mailUsername,
                'mail.mailers.smtp.password' => $mailPassword,
                'mail.mailers.smtp.encryption' => $mailEncryption ?: null,
                'mail.from.address' => $mailFromAddress ?: 'noreply@crete.com',
                'mail.from.name' => $mailFromName ?: 'CRETE Developments',
            ]);

            // Clear resolved mailer instances to apply new config
            app()->make('mail.manager')->forgetMailers();
            return true;
        }
        return false;
    }

    protected static function booted()
    {
        // 1. Sent to notification inbox when a new lead is created
        static::created(function ($lead) {
            $settings = \App\Modules\Setting\Models\Setting::all()->pluck('value', 'key');
            
            // A. Alert the sales inbox
            try {
                $mailToAddress = $settings->get('mail_to_address');
                if ($mailToAddress && self::configureMail($settings)) {
                    \Illuminate\Support\Facades\Mail::to($mailToAddress)->send(new \App\Mail\NewLeadNotification($lead));
                } else {
                    \Illuminate\Support\Facades\Log::warning('New lead email notification skipped: SMTP or recipient configuration is missing.');
                }
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error('Failed to send lead notification email to inbox: ' . $e->getMessage());
            }

            // B. Auto-respond to the client/lead if email exists and enabled
            if ($lead->email && $settings->get('mail_client_enabled', '1') !== '0') {
                try {
                    $thankYouSubject = $settings->get('client_thank_you_subject');
                    $thankYouBody = $settings->get('client_thank_you_body');

                    if ($thankYouSubject && $thankYouBody && self::configureMail($settings)) {
                        $projectName = $lead->project ? $lead->project->title_en : 'our developments';
                        
                        $parsedSubject = str_replace(
                            ['{name}', '{project}'],
                            [$lead->name, $projectName],
                            $thankYouSubject
                        );

                        $parsedBody = str_replace(
                            ['{name}', '{project}'],
                            [$lead->name, $projectName],
                            $thankYouBody
                        );

                        \Illuminate\Support\Facades\Mail::to($lead->email)->send(
                            new \App\Mail\ClientThankYouNotification($parsedSubject, $parsedBody)
                        );
                    }
                } catch (\Exception $e) {
                    \Illuminate\Support\Facades\Log::error('Failed to send thank you auto-response email to client: ' . $e->getMessage());
                }
            }
        });

        // 2. Sent to assigned user when a lead is assigned (created or updated)
        static::saved(function ($lead) {
            $isAssigned = false;
            if ($lead->wasRecentlyCreated && $lead->assigned_to) {
                $isAssigned = true;
            } elseif ($lead->wasChanged('assigned_to') && $lead->assigned_to) {
                $isAssigned = true;
            }

            if ($isAssigned) {
                try {
                    $settings = \App\Modules\Setting\Models\Setting::all()->pluck('value', 'key');
                    if ($settings->get('mail_agent_enabled', '1') !== '0') {
                        $user = $lead->assignedTo;
                        if ($user && $user->email) {
                            if (self::configureMail($settings)) {
                                \Illuminate\Support\Facades\Mail::to($user->email)->send(new \App\Mail\LeadAssignedNotification($lead, $user));
                            }
                        }
                    }
                } catch (\Exception $e) {
                    \Illuminate\Support\Facades\Log::error('Failed to send lead assignment email: ' . $e->getMessage());
                }
            }
        });
    }
    
    protected $fillable = [
        'name',
        'email',
        'phone',
        'message',
        'project_id',
        'status',
        'assigned_to',
        'utm_source',
        'utm_medium',
        'utm_campaign',
        'utm_content',
        'landing_page_id',
        'form_data'
    ];

    protected $casts = [
        'form_data' => 'array'
    ];

    public function landingPage()
    {
        return $this->belongsTo(LandingPage::class);
    }

    public function project()
    {
        return $this->belongsTo(\App\Modules\Project\Models\Project::class);
    }

    public function assignedTo()
    {
        return $this->belongsTo(\App\Modules\User\Models\User::class, 'assigned_to');
    }
}
