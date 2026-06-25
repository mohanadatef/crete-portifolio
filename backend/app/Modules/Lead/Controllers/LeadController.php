<?php

namespace App\Modules\Lead\Controllers;

use App\Http\Controllers\Controller;

use Illuminate\Http\Request;

use Illuminate\Http\JsonResponse;
use App\Modules\Lead\DTOs\LeadDTO;
use App\Modules\Lead\Services\LeadService;
use App\Modules\Lead\Actions\StoreLeadUseCase;
use App\Modules\Lead\Resources\LeadResource;
use App\Http\Requests\StoreLeadRequest;
use Exception;
use OpenApi\Attributes as OA;

class LeadController extends Controller
{
    public function __construct(private readonly LeadService $leadService)
    {
        $this->middleware('permission:view-leads')->only(['index', 'show']);
        $this->middleware('permission:edit-leads')->only(['update']);
        $this->middleware('permission:delete-leads')->only(['destroy']);
    }

    public function index(Request $request): JsonResponse
    {
        try {
            $filters = $request->only(['search', 'status', 'assigned_to', 'landing_page_id', 'project_id', 'source']);
            $leads = $this->leadService->getLeads(15, $filters);
            return $this->successResponse(
                LeadResource::collection($leads)->response()->getData(true),
                'Leads retrieved successfully'
            );
        } catch (Exception $e) {
            return $this->errorResponse($e->getMessage(), 500);
        }
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
    public function store(StoreLeadRequest $request, StoreLeadUseCase $useCase): JsonResponse
    {
        try {
            $dto = LeadDTO::fromRequest($request);
            $lead = $useCase->execute($dto);

            return $this->successResponse(new LeadResource($lead), 'Lead created successfully', 201);
        } catch (Exception $e) {
            $code = $e->getCode() === 422 ? 422 : 500;
            return $this->errorResponse($e->getMessage(), $code);
        }
    }

    public function show(int $id): JsonResponse
    {
        try {
            $lead = $this->leadService->getLeadById($id);
            return $this->successResponse(new LeadResource($lead), 'Lead retrieved successfully');
        } catch (Exception $e) {
            return $this->errorResponse('Lead not found', 404);
        }
    }

    public function update(\App\Http\Requests\UpdateLeadRequest $request, int $id): JsonResponse
    {
        try {
            $lead = $this->leadService->updateLead($id, $request->validated());
            return $this->successResponse(new LeadResource($lead), 'Lead updated successfully');
        } catch (Exception $e) {
            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    public function export(Request $request)
    {
        abort_unless(auth()->user()?->can('export-leads'), 403, 'You do not have permission to export leads.');
        try {
            $filters = $request->only(['search', 'status', 'assigned_to', 'landing_page_id', 'project_id', 'source']);
            
            // We use streamDownload with a callback to fetch in chunks
            $callback = function() use ($filters) {
                $file = fopen('php://output', 'w');
                // UTF-8 BOM for Arabic support in Excel
                fputs($file, $bom =(chr(0xEF) . chr(0xBB) . chr(0xBF)));
                
                $csvHeader = ['ID', 'Date', 'Name', 'Email', 'Phone', 'Project', 'Landing Page', 'Status', 'Assigned To'];
                fputcsv($file, $csvHeader);

                // Build query identical to what getLeads uses
                $query = \App\Modules\Lead\Models\Lead::with(['landingPage', 'project', 'assignedTo'])->latest();
                
                // Enforce permissions (same logic as LeadService)
                $user = auth()->user();
                if (!$user->can('view-all-leads')) {
                    $query->where(function ($q) use ($user) {
                        $q->where('assigned_to', $user->id);
                        if ($user->can('view-unassigned-leads')) {
                            $q->orWhereNull('assigned_to');
                        }
                    });
                }

                // Apply filters
                if (!empty($filters['search'])) {
                    $search = $filters['search'];
                    $query->where(function($q) use ($search) {
                        $q->where('name', 'like', "%{$search}%")
                          ->orWhere('email', 'like', "%{$search}%")
                          ->orWhere('phone', 'like', "%{$search}%")
                          ->orWhere('form_data', 'like', "%{$search}%");
                    });
                }
                if (!empty($filters['status'])) {
                    $query->where('status', $filters['status']);
                }
                if (!empty($filters['assigned_to'])) {
                    $query->where('assigned_to', $filters['assigned_to']);
                }
                if (!empty($filters['landing_page_id'])) {
                    if ($filters['landing_page_id'] === 'general') {
                        $query->whereNull('landing_page_id');
                    } else {
                        $query->where('landing_page_id', $filters['landing_page_id']);
                    }
                }
                if (!empty($filters['project_id'])) {
                    if ($filters['project_id'] === 'general') {
                        $query->whereNull('project_id');
                    } else {
                        $query->where('project_id', $filters['project_id']);
                    }
                }

                // Process in chunks of 500
                $query->chunk(500, function($leads) use ($file) {
                    foreach ($leads as $lead) {
                        $email = $lead->email;
                        $phone = $lead->phone;
                        if (!$email && is_array($lead->form_data)) {
                            foreach ($lead->form_data as $val) {
                                if (is_string($val) && str_contains($val, '@')) $email = $val;
                            }
                        }
                        if ((!$phone || $phone === 'N/A') && is_array($lead->form_data)) {
                            foreach ($lead->form_data as $val) {
                                if (is_string($val) && preg_match('/^[0-9+\-\s()]{8,}$/', $val)) $phone = $val;
                            }
                        }

                        fputcsv($file, [
                            $lead->id,
                            $lead->created_at->format('Y-m-d H:i:s'),
                            $lead->name,
                            $email ?? 'N/A',
                            $phone ?? 'N/A',
                            $lead->project->title_en ?? $lead->project->title_ar ?? 'General',
                            $lead->landingPage->title_en ?? $lead->landingPage->title_ar ?? 'General',
                            $lead->status,
                            $lead->assignedTo->name ?? 'Unassigned'
                        ]);
                    }
                });
                
                fclose($file);
            };

            return response()->streamDownload($callback, 'leads.csv', [
                'Content-Type' => 'text/csv; charset=UTF-8',
                'Cache-Control' => 'no-cache, no-store, must-revalidate',
            ]);
        } catch (Exception $e) {
            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $request->validate(['confirm' => 'required|accepted']);

        try {
            $this->leadService->deleteLead($id);
            return $this->successResponse(null, 'Lead deleted successfully');
        } catch (Exception $e) {
            return $this->errorResponse('Failed to delete lead', 500);
        }
    }

    public function logs(int $id): JsonResponse
    {
        try {
            $lead = \App\Modules\Lead\Models\Lead::findOrFail($id);
            $logs = $lead->activities()->with('causer')->latest()->get();
            
            $formattedLogs = $logs->map(function ($log) {
                return [
                    'id' => $log->id,
                    'description' => $log->description,
                    'causer_name' => $log->causer->name ?? 'System',
                    'properties' => $log->properties,
                    'created_at' => $log->created_at->format('Y-m-d H:i:s'),
                ];
            });

            return $this->successResponse($formattedLogs, 'Logs retrieved successfully');
        } catch (Exception $e) {
            return $this->errorResponse($e->getMessage(), 500);
        }
    }
}
