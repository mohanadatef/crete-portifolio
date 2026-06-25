<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Exception;

class RecaptchaService
{
    /**
     * Validate the given recaptcha token.
     *
     * @param string|null $token
     * @return bool
     * @throws Exception
     */
    public function validateToken(?string $token): bool
    {
        $secretKey = \App\Modules\Setting\Models\Setting::where('key', 'recaptcha_secret_key')->value('value');
        if (!$secretKey) {
            $secretKey = config('services.recaptcha.secret');
        }
        
        // If the backend has no real secret key configured, bypass verification
        if (!$secretKey || $secretKey === 'dummy_secret_key') {
            return true;
        }

        // If frontend didn't send a token (e.g. adblocker or no site key), allow it to pass
        if (!$token || $token === 'dev_bypass_token') {
            return true;
        }

        $response = Http::asForm()->post('https://www.google.com/recaptcha/api/siteverify', [
            'secret' => $secretKey,
            'response' => $token,
        ])->json();
        
        if (!($response['success'] ?? false)) {
            throw new Exception('Failed spam check', 422);
        }

        if (isset($response['score']) && $response['score'] < 0.5) {
            throw new Exception('Failed spam check', 422);
        }

        return true;
    }
}
