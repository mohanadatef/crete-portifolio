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

        // Dummy ReCAPTCHA Verification (Replace with real secret key in production)
        if ($request->filled('recaptcha_token')) {
            $response = Http::asForm()->post('https://www.google.com/recaptcha/api/siteverify', [
                'secret' => env('RECAPTCHA_SECRET_KEY', 'dummy_secret_key'),
                'response' => $request->recaptcha_token,
            ]);
            
            // In a real scenario, you'd check $response->json()['success']
            // For now, we will just proceed.
        }

        $lead = Lead::create($validated);

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
