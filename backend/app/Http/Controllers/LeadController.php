<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Lead;
use Illuminate\Support\Facades\Mail;
use App\Mail\NewLeadNotification;
use Illuminate\Support\Facades\Http;

class LeadController extends Controller
{
    public function index()
    {
        return response()->json(Lead::latest()->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required',
            'email' => 'nullable|email',
            'phone' => 'required',
            'message' => 'nullable',
            'source' => 'nullable',
            'recaptcha_token' => 'nullable|string', // ReCAPTCHA token from frontend
        ]);

        // Real reCAPTCHA Verification
        if ($request->filled('recaptcha_token')) {
            $response = Http::asForm()->post('https://www.google.com/recaptcha/api/siteverify', [
                'secret' => config('services.recaptcha.secret', 'dummy_secret_key'),
                'response' => $request->recaptcha_token,
            ])->json();
            
            abort_if(!($response['success'] ?? false) || ($response['score'] ?? 0) < 0.5, 422, 'Failed spam check');
        }

        // Exclude recaptcha_token so Eloquent doesn't crash
        $data = collect($validated)->except('recaptcha_token')->all();
        $lead = Lead::create($data);

        // Dispatch Email Notification to Sales Team
        try {
            Mail::to('sales@crete.com')->send(new NewLeadNotification($lead));
        } catch (\Exception $e) {
            // Log email failure but don't fail the lead creation
            \Log::error('Failed to send lead email: ' . $e->getMessage());
        }

        return response()->json(['message' => 'Lead submitted successfully', 'lead' => $lead], 201);
    }

    public function show($id)
    {
        return response()->json(Lead::findOrFail($id));
    }

    public function destroy($id)
    {
        Lead::destroy($id);
        return response()->json(['message' => 'Deleted']);
    }
}
