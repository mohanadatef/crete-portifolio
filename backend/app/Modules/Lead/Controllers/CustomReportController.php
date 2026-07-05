<?php

namespace App\Modules\Lead\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use App\Modules\Lead\Models\CustomReport;
use App\Modules\Lead\Models\Lead;
use App\Modules\Project\Models\Project;
use App\Modules\Page\Models\LandingPage;
use Exception;

class CustomReportController extends Controller
{
    public function index(): JsonResponse
    {
        $reports = CustomReport::where('user_id', auth()->id())->latest()->get();
        return response()->json([
            'status' => 'success',
            'data' => $reports
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'entity_type' => 'required|string|in:leads,projects,landing_pages',
            'config' => 'required|array',
            'config.columns' => 'required|array',
            'config.filters' => 'nullable|array',
            'config.group_by' => 'nullable|string',
            'config.chart_type' => 'required|string|in:table,bar,pie',
        ]);

        $report = CustomReport::create([
            'user_id' => auth()->id(),
            'name' => $request->name,
            'description' => $request->description,
            'entity_type' => $request->entity_type,
            'config' => $request->config,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Custom report created successfully.',
            'data' => $report
        ], 201);
    }

    public function show($id): JsonResponse
    {
        $report = CustomReport::where('user_id', auth()->id())->findOrFail($id);
        return response()->json([
            'status' => 'success',
            'data' => $report
        ]);
    }

    public function update(Request $request, $id): JsonResponse
    {
        $report = CustomReport::where('user_id', auth()->id())->findOrFail($id);

        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'entity_type' => 'required|string|in:leads,projects,landing_pages',
            'config' => 'required|array',
            'config.columns' => 'required|array',
            'config.filters' => 'nullable|array',
            'config.group_by' => 'nullable|string',
            'config.chart_type' => 'required|string|in:table,bar,pie',
        ]);

        $report->update([
            'name' => $request->name,
            'description' => $request->description,
            'entity_type' => $request->entity_type,
            'config' => $request->config,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Custom report updated successfully.',
            'data' => $report
        ]);
    }

    public function destroy($id): JsonResponse
    {
        $report = CustomReport::where('user_id', auth()->id())->findOrFail($id);
        $report->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Custom report deleted successfully.'
        ]);
    }

    public function run($id): JsonResponse
    {
        try {
            $report = CustomReport::where('user_id', auth()->id())->findOrFail($id);
            $entityType = $report->entity_type;
            $config = $report->config;

            // Set up base query
            if ($entityType === 'leads') {
                $query = Lead::query();
            } elseif ($entityType === 'projects') {
                $query = Project::query();
            } elseif ($entityType === 'landing_pages') {
                $query = LandingPage::query();
            } else {
                return response()->json(['status' => 'error', 'message' => 'Invalid entity type'], 400);
            }

            // Apply Filters
            $filters = $config['filters'] ?? [];
            
            // 1. Date filter (created_at)
            if (!empty($filters['date_from'])) {
                $query->where('created_at', '>=', $filters['date_from'] . ' 00:00:00');
            }
            if (!empty($filters['date_to'])) {
                $query->where('created_at', '<=', $filters['date_to'] . ' 23:59:59');
            }

            // 2. Status filter
            if (!empty($filters['status'])) {
                $statusVal = $filters['status'];
                if (is_array($statusVal)) {
                    $query->whereIn('status', $statusVal);
                } else {
                    $query->where('status', $statusVal);
                }
            }

            // 3. Source filter (leads only)
            if ($entityType === 'leads' && !empty($filters['source'])) {
                $sourceVal = $filters['source'];
                if (is_array($sourceVal)) {
                    $query->whereIn('source', $sourceVal);
                } else {
                    $query->where('source', $sourceVal);
                }
            }

            // 4. Assigned user filter (leads only)
            if ($entityType === 'leads' && !empty($filters['assigned_to'])) {
                $query->where('assigned_to', $filters['assigned_to']);
            }

            // 5. Location filter (projects only)
            if ($entityType === 'projects' && !empty($filters['location'])) {
                $query->where(function($q) use ($filters) {
                    $q->where('location', 'like', '%' . $filters['location'] . '%')
                      ->orWhere('location_ar', 'like', '%' . $filters['location'] . '%');
                });
            }

            // Apply Grouping / Aggregation (for chart views)
            $groupBy = $config['group_by'] ?? null;
            $allowedGroupBy = [
                'leads' => ['status', 'source', 'utm_source', 'utm_campaign', 'utm_medium', 'assigned_to'],
                'projects' => ['location', 'project_type_id'],
                'landing_pages' => ['slug']
            ];

            if ($groupBy && isset($allowedGroupBy[$entityType]) && in_array($groupBy, $allowedGroupBy[$entityType])) {
                // Return grouped counts
                $results = $query->select($groupBy, DB::raw('count(*) as count'))
                                 ->groupBy($groupBy)
                                 ->get();
            } else {
                // Return flat rows
                if ($entityType === 'leads') {
                    $query->with(['project:id,title_en,title_ar', 'landingPage:id,title', 'assignedTo:id,name']);
                }
                $results = $query->latest()->get();
            }

            return response()->json([
                'status' => 'success',
                'data' => [
                    'report' => $report,
                    'results' => $results
                ]
            ]);

        } catch (Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to run report: ' . $e->getMessage()
            ], 500);
        }
    }
}
