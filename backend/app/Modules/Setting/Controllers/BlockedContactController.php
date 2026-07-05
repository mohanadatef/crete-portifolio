<?php

namespace App\Modules\Setting\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Setting\Models\BlockedContact;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Exception;

class BlockedContactController extends Controller
{
    public function __construct()
    {
        // Require permission to manage lead blocklist
        $this->middleware('permission:manage-blocklist');
    }

    /**
     * Display a listing of blocked contacts.
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = BlockedContact::query();

            // Filter by type
            if ($request->has('type') && $request->query('type') !== 'ALL') {
                $query->where('type', $request->query('type'));
            }

            // Search by value or reason
            if ($request->has('search') && !empty($request->query('search'))) {
                $search = $request->query('search');
                $query->where(function ($q) use ($search) {
                    $q->where('value', 'like', "%{$search}%")
                      ->orWhere('reason', 'like', "%{$search}%");
                });
            }

            $query->orderBy('created_at', 'desc');

            $blocked = $query->paginate($request->query('per_page', 10));

            return $this->successResponse($blocked, 'Blocked contacts list retrieved successfully.');
        } catch (Exception $e) {
            \Illuminate\Support\Facades\Log::error('BlockedContactController@index: ' . $e->getMessage(), ['exception' => $e]);
            return $this->errorResponse('Failed to retrieve blocked contacts: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Store a newly created blocked contact.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'value' => 'required|string|unique:blocked_contacts,value',
            'type' => 'required|string|in:email,phone',
            'reason' => 'nullable|string|max:255',
        ]);

        try {
            $value = trim($request->input('value'));
            $type = $request->input('type');

            if ($type === 'email' && !filter_var($value, FILTER_VALIDATE_EMAIL)) {
                return $this->errorResponse('Invalid email address format.', 422);
            }

            $blocked = BlockedContact::create([
                'value' => $value,
                'type' => $type,
                'reason' => $request->input('reason'),
            ]);

            return $this->successResponse($blocked, 'Contact added to blocklist successfully.', 201);
        } catch (Exception $e) {
            \Illuminate\Support\Facades\Log::error('BlockedContactController@store: ' . $e->getMessage(), ['exception' => $e]);
            return $this->errorResponse('Failed to add contact to blocklist: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Remove the specified blocked contact.
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $blocked = BlockedContact::findOrFail($id);
            $blocked->delete();

            return $this->successResponse(null, 'Contact removed from blocklist successfully.');
        } catch (Exception $e) {
            \Illuminate\Support\Facades\Log::error('BlockedContactController@destroy: ' . $e->getMessage(), ['exception' => $e]);
            return $this->errorResponse('Failed to remove contact from blocklist.', 500);
        }
    }
}
