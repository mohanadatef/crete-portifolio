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
        $enabled = \App\Modules\Setting\Models\Setting::where('key', 'recaptcha_enabled')->value('value');
        if ($enabled !== '1') {
            return true;
        }

        $secretKey = \App\Modules\Setting\Models\Setting::where('key', 'recaptcha_secret_key')->value('value');
        if (!$secretKey) {
            $secretKey = config('services.recaptcha.secret');
        }
        
        $isProduction = config('app.env') === 'production';

        if ($isProduction && (!$secretKey || $secretKey === 'dummy_secret_key')) {
            throw new Exception('Recaptcha secret key not configured in production', 500);
        }

        if ($isProduction || ($token && $token !== 'dev_bypass_token')) {
            if (!$token) {
                throw new Exception('Failed spam check: Recaptcha token missing', 422);
            }

            $response = Http::asForm()->post('https://www.google.com/recaptcha/api/siteverify', [
                'secret' => $secretKey,
                'response' => $token,
            ])->json();
            
            if (!($response['success'] ?? false)) {
                throw new Exception('Failed spam check: Invalid token', 422);
            }

            if (isset($response['score']) && $response['score'] < 0.5) {
                throw new Exception('Failed spam check: Low score', 422);
            }

            return true;
        }

        return true;
    }
}
