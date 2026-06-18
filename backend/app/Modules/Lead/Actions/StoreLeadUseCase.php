<?php

namespace App\Modules\Lead\Actions;

use App\Modules\Lead\DTOs\LeadDTO;
use App\Modules\Lead\Services\LeadService;
use App\Services\RecaptchaService;
use Illuminate\Support\Facades\Mail;
use App\Mail\NewLeadNotification;
use App\Modules\Lead\Models\Lead;
use Exception;
use Illuminate\Support\Facades\Log;

class StoreLeadUseCase
{
    public function __construct(
        private readonly LeadService $leadService,
        private readonly RecaptchaService $recaptchaService
    ) {
    }

    /**
     * Executes lead creation flow: validates captcha, saves lead, sends email.
     *
     * @param LeadDTO $dto
     * @return Lead
     * @throws Exception
     */
    public function execute(LeadDTO $dto): Lead
    {
        $this->recaptchaService->validateToken($dto->recaptchaToken);

        $lead = $this->leadService->createLead($dto->data);

        try {
            Mail::to(config('mail.sales_inbox', 'sales@crete.com'))->send(new NewLeadNotification($lead));
        } catch (Exception $e) {
            Log::error('Failed to send lead notification email: ' . $e->getMessage());
        }

        return $lead;
    }
}
