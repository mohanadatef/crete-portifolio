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
        $this->middleware('permission:view-landing-pages')->only(['index', 'show']);
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
            return $this->errorResponse($e->getMessage(), 500);
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
            $page = $this->pageService->getLandingPageBySlug($slug);
            
            // Build dynamic validation rules based on form_schema
            $schema = $page->form_schema ?? [];
            $rules = [];
            foreach ($schema as $field) {
                $fieldRules = [];
                if (!empty($field['required'])) {
                    $fieldRules[] = 'required';
                } else {
                    $fieldRules[] = 'nullable';
                }
                
                if ($field['type'] === 'email') {
                    $fieldRules[] = 'email';
                }
                
                $rules[$field['name']] = implode('|', $fieldRules);
            }
            
            $validatedData = $request->validate($rules);
            
            // Map standard fields if they exist, otherwise keep them in form_data
            $leadData = [
                'landing_page_id' => $page->id,
                'name' => $validatedData['name'] ?? null,
                'email' => $validatedData['email'] ?? null,
                'phone' => $validatedData['phone'] ?? null,
                'form_data' => $validatedData, // store everything in form_data just in case
                'project_id' => $page->project_id, // inherit project from landing page
            ];
            
            $lead = \App\Modules\Lead\Models\Lead::create($leadData);
            
            return $this->successResponse($lead, 'Form submitted successfully', 201);
            
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => 'Validation error', 'errors' => $e->errors()], 422);
        } catch (Exception $e) {
            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    public function store(StoreLandingPageRequest $request): JsonResponse
    {
        try {
            $dto = LandingPageDTO::fromRequest($request);
            $page = $this->pageService->createLandingPage($dto->data);
            return $this->successResponse(new LandingPageResource($page), 'Landing Page created successfully', 201);
        } catch (Exception $e) {
            return $this->errorResponse($e->getMessage(), 500);
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
            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    public function destroy(int $id): JsonResponse
    {
        try {
            $this->pageService->deleteLandingPage($id);
            return $this->successResponse(null, 'Landing Page deleted successfully');
        } catch (Exception $e) {
            return $this->errorResponse('Failed to delete landing page', 500);
        }
    }
}
