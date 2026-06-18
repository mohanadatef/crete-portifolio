<?php

namespace App\Modules\Lead\Services;

use App\Modules\Lead\Models\Lead;
use Illuminate\Pagination\LengthAwarePaginator;

class LeadService
{
    public function getLeads(int $perPage = 15): LengthAwarePaginator
    {
        return Lead::latest()->paginate($perPage);
    }

    public function getLeadById(int $id): Lead
    {
        return Lead::findOrFail($id);
    }

    public function createLead(array $data): Lead
    {
        return Lead::create($data);
    }

    public function deleteLead(int $id): bool
    {
        return Lead::findOrFail($id)->delete();
    }
}
