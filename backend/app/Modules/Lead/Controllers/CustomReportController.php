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
        $reports = CustomReport::where('user_id', auth()->id())
            ->orWhere('config->is_shared', true)
            ->orWhere('config->is_shared', 'true')
            ->latest()
            ->get();

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
            'config.is_shared' => 'nullable|boolean',
            'config.aggregation_function' => 'nullable|string|in:count,sum,avg',
            'config.aggregation_column' => 'nullable|string',
            'config.date_group_interval' => 'nullable|string|in:daily,weekly,monthly',
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
        $report = CustomReport::where(function($query) {
            $query->where('user_id', auth()->id())
                  ->orWhere('config->is_shared', true)
                  ->orWhere('config->is_shared', 'true');
        })->findOrFail($id);

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
            'config.is_shared' => 'nullable|boolean',
            'config.aggregation_function' => 'nullable|string|in:count,sum,avg',
            'config.aggregation_column' => 'nullable|string',
            'config.date_group_interval' => 'nullable|string|in:daily,weekly,monthly',
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
            $report = CustomReport::where(function($query) {
                $query->where('user_id', auth()->id())
                      ->orWhere('config->is_shared', true)
                      ->orWhere('config->is_shared', 'true');
            })->findOrFail($id);

            $entityType = $report->entity_type;
            $config = $report->config;

            $results = $this->executeQuery($entityType, $config);

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

    public function export($id)
    {
        try {
            $report = CustomReport::where(function($query) {
                $query->where('user_id', auth()->id())
                      ->orWhere('config->is_shared', true)
                      ->orWhere('config->is_shared', 'true');
            })->findOrFail($id);

            $entityType = $report->entity_type;
            $config = $report->config;
            $columns = $config['columns'] ?? [];

            // Execute raw list (without grouping) for full detailed CSV export
            $exportConfig = $config;
            $exportConfig['group_by'] = null; // force flat list

            $results = $this->executeQuery($entityType, $exportConfig);

            return response()->streamDownload(function() use ($results, $columns) {
                $file = fopen('php://output', 'w');
                // CSV header row
                fputcsv($file, array_map(function($col) {
                    return ucwords(str_replace('_', ' ', $col));
                }, $columns));

                // CSV data rows
                foreach ($results as $row) {
                    $line = [];
                    foreach ($columns as $col) {
                        if ($col === 'project_id') {
                            $line[] = $row->project?->title_en ?? 'None';
                        } elseif ($col === 'landing_page_id') {
                            $line[] = $row->landingPage?->title ?? 'None';
                        } elseif ($col === 'assigned_to') {
                            $line[] = $row->assignedTo?->name ?? 'Unassigned';
                        } else {
                            $line[] = $row->{$col} ?? '';
                        }
                    }
                    fputcsv($file, $line);
                }
                fclose($file);
            }, "custom_report_" . $id . ".csv", [
                'Content-Type' => 'text/csv',
                'Cache-Control' => 'no-cache, must-revalidate',
                'Expires' => '0',
            ]);

        } catch (Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to export report: ' . $e->getMessage()
            ], 500);
        }
    }

    private function executeQuery(string $entityType, array $config)
    {
        // Set up base query
        if ($entityType === 'leads') {
            $query = Lead::query();
        } elseif ($entityType === 'projects') {
            $query = Project::query();
        } elseif ($entityType === 'landing_pages') {
            $query = LandingPage::query();
        } else {
            throw new Exception("Invalid entity type");
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
            'leads' => ['status', 'source', 'utm_source', 'utm_campaign', 'utm_medium', 'assigned_to', 'created_at'],
            'projects' => ['location', 'project_type_id', 'created_at'],
            'landing_pages' => ['slug', 'created_at']
        ];

        if ($groupBy && isset($allowedGroupBy[$entityType]) && in_array($groupBy, $allowedGroupBy[$entityType])) {
            $aggFunc = $config['aggregation_function'] ?? 'count';
            $aggCol = $config['aggregation_column'] ?? '*';
            
            // Validate aggregates
            if (!in_array($aggFunc, ['count', 'sum', 'avg'])) {
                $aggFunc = 'count';
            }
            if (!in_array($aggCol, ['views_count', '*'])) {
                $aggCol = '*';
            }

            $selectRaw = $aggFunc === 'count' ? "count(*) as count" : "{$aggFunc}({$aggCol}) as count";

            if ($groupBy === 'created_at') {
                // Group by date interval
                $interval = $config['date_group_interval'] ?? 'daily';
                $driver = DB::connection()->getDriverName();
                
                if ($driver === 'sqlite') {
                    if ($interval === 'monthly') {
                        $dateSelect = "strftime('%Y-%m', created_at) as created_at_group";
                    } elseif ($interval === 'weekly') {
                        $dateSelect = "strftime('%Y-w%W', created_at) as created_at_group";
                    } else {
                        $dateSelect = "date(created_at) as created_at_group";
                    }
                } else {
                    if ($interval === 'monthly') {
                        $dateSelect = "DATE_FORMAT(created_at, '%Y-%m') as created_at_group";
                    } elseif ($interval === 'weekly') {
                        $dateSelect = "DATE_FORMAT(created_at, '%Y-w%u') as created_at_group";
                    } else {
                        $dateSelect = "DATE_FORMAT(created_at, '%Y-%m-%d') as created_at_group";
                    }
                }

                return $query->select(DB::raw($dateSelect), DB::raw($selectRaw))
                             ->groupBy('created_at_group')
                             ->orderBy('created_at_group')
                             ->get();
            } else {
                return $query->select($groupBy, DB::raw($selectRaw))
                             ->groupBy($groupBy)
                             ->orderByDesc('count')
                             ->get();
            }
        } else {
            // Return flat rows with relations
            if ($entityType === 'leads') {
                $query->with(['project:id,title_en,title_ar', 'landingPage:id,title', 'assignedTo:id,name']);
            }
            return $query->latest()->get();
        }
    }
}
