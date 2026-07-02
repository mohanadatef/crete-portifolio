<?php

namespace App\Modules\Feature\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Feature\DTOs\FeatureDTO;
use App\Modules\Feature\Requests\StoreFeatureRequest;
use App\Modules\Feature\Requests\UpdateFeatureRequest;
use App\Modules\Feature\Resources\FeatureResource;
use App\Modules\Feature\Services\FeatureService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

use App\Modules\Feature\Models\Feature;

class FeatureController extends Controller
{
    public function __construct(private readonly FeatureService $featureService)
    {
        $this->middleware('permission:view-features')->only(['index', 'show']);
        $this->middleware('permission:create-features')->only(['store']);
        $this->middleware('permission:edit-features')->only(['update']);
        $this->middleware('permission:delete-features')->only(['destroy']);
    }

    public function index(Request $request): JsonResponse
    {
        $features = $this->featureService->getFeatures(
            $request->input('per_page', 10),
            $request->input('search'),
            $request->input('status')
        );

        return response()->json([
            'status' => 'success',
            'data' => FeatureResource::collection($features)->response()->getData(true)
        ]);
    }

    public function active(): JsonResponse
    {
        $features = $this->featureService->getActiveFeatures();
        return response()->json([
            'status' => 'success',
            'data' => FeatureResource::collection($features)
        ]);
    }

    public function store(StoreFeatureRequest $request): JsonResponse
    {
        $dto = FeatureDTO::fromRequest($request->validated());
        $feature = $this->featureService->createFeature($dto->data);

        return response()->json([
            'status' => 'success',
            'message' => 'Feature created successfully',
            'data' => new FeatureResource($feature)
        ], 201);
    }

    public function show(Feature $feature): JsonResponse
    {
        return response()->json([
            'status' => 'success',
            'data' => new FeatureResource($feature)
        ]);
    }

    public function update(UpdateFeatureRequest $request, Feature $feature): JsonResponse
    {
        $dto = FeatureDTO::fromRequest($request->validated());
        $feature = $this->featureService->updateFeature($feature, $dto->data);

        return response()->json([
            'status' => 'success',
            'message' => 'Feature updated successfully',
            'data' => new FeatureResource($feature)
        ]);
    }

    public function destroy(Feature $feature): JsonResponse
    {
        try {
            $this->featureService->deleteFeature($feature);
            return response()->json([
                'status' => 'success',
                'message' => 'Feature deleted successfully'
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('FeatureController@destroy: ' . $e->getMessage(), ['exception' => $e]);
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to delete feature.'
            ], 500);
        }
    }
}
