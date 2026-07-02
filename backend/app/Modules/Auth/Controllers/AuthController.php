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
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use App\Mail\PasswordResetMail;
use App\Modules\User\Models\User;

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
            
            $cookie = cookie(
                'auth_token', 
                $authData['token'], 
                60 * 24 * 7, // 7 days
                '/', 
                null, 
                config('app.env') === 'production', 
                true, // httpOnly
                false, 
                'Lax'
            );

            return $this->successResponse(
                new AuthResource($authData),
                'Logged in successfully'
            )->withCookie($cookie);
        } catch (Exception $e) {
            $code = $e->getCode();
            $code = is_numeric($code) ? (int) $code : 500;
            if ($code < 400 || $code > 599) {
                $code = 500;
            }
            if ($code >= 500) {
                \Illuminate\Support\Facades\Log::error('AuthController@login: ' . $e->getMessage(), ['exception' => $e]);
                return $this->errorResponse('An internal server error occurred.', 500);
            }
            return $this->errorResponse($e->getMessage(), $code);
        }
    }

    public function logout(Request $request): JsonResponse
    {
        try {
            $this->authService->logout($request->user());
            $cookie = cookie()->forget('auth_token');
            return $this->successResponse(null, 'Logged out successfully')->withCookie($cookie);
        } catch (Exception $e) {
            return $this->errorResponse('Failed to logout', 500);
        }
    }

    public function forgotPassword(Request $request): JsonResponse
    {
        $request->validate(['email' => 'required|email|exists:users,email']);
        try {
            $email = $request->input('email');
            
            $token = sprintf("%06d", mt_rand(100000, 999999));
            
            DB::table('password_resets')->updateOrInsert(
                ['email' => $email],
                [
                    'token' => Hash::make($token),
                    'created_at' => now()
                ]
            );

            Mail::to($email)->send(new PasswordResetMail($token, $email));

            return $this->successResponse(null, 'Password reset token sent to your email.');
        } catch (Exception $e) {
            \Illuminate\Support\Facades\Log::error('AuthController@forgotPassword: ' . $e->getMessage(), ['exception' => $e]);
            return $this->errorResponse('Failed to send password reset token.', 500);
        }
    }

    public function resetPassword(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email|exists:users,email',
            'token' => 'required|string',
            'password' => 'required|min:6|confirmed'
        ]);

        try {
            $email = $request->input('email');
            $token = $request->input('token');

            $reset = DB::table('password_resets')->where('email', $email)->first();

            if (!$reset || \Carbon\Carbon::parse($reset->created_at)->addMinutes(60)->isPast()) {
                return $this->errorResponse('Invalid or expired token.', 400);
            }

            if (!Hash::check($token, $reset->token) && $token !== $reset->token) {
                return $this->errorResponse('Invalid or expired token.', 400);
            }

            $user = User::where('email', $email)->first();
            $user->password = Hash::make($request->input('password'));
            $user->save();

            DB::table('password_resets')->where('email', $email)->delete();

            return $this->successResponse(null, 'Password has been reset successfully.');
        } catch (Exception $e) {
            \Illuminate\Support\Facades\Log::error('AuthController@resetPassword: ' . $e->getMessage(), ['exception' => $e]);
            return $this->errorResponse('Failed to reset password.', 500);
        }
    }
}
