<?php

namespace App\Modules\Lead\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use App\Modules\Lead\Models\Lead;
use App\Modules\Project\Models\Project;
use App\Modules\Page\Models\LandingPage;
use App\Modules\Blog\Models\BlogPost;
use App\Modules\User\Models\User;
use Exception;
use Illuminate\Support\Facades\Log;

class ReportController extends Controller
{
    public function index(): JsonResponse
    {
        try {
            // 1. Lead & Sales Pipeline Performance
            $totalLeads = Lead::count();
            $convertedLeads = Lead::where('status', 'converted')->count();
            $newLeads = Lead::where('status', 'new')->count();
            $inProgressLeads = Lead::where('status', 'in_progress')->count();
            
            $leadsByStatus = [
                ['status' => 'new', 'count' => $newLeads],
                ['status' => 'in_progress', 'count' => $inProgressLeads],
                ['status' => 'converted', 'count' => $convertedLeads]
            ];

            $leadsBySourceRaw = Lead::select('source', DB::raw('count(*) as count'))
                ->groupBy('source')
                ->get();
            
            $leadsBySource = [];
            foreach ($leadsBySourceRaw as $row) {
                $leadsBySource[] = [
                    'source' => $row->source ?: 'other',
                    'count' => (int)$row->count
                ];
            }

            // Sales Agent Performance
            $salesPerformance = User::query()
                ->withCount(['assignedLeads as total_assigned'])
                ->get()
                ->map(function ($user) {
                    $converted = Lead::where('assigned_to', $user->id)
                        ->where('status', 'converted')
                        ->count();
                    return [
                        'id' => $user->id,
                        'name' => $user->name,
                        'total_leads' => $user->total_assigned,
                        'converted_leads' => $converted,
                        'conversion_rate' => $user->total_assigned > 0 
                            ? round(($converted / $user->total_assigned) * 100, 1) 
                            : 0.0
                    ];
                })
                ->sortByDesc('conversion_rate')
                ->values();

            $leadPerformanceReport = [
                'total_leads' => $totalLeads,
                'converted_leads' => $convertedLeads,
                'conversion_rate' => $totalLeads > 0 ? round(($convertedLeads / $totalLeads) * 100, 1) : 0.0,
                'status_distribution' => $leadsByStatus,
                'source_distribution' => $leadsBySource,
                'sales_performance' => $salesPerformance
            ];

            // 2. Project Demand & Popularity
            $topProjectsByViews = Project::select('id', 'title_en', 'title_ar', 'views_count', 'location', 'location_ar')
                ->orderByDesc('views_count')
                ->limit(5)
                ->get()
                ->map(function ($proj) {
                    return [
                        'id' => $proj->id,
                        'title_en' => $proj->title_en,
                        'title_ar' => $proj->title_ar,
                        'location_en' => $proj->location,
                        'location_ar' => $proj->location_ar ?: $proj->location,
                        'views_count' => (int)$proj->views_count
                    ];
                });

            $topProjectsByInquiries = Lead::select('project_id', DB::raw('count(*) as count'))
                ->whereNotNull('project_id')
                ->groupBy('project_id')
                ->with('project:id,title_en,title_ar,location,location_ar')
                ->orderByDesc('count')
                ->limit(5)
                ->get()
                ->map(function ($row) {
                    return [
                        'id' => $row->project_id,
                        'title_en' => $row->project->title_en ?? 'Unknown',
                        'title_ar' => $row->project->title_ar ?? 'غير معروف',
                        'location_en' => $row->project->location ?? '',
                        'location_ar' => $row->project->location_ar ?? ($row->project->location ?? ''),
                        'inquiries_count' => (int)$row->count
                    ];
                });

            // Location popularity
            $locationPopularity = Project::select('location', 'location_ar', DB::raw('sum(views_count) as total_views'))
                ->groupBy('location', 'location_ar')
                ->get()
                ->map(function ($row) {
                    $inquiries = Lead::whereHas('project', function ($q) use ($row) {
                        $q->where('location', $row->location);
                    })->count();
                    return [
                        'location_en' => $row->location,
                        'location_ar' => $row->location_ar ?: $row->location,
                        'total_views' => (int)$row->total_views,
                        'total_inquiries' => $inquiries
                    ];
                });

            $projectDemandReport = [
                'top_projects_by_views' => $topProjectsByViews,
                'top_projects_by_inquiries' => $topProjectsByInquiries,
                'location_popularity' => $locationPopularity
            ];

            // 3. Campaign & Attribution Report
            $landingPagePerformance = LandingPage::select('id', 'title_en', 'title_ar', 'slug')
                ->withCount('leads')
                ->get()
                ->map(function ($lp) {
                    return [
                        'id' => $lp->id,
                        'title_en' => $lp->title_en,
                        'title_ar' => $lp->title_ar,
                        'slug' => $lp->slug,
                        'leads_count' => $lp->leads_count
                    ];
                });

            $utmAttributionRaw = Lead::select('utm_source', DB::raw('count(*) as count'))
                ->whereNotNull('utm_source')
                ->groupBy('utm_source')
                ->get();
            
            $utmAttribution = [];
            foreach ($utmAttributionRaw as $row) {
                $utmAttribution[] = [
                    'source' => $row->utm_source,
                    'count' => (int)$row->count
                ];
            }

            $utmCampaignRaw = Lead::select('utm_campaign', DB::raw('count(*) as count'))
                ->whereNotNull('utm_campaign')
                ->groupBy('utm_campaign')
                ->get();
            
            $utmCampaigns = [];
            foreach ($utmCampaignRaw as $row) {
                $utmCampaigns[] = [
                    'campaign' => $row->utm_campaign,
                    'count' => (int)$row->count
                ];
            }

            $topBlogPostsByViews = BlogPost::select('id', 'title_en', 'title_ar', 'views_count')
                ->orderByDesc('views_count')
                ->limit(5)
                ->get();

            $campaignAttributionReport = [
                'landing_page_performance' => $landingPagePerformance,
                'utm_source_distribution' => $utmAttribution,
                'utm_campaign_distribution' => $utmCampaigns,
                'top_blog_posts_by_views' => $topBlogPostsByViews
            ];

            return $this->successResponse([
                'lead_performance' => $leadPerformanceReport,
                'project_demand' => $projectDemandReport,
                'campaign_attribution' => $campaignAttributionReport
            ], 'Reports retrieved successfully');

        } catch (Exception $e) {
            Log::error('ReportController@index: ' . $e->getMessage(), ['exception' => $e]);
            return $this->errorResponse('Failed to retrieve reports.', 500);
        }
    }
}
