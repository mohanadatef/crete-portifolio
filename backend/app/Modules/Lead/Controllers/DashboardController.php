<?php

namespace App\Modules\Lead\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Modules\Lead\Models\Lead;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $projectId = $request->query('project_id');
        $landingPageId = $request->query('landing_page_id');
        $range = $request->query('range', 'week'); // today, yesterday, week, month, custom
        $startDateParam = $request->query('start_date');
        $endDateParam = $request->query('end_date');

        // Base query for leads today
        $todayQuery = Lead::whereDate('created_at', Carbon::today());
        // Base query for leads yesterday
        $yesterdayQuery = Lead::whereDate('created_at', Carbon::yesterday());

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
                $startDate = Carbon::parse($startDateParam);
            }
            if ($endDateParam) {
                $endDate = Carbon::parse($endDateParam);
            }
        }

        // Fetch chart data: group by date and count
        $chartQuery = Lead::query()
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

        return response()->json([
            'success' => true,
            'data' => [
                'leads_today' => $leadsToday,
                'leads_yesterday' => $leadsYesterday,
                'leads_total' => Lead::count(),
                'projects_count' => \App\Modules\Project\Models\Project::count(),
                'pages_count' => \App\Modules\Page\Models\Page::count(),
                'landing_pages_count' => \App\Modules\Page\Models\LandingPage::count(),
                'blog_posts_count' => \App\Modules\Blog\Models\BlogPost::count(),
                'chart_data' => $chartData
            ]
        ]);
    }
}
