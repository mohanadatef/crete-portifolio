<?php

namespace App\Modules\Page\Controllers;

use App\Http\Controllers\Controller;

use Illuminate\Http\Request;

use Illuminate\Http\JsonResponse;
use App\Modules\Page\DTOs\LandingPageDTO;
use App\Modules\Page\Services\PageService;
use App\Modules\Page\Resources\LandingPageResource;
use App\Http\Requests\StoreLandingPageRequest;
use App\Http\Requests\UpdateLandingPageRequest;
use Exception;
use OpenApi\Attributes as OA;

class LandingPageController extends Controller
{
    public function __construct(private readonly PageService $pageService)
    {
        $this->middleware('permission:view-landing-pages')->only(['index', 'show', 'logs']);
        $this->middleware('permission:create-landing-pages')->only(['store']);
        $this->middleware('permission:edit-landing-pages')->only(['update']);
        $this->middleware('permission:delete-landing-pages')->only(['destroy']);
    }

    public function index(Request $request): JsonResponse
    {
        try {
            $filters = $request->only(['search', 'status', 'project_id']);
            $perPage = $request->input('per_page', 10);
            
            $pages = $this->pageService->getLandingPagesPaginator($filters, $perPage);
            return $this->successResponse(
                LandingPageResource::collection($pages)->response()->getData(true),
                'Landing Pages retrieved successfully'
            );
        } catch (Exception $e) {
            \Illuminate\Support\Facades\Log::error('LandingPageController@index: ' . $e->getMessage(), ['exception' => $e]);
            return $this->errorResponse('An internal server error occurred.', 500);
        }
    }

