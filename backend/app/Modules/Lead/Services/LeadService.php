<?php

namespace App\Modules\Lead\Services;

use App\Modules\Lead\Models\Lead;
use Illuminate\Pagination\LengthAwarePaginator;

class LeadService
{
    public function getLeads(int $perPage = 15, array $filters = []): LengthAwarePaginator
    {
        $query = Lead::with(['assignedTo', 'landingPage', 'project'])->latest();
        
        $user = auth()->user();
        if ($user && !$user->can('view-all-leads')) {
            $query->where(function ($q) use ($user) {
                $q->where('assigned_to', $user->id);
                if ($user->can('view-unassigned-leads')) {
                    $q->orWhereNull('assigned_to');
                }
            });
        }

        if (!empty($filters['search'])) {
            $query->where(function($q) use ($filters) {
                $q->where('name', 'like', '%' . $filters['search'] . '%')
                  ->orWhere('email', 'like', '%' . $filters['search'] . '%')
                  ->orWhere('phone', 'like', '%' . $filters['search'] . '%');
            });
        }

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['assigned_to'])) {
            $query->where('assigned_to', $filters['assigned_to']);
        }

        if (!empty($filters['landing_page_id'])) {
            if ($filters['landing_page_id'] === 'general') {
                $query->whereNull('landing_page_id');
            } else {
                $query->where('landing_page_id', $filters['landing_page_id']);
            }
        }

        if (!empty($filters['project_id'])) {
            if ($filters['project_id'] === 'general') {
                $query->whereNull('project_id');
            } else {
                $query->where('project_id', $filters['project_id']);
            }
        }

        return $query->paginate($perPage);
    }

    public function getLeadById(int $id): Lead
    {
        return Lead::with(['assignedTo', 'landingPage', 'project'])->findOrFail($id);
    }

    public function createLead(array $data): Lead
    {
        return Lead::create($data);
    }

    public function updateLead(int $id, array $data): Lead
    {
        $lead = Lead::findOrFail($id);
        $lead->update($data);
        return $lead;
    }
    public function deleteLead(int $id): bool
    {
        return Lead::findOrFail($id)->delete();
    }
}
