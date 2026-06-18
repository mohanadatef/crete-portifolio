<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Modules\Lead\Models\Lead;
use Carbon\Carbon;

class CleanOldLeads extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'leads:clean';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Permanently delete leads that were soft-deleted more than 30 days ago.';

    /**
     * Create a new command instance.
     *
     * @return void
     */
    public function __construct()
    {
        parent::__construct();
    }

    /**
     * Execute the console command.
     *
     * @return int
     */
    public function handle()
    {
        $threshold = Carbon::now()->subDays(30);
        $deletedCount = Lead::onlyTrashed()->where('deleted_at', '<', $threshold)->forceDelete();
        $this->info("Permanently deleted {$deletedCount} old leads.");
        return Command::SUCCESS;
    }
}
