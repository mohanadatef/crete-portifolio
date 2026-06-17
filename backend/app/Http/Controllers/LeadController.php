<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Lead;
use Illuminate\Support\Facades\Mail;
use App\Mail\NewLeadNotification;
use Illuminate\Support\Facades\Http;
use OpenApi\Attributes as OA;

class LeadController extends Controller
{
    public function index()
    {
        return response()->json(Lead::latest()->paginate(15));
    }

    #[OA\Post(
        path: "/public/leads",
        summary: "Submit a new lead",
        tags: ["Public Leads"],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\MediaType(
                mediaType: "application/json",
                schema: new OA\Schema(
                    required: ["name", "phone", "recaptcha_token", "privacy_consent"],
                    properties: [
                        new OA\Property(property: "name", type: "string"),
                        new OA\Property(property: "email", type: "string"),
                        new OA\Property(property: "phone", type: "string"),
                        new OA\Property(property: "message", type: "string"),
                        new OA\Property(property: "project_id", type: "integer"),
                        new OA\Property(property: "recaptcha_token", type: "string"),
                        new OA\Property(property: "privacy_consent", type: "boolean"),
                        new OA\Property(property: "utm_source", type: "string"),
                        new OA\Property(property: "utm_medium", type: "string"),
                        new OA\Property(property: "utm_campaign", type: "string")
                    ]
                )
            )
        ),
        responses: [
            new OA\Response(response: 201, description: "Lead created successfully"),
            new OA\Response(response: 422, description: "Validation error or Spam check failed")
        ]
    )]
    public function store(\App\Http\Requests\StoreLeadRequest $request)
    {
        $validated = $request->validated();

        // Real reCAPTCHA Verification
        $response = Http::asForm()->post('https://www.google.com/recaptcha/api/siteverify', [
            'secret' => config('services.recaptcha.secret', 'dummy_secret_key'),
            'response' => $request->recaptcha_token,
        ])->json();
        
        abort_if(!($response['success'] ?? false) || ($response['score'] ?? 0) < 0.5, 422, 'Failed spam check');

        // Exclude recaptcha_token so Eloquent doesn't crash
        $data = collect($validated)->except('recaptcha_token')->all();
        $lead = Lead::create($data);

        // Dispatch Email Notification to Sales Team
        try {
            Mail::to(config('mail.sales_inbox', 'sales@crete.com'))->send(new NewLeadNotification($lead));
        } catch (\Exception $e) {
            // Log the error but don't fail the request
            \Log::error('Failed to send lead notification email: ' . $e->getMessage());
        }

        return response()->json([
            'message' => 'Lead created successfully',
            'lead' => $lead
        ], 201);
    }

    public function show($id)
    {
        return response()->json(Lead::findOrFail($id));
    }

    public function destroy(Request $request, $id)
    {
        // SEC-06b: Confirm before lead delete
        $request->validate(['confirm' => 'required|accepted']);
        
        Lead::findOrFail($id)->delete();
        return response()->json(['message' => 'Lead deleted successfully']);
    }
}
