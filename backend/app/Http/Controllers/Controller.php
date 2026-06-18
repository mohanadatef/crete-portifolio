<?php

namespace App\Http\Controllers;

use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Foundation\Bus\DispatchesJobs;
use Illuminate\Foundation\Validation\ValidatesRequests;
use Illuminate\Routing\Controller as BaseController;
use App\Traits\ApiResponseTrait;

use OpenApi\Attributes as OA;

#[OA\Info(version: "1.0.0", description: "Real Estate API documentation", title: "Real Estate API Documentation")]
#[OA\Server(url: "http://localhost:8000/api", description: "Local API Server")]
class Controller extends BaseController
{
    use AuthorizesRequests, DispatchesJobs, ValidatesRequests, ApiResponseTrait;
}
