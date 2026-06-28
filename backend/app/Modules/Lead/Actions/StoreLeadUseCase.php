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

        $data = $dto->data;
        $standardKeys = [
            'name', 'email', 'phone', 'message', 'project_id', 'status', 
            'assigned_to', 'utm_source', 'utm_medium', 'utm_campaign', 
            'utm_content', 'landing_page_id'
        ];

        $customFields = array_diff_key($data, array_flip($standardKeys));
        if (!empty($customFields)) {
            $data['form_data'] = array_merge(
                is_array($data['form_data'] ?? null) ? $data['form_data'] : [],
                $customFields
            );
            foreach ($customFields as $key => $val) {
                unset($data[$key]);
            }
        }

        $lead = $this->leadService->createLead($data);

        return $lead;
    }
}