    #[OA\Get(
        path: "/public/landing-pages/{slug}",
        summary: "Get a specific landing page by slug",
        tags: ["Public Landing Pages"],
        parameters: [
            new OA\Parameter(name: "slug", in: "path", required: true, description: "Landing page slug", schema: new OA\Schema(type: "string"))
        ],
        responses: [
            new OA\Response(response: 200, description: "Successful operation"),
            new OA\Response(response: 404, description: "Landing Page not found")
        ]
    )]
    public function showPublic(string $slug): JsonResponse
    {
        try {
            $page = $this->pageService->getLandingPageBySlug($slug);
            return $this->successResponse(new LandingPageResource($page), 'Landing Page retrieved successfully');
        } catch (Exception $e) {
            return $this->errorResponse('Landing Page not found', 404);
        }
    }

    #[OA\Post(
        path: "/public/landing-pages/{slug}/submit",
        summary: "Submit a dynamic form for a landing page",
        tags: ["Public Landing Pages"],
        parameters: [
            new OA\Parameter(name: "slug", in: "path", required: true, description: "Landing page slug", schema: new OA\Schema(type: "string"))
        ],
        responses: [
            new OA\Response(response: 201, description: "Lead created successfully"),
            new OA\Response(response: 404, description: "Landing Page not found"),
            new OA\Response(response: 422, description: "Validation Error")
        ]
    )]
    public function submitForm(Request $request, string $slug): JsonResponse
    {
        try {
            $recaptchaToken = $request->input('recaptcha_token');
            app(\App\Services\RecaptchaService::class)->validateToken($recaptchaToken);

            $page = $this->pageService->getLandingPageBySlug($slug);
            
            // Build dynamic validation rules based on form_schema
            $schema = $page->form_schema;
            if (empty($schema) || !is_array($schema)) {
                return $this->errorResponse('Invalid or empty form schema configuration.', 422);
            }

            $rules = [
                'privacy_consent' => 'required|boolean|accepted',
                'name' => 'nullable|string|max:255',
                'email' => 'nullable|email|max:255',
                'phone' => 'nullable|string|max:50',
            ];
            foreach ($schema as $field) {
                if (!is_array($field) || !isset($field['name']) || !isset($field['type'])) {
                    continue;
                }
                
                $fieldRules = ['string'];
                
                if (!empty($field['required'])) {
                    $fieldRules[] = 'required';
                } else {
                    $fieldRules[] = 'nullable';
                }
                
                if ($field['type'] === 'email') {
                    $fieldRules[] = 'email';
                    $fieldRules[] = 'max:255';
                } elseif ($field['type'] === 'phone') {
                    $fieldRules[] = 'max:50';
                } elseif ($field['type'] === 'textarea') {
                    $fieldRules[] = 'max:2000';
                } else {
                    $fieldRules[] = 'max:255';
                }
                
                $rules[$field['name']] = implode('|', $fieldRules);
            }
            
            $validatedData = $request->validate($rules);
            
            // Find the dynamic field names for standard fields
            $emailField = null;
            $phoneField = null;
            $nameField = 'name'; // Default

            foreach ($schema as $field) {
                if (!is_array($field) || !isset($field['name']) || !isset($field['type'])) {
                    continue;
                }

                if ($field['type'] === 'email') {
                    $emailField = $field['name'];
                } elseif ($field['type'] === 'phone') {
                    $phoneField = $field['name'];
                } elseif ($field['type'] === 'text' && strtolower($field['label_en'] ?? '') === 'name') {
                    $nameField = $field['name'];
                }
            }

            // Map standard fields if they exist, otherwise keep them in form_data
            $leadData = [
                'landing_page_id' => $page->id,
                'name' => $validatedData[$nameField] ?? $validatedData['name'] ?? 'N/A',
                'email' => ($emailField && isset($validatedData[$emailField])) ? $validatedData[$emailField] : ($validatedData['email'] ?? null),
                'phone' => ($phoneField && isset($validatedData[$phoneField])) ? $validatedData[$phoneField] : ($validatedData['phone'] ?? 'N/A'),
                'form_data' => $validatedData, // store everything in form_data just in case
                'project_id' => $page->project_id, // inherit project from landing page
                'privacy_consent' => true,
                'privacy_consent_at' => now(),
            ];
            
            $lead = \App\Modules\Lead\Models\Lead::create($leadData);
            
            return $this->successResponse($lead, 'Form submitted successfully', 201);
            
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => 'Validation error', 'errors' => $e->errors()], 422);
        } catch (Exception $e) {
            \Illuminate\Support\Facades\Log::error('LandingPageController@submitForm: ' . $e->getMessage(), ['exception' => $e]);
            return $this->errorResponse('An internal server error occurred.', 500);
        }
    }

    public function store(StoreLandingPageRequest $request): JsonResponse
    {
        try {
            $dto = LandingPageDTO::fromRequest($request);
            $page = $this->pageService->createLandingPage($dto->data);
            return $this->successResponse(new LandingPageResource($page), 'Landing Page created successfully', 201);
        } catch (Exception $e) {
            \Illuminate\Support\Facades\Log::error('LandingPageController@store: ' . $e->getMessage(), ['exception' => $e]);
            return $this->errorResponse('An internal server error occurred.', 500);
        }
    }

    public function show(int $id): JsonResponse
    {
        try {
            $page = $this->pageService->getLandingPageById($id);
            return $this->successResponse(new LandingPageResource($page), 'Landing Page retrieved successfully');
        } catch (Exception $e) {
            return $this->errorResponse('Landing Page not found', 404);
        }
    }

    public function update(UpdateLandingPageRequest $request, int $id): JsonResponse
    {
        try {
            $dto = LandingPageDTO::fromRequest($request);
            $page = $this->pageService->updateLandingPage($id, $dto->data);
            return $this->successResponse(new LandingPageResource($page), 'Landing Page updated successfully');
        } catch (Exception $e) {
            \Illuminate\Support\Facades\Log::error('LandingPageController@update: ' . $e->getMessage(), ['exception' => $e]);
            return $this->errorResponse('An internal server error occurred.', 500);
        }
    }

    public function destroy(int $id): JsonResponse
    {
        try {
            $this->pageService->deleteLandingPage($id);
            return $this->successResponse(null, 'Landing Page deleted successfully');
        } catch (Exception $e) {
            \Illuminate\Support\Facades\Log::error('LandingPageController@destroy: ' . $e->getMessage(), ['exception' => $e]);
            return $this->errorResponse('Failed to delete landing page', 500);
        }
    }

    public function logs(int $id): JsonResponse
    {
        try {
            $page = $this->pageService->getLandingPageById($id);
            $logs = $page->activities()->with('causer')->latest()->get()->map(function ($log) {
                return [
                    'id' => $log->id,
                    'description' => $log->description,
                    'causer_name' => $log->causer ? $log->causer->name : 'System',
                    'properties' => $log->properties,
                    'created_at' => $log->created_at->format('Y-m-d H:i:s'),
                ];
            });
            return $this->successResponse($logs, 'Logs retrieved successfully');
        } catch (Exception $e) {
            return $this->errorResponse('Failed to retrieve logs', 500);
        }
    }
}
