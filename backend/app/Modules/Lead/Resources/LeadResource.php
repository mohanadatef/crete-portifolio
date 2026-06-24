<?php

namespace App\Modules\Lead\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LeadResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'message' => $this->message,
            'project_id' => $this->project_id,
            'project' => $this->whenLoaded('project', function () {
                return ['id' => $this->project->id, 'title' => $this->project->title_en ?? $this->project->title_ar ?? 'Project'];
            }),
            'status' => $this->status,
            'assigned_to' => $this->assigned_to,
            'assigned_user' => $this->whenLoaded('assignedTo', function () {
                return ['id' => $this->assignedTo->id, 'name' => $this->assignedTo->name];
            }),
            'landing_page_id' => $this->landing_page_id,
            'landing_page' => $this->whenLoaded('landingPage', function () {
                return ['id' => $this->landingPage->id, 'title' => $this->landingPage->title_en ?? $this->landingPage->title_ar ?? 'Landing Page'];
            }),
            'form_data' => $this->form_data,
            'utm_source' => $this->utm_source,
            'utm_medium' => $this->utm_medium,
            'utm_campaign' => $this->utm_campaign,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
