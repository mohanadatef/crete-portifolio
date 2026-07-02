<?php

namespace App\Modules\Lead\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Modules\Lead\Models\Lead;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

use App\Traits\ApiResponseTrait;
use Illuminate\Support\Facades\Log;
use Exception;

class DashboardController extends Controller
{
    use ApiResponseTrait;

    public function index(Request $request): JsonResponse
    {
      try {
        $projectId = $request->query('project_id');
        $landingPageId = $request->query('landing_page_id');
        $range = $request->query('range', 'week'); // today, yesterday, week, month, custom
        $startDateParam = $request->query('start_date');
        $endDateParam = $request->query('end_date');

        $user = auth()->user();
        $applyScope = function ($query) use ($user) {
            if ($user && !$user->can('view-all-leads')) {
                $query->where(function ($q) use ($user) {
                    $q->where('assigned_to', $user->id);
                    if ($user->can('view-unassigned-leads')) {
                        $q->orWhereNull('assigned_to');
                    }
                });
            }
            return $query;
        };

        // Base query for leads today
        $todayQuery = $applyScope(Lead::whereDate('created_at', Carbon::today()));
        // Base query for leads yesterday
        $yesterdayQuery = $applyScope(Lead::whereDate('created_at', Carbon::yesterday()));

        // Apply filters to today/yesterday queries
        if ($projectId) {
            $todayQuery->where('project_id', $projectId);
            $yesterdayQuery->where('project_id', $projectId);
        }
        if ($landingPageId) {
            $todayQuery->where('landing_page_id', $landingPageId);
            $yesterdayQuery->where('landing_page_id', $landingPageId);
        }

        $leadsToday = $todayQuery->count();
        $leadsYesterday = $yesterdayQuery->count();

        // Calculate date range for the chart
        $startDate = Carbon::today()->subDays(6); // Default 7 days including today
        $endDate = Carbon::today();

        if ($range === 'today') {
            $startDate = Carbon::today();
            $endDate = Carbon::today();
        } elseif ($range === 'yesterday') {
            $startDate = Carbon::yesterday();
            $endDate = Carbon::yesterday();
        } elseif ($range === 'week') {
            $startDate = Carbon::today()->subDays(6);
            $endDate = Carbon::today();
        } elseif ($range === 'month') {
            $startDate = Carbon::today()->subDays(29);
            $endDate = Carbon::today();
        } elseif ($range === 'custom') {
            if ($startDateParam) {
                try { $startDate = Carbon::parse($startDateParam); } catch (\Throwable $t) { /* keep default */ }
            }
            if ($endDateParam) {
                try { $endDate = Carbon::parse($endDateParam); } catch (\Throwable $t) { /* keep default */ }
            }
        }

        // Fetch chart data: group by date and count
        $chartQuery = $applyScope(Lead::query())
            ->select(DB::raw('DATE(created_at) as date'), DB::raw('count(*) as count'))
            ->whereBetween('created_at', [$startDate->startOfDay(), $endDate->endOfDay()]);

        if ($projectId) {
            $chartQuery->where('project_id', $projectId);
        }
        if ($landingPageId) {
            $chartQuery->where('landing_page_id', $landingPageId);
        }

        $chartRawData = $chartQuery->groupBy(DB::raw('DATE(created_at)'))
            ->orderBy('date', 'asc')
            ->get()
            ->pluck('count', 'date');

        // Fill in missing dates with 0 to make a complete chart
        $chartData = [];
        $tempDate = $startDate->clone();
        while ($tempDate->lte($endDate)) {
            $formattedDate = $tempDate->format('Y-m-d');
            $chartData[] = [
                'date' => $formattedDate,
                'count' => $chartRawData[$formattedDate] ?? 0
            ];
            $tempDate->addDay();
        }

        return $this->successResponse([
            'leads_today' => $leadsToday,
            'leads_yesterday' => $leadsYesterday,
            'leads_total' => $applyScope(Lead::query())->count(),
            'website_visits' => \App\Modules\Lead\Models\UniqueView::where('viewable_type', 'Website')->count(),
            'projects_count' => \App\Modules\Project\Models\Project::count(),
            'pages_count' => \App\Modules\Page\Models\Page::count(),
            'landing_pages_count' => \App\Modules\Page\Models\LandingPage::count(),
            'blog_posts_count' => \App\Modules\Blog\Models\BlogPost::count(),
            'chart_data' => $chartData
        ], 'Dashboard statistics retrieved successfully');
      } catch (Exception $e) {
            Log::error('DashboardController@index: ' . $e->getMessage(), ['exception' => $e]);
            return $this->errorResponse('Failed to retrieve dashboard statistics.', 500);
      }
    }
}
