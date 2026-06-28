<?php

namespace App\Modules\Project\DTOs;

readonly class ProjectDTO
{
    public function __construct(
        public array $data,
        public ?array $images = null,
        public ?int $primaryImageIndex = null,
        public ?int $primaryImageId = null,
        public ?array $units = null,
        public ?array $featureIds = null
    ) {
    }

    public static function fromRequest(\Illuminate\Http\Request $request): self
    {
        $data = $request->except(['images', 'primary_image_index', 'primary_image_id', 'units', 'feature_ids']);

        if (isset($data['project_type_id'])) {
            $data['project_type_id'] = (int) $data['project_type_id'];
        }

        $primaryImageIndex = $request->has('primary_image_index') ? (int) $request->input('primary_image_index') : null;
        $primaryImageId = $request->has('primary_image_id') ? (int) $request->input('primary_image_id') : null;
        $units = $request->input('units');

        // Clean units array if sent as string or array
        if (is_string($units)) {
            $units = json_decode($units, true);
        }

        // Clean feature_ids if sent as JSON string or array
        $featureIds = $request->input('feature_ids') ?: [];
        if (is_string($featureIds)) {
            $featureIds = json_decode($featureIds, true) ?: [];
        }
        if (!is_array($featureIds)) {
            $featureIds = [];
        }
        $featureIds = array_map('intval', $featureIds);

        return new self(
            data: $data,
            images: $request->file('images'),
            primaryImageIndex: $primaryImageIndex,
            primaryImageId: $primaryImageId,
            units: $units,
            featureIds: $featureIds
        );
    }
}
