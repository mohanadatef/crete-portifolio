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
    }

    public function index(): JsonResponse
    {
        try {
            $leads = $this->leadService->getLeads(15);
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
            // Check if it's our 422 exception from recaptcha
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
}
