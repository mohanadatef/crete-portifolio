<?php

namespace App\Modules\Auth\Controllers;

use App\Http\Controllers\Controller;

use Illuminate\Http\Request;
use App\Modules\Auth\DTOs\LoginDTO;
use App\Modules\Auth\Services\AuthService;
use App\Modules\Auth\Resources\AuthResource;
use Illuminate\Http\JsonResponse;
use Exception;
use OpenApi\Attributes as OA;
use App\Http\Requests\LoginRequest;

class AuthController extends Controller
{
    public function __construct(private readonly AuthService $authService)
    {
    }

    #[OA\Post(
        path: "/admin/login",
        summary: "Login for admin users",
        tags: ["Auth"],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\MediaType(
                mediaType: "application/json",
                schema: new OA\Schema(
                    required: ["email", "password"],
                    properties: [
                        new OA\Property(property: "email", type: "string", format: "email"),
                        new OA\Property(property: "password", type: "string")
                    ]
                )
            )
        ),
        responses: [
            new OA\Response(response: 200, description: "Login successful"),
            new OA\Response(response: 401, description: "Invalid credentials")
        ]
    )]
    public function login(LoginRequest $request): JsonResponse
    {
        try {
            $dto = LoginDTO::fromRequest($request);
            $authData = $this->authService->login($dto);
            
            return $this->successResponse(
                new AuthResource($authData),
                'Logged in successfully'
            );
        } catch (Exception $e) {
            $code = $e->getCode();
            $code = is_numeric($code) ? (int) $code : 500;
            if ($code < 400 || $code > 599) {
                $code = 500;
            }
            return $this->errorResponse($e->getMessage(), $code);
        }
    }

    public function logout(Request $request): JsonResponse
    {
        try {
            $this->authService->logout($request->user());
            return $this->successResponse(null, 'Logged out successfully');
        } catch (Exception $e) {
            return $this->errorResponse('Failed to logout', 500);
        }
    }
}
