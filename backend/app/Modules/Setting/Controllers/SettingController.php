<?php

namespace App\Modules\Setting\Controllers;

use App\Http\Controllers\Controller;

use Illuminate\Http\Request;

use Illuminate\Http\JsonResponse;
use App\Modules\Setting\DTOs\SettingDTO;
use App\Modules\Setting\Services\SettingService;
use App\Modules\Setting\Resources\SettingResource;
use App\Http\Requests\StoreSettingRequest;
use App\Http\Requests\UpdateSettingRequest;
use App\Http\Requests\BulkUpdateSettingRequest;
use Exception;
use OpenApi\Attributes as OA;

class SettingController extends Controller
{
    public function __construct(private readonly SettingService $settingService)
    {
        $this->middleware('permission:view-settings')->only(['index', 'show']);
        $this->middleware('permission:edit-settings')->only(['store', 'update', 'updateBulk']);
    }

    public function index(): JsonResponse
    {
        try {
            $settings = $this->settingService->getAllSettings();
            return $this->successResponse(
                SettingResource::collection($settings),
                'Settings retrieved successfully'
            );
        } catch (Exception $e) {
            \Illuminate\Support\Facades\Log::error('SettingController@index: ' . $e->getMessage(), ['exception' => $e]);
            return $this->errorResponse('An internal server error occurred.', 500);
        }
    }

    #[OA\Get(
        path: "/public/settings",
        summary: "Get public website settings",
        tags: ["Public Settings"],
        responses: [
            new OA\Response(response: 200, description: "Successful operation")
        ]
    )]
    public function indexPublic(): JsonResponse
    {
        try {
            $ipAddress = request()->ip();
            \App\Modules\Lead\Models\UniqueView::logView($ipAddress, 'Website');

            $settings = $this->settingService->getSettingsMap();
            return $this->successResponse($settings, 'Settings retrieved successfully');
        } catch (Exception $e) {
            \Illuminate\Support\Facades\Log::error('SettingController@indexPublic: ' . $e->getMessage(), ['exception' => $e]);
            return $this->errorResponse('An internal server error occurred.', 500);
        }
    }

    public function store(StoreSettingRequest $request): JsonResponse
    {
        try {
            $dto = SettingDTO::fromRequest($request);
            $setting = $this->settingService->createSetting($dto->data);
            return $this->successResponse(new SettingResource($setting), 'Setting created successfully', 201);
        } catch (Exception $e) {
            \Illuminate\Support\Facades\Log::error('SettingController@store: ' . $e->getMessage(), ['exception' => $e]);
            return $this->errorResponse('An internal server error occurred.', 500);
        }
    }

    public function updateBulk(BulkUpdateSettingRequest $request): JsonResponse
    {
        try {
            $this->settingService->updateBulkSettings($request->all());
            return $this->successResponse(null, 'Settings updated successfully');
        } catch (Exception $e) {
            \Illuminate\Support\Facades\Log::error('SettingController@updateBulk: ' . $e->getMessage(), ['exception' => $e]);
            return $this->errorResponse('An internal server error occurred.', 500);
        }
    }

    public function show(int $id): JsonResponse
    {
        try {
            $setting = $this->settingService->getSettingById($id);
            return $this->successResponse(new SettingResource($setting), 'Setting retrieved successfully');
        } catch (Exception $e) {
            return $this->errorResponse('Setting not found', 404);
        }
    }

    public function update(UpdateSettingRequest $request, int $id): JsonResponse
    {
        try {
            $dto = SettingDTO::fromRequest($request);
            $setting = $this->settingService->updateSetting($id, $dto->data);
            return $this->successResponse(new SettingResource($setting), 'Setting updated successfully');
        } catch (Exception $e) {
            \Illuminate\Support\Facades\Log::error('SettingController@update: ' . $e->getMessage(), ['exception' => $e]);
            return $this->errorResponse('An internal server error occurred.', 500);
        }
    }

    public function destroy(int $id): JsonResponse
    {
        try {
            $this->settingService->deleteSetting($id);
            return $this->successResponse(null, 'Setting deleted successfully');
        } catch (Exception $e) {
            return $this->errorResponse('Failed to delete setting', 500);
        }
    }
}
