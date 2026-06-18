<?php

namespace Database\Seeders;

use App\Modules\User\Models\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // create permissions
        $permissions = [
            'manage-users',
            'manage-roles',
            'manage-projects',
            'manage-project-types',
            'manage-pages',
            'manage-leads',
            'manage-blog',
            'manage-settings'
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'sanctum']);
        }

        // create roles and assign created permissions
        $superAdmin = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'sanctum']);
        $superAdmin->syncPermissions(Permission::where('guard_name', 'sanctum')->get());

        $contentEditor = Role::firstOrCreate(['name' => 'Content Editor', 'guard_name' => 'sanctum']);
        $contentEditor->syncPermissions(['manage-projects', 'manage-pages', 'manage-blog']);

        $user = User::updateOrCreate(
            ['email' => 'admin@admin.com'],
            [
                'name' => 'Admin User',
                'password' => bcrypt('password'),
            ]
        );

        if (!$user->hasRole('admin')) {
            $user->assignRole('admin');
        }
    }
}
