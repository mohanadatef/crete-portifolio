<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Modules\User\Models\User;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use App\Modules\Setting\Models\BackupLog;

class BackupTest extends TestCase
{
    use RefreshDatabase;

    private User $adminUser;

    protected function setUp(): void
    {
        parent::setUp();

        // Create permission and role
        $permission = Permission::firstOrCreate(['name' => 'download-backups', 'guard_name' => 'sanctum']);
        $adminRole = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'sanctum']);
        $adminRole->syncPermissions([$permission]);

        // Create admin user
        $this->adminUser = User::create([
            'name' => 'Backup Admin',
            'email' => 'backupadmin@test.com',
            'password' => bcrypt('password'),
            'is_active' => true
        ]);
        
        $this->adminUser->assignRole($adminRole);
    }

    public function test_unauthenticated_user_cannot_access_backups()
    {
        $response = $this->getJson('/api/v1/admin/settings/backups');
        $response->assertStatus(401);

        $responseDownload = $this->getJson('/api/v1/admin/settings/backup');
        $responseDownload->assertStatus(401);
    }

    public function test_user_without_permission_cannot_access_backups()
    {
        $regularUser = User::create([
            'name' => 'Regular User',
            'email' => 'regular@test.com',
            'password' => bcrypt('password'),
            'is_active' => true
        ]);

        $response = $this->actingAs($regularUser)->getJson('/api/v1/admin/settings/backups');
        $response->assertStatus(403);

        $responseDownload = $this->actingAs($regularUser)->getJson('/api/v1/admin/settings/backup');
        $responseDownload->assertStatus(403);
    }

    public function test_authorized_user_can_list_backup_logs()
    {
        // Seed some backup logs
        BackupLog::create([
            'user_id' => $this->adminUser->id,
            'filename' => 'backup-test-1.zip',
            'status' => 'success'
        ]);

        BackupLog::create([
            'user_id' => $this->adminUser->id,
            'filename' => 'backup-test-2.zip',
            'status' => 'failed'
        ]);

        $response = $this->actingAs($this->adminUser)->getJson('/api/v1/admin/settings/backups');
        
        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'success',
                     'message',
                     'data' => [
                         'current_page',
                         'data' => [
                             '*' => [
                                 'id',
                                 'user_id',
                                 'filename',
                                 'status',
                                 'created_at',
                                 'user' => [
                                     'id',
                                     'name',
                                     'email'
                                 ]
                             ]
                         ],
                         'total'
                     ]
                 ]);

        $this->assertEquals(2, $response->json('data.total'));
    }

    public function test_authorized_user_can_trigger_and_download_backup()
    {
        $response = $this->actingAs($this->adminUser)->get('/api/v1/admin/settings/backup');

        // Check if the response is a binary file download (usually 200 with headers)
        $response->assertStatus(200);
        $response->assertHeader('content-type', 'application/zip');
        $response->assertHeader('content-disposition', 'attachment; filename=' . basename($response->getFile()->getPathname()));

        // Verify it logged in the database
        $this->assertDatabaseHas('backup_logs', [
            'user_id' => $this->adminUser->id,
            'status' => 'success'
        ]);
    }
}
