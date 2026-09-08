import cron from 'node-cron';
import { permanentDeleteWorkspace } from '../controllers/workspaceController.js';
import WorkSpace from '../models/WorkSpace.js';

/**
 * Run daily at 2:00 AM to permanently delete workspaces
 * that were soft-deleted more than 30 days ago.
 */
export function startCleanupCron() {
  console.log('⏰ Scheduling cleanup cron job (daily at 2:00 AM)');
  
  cron.schedule('0 2 * * *', async () => {
    console.log('🧹 Running workspace cleanup...');
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const workspaces = await WorkSpace.find({
        isDeleted: true,
        deletedAt: { $lte: thirtyDaysAgo },
      });
      
      console.log(`📦 Found ${workspaces.length} workspaces to permanently delete`);
      
      for (const ws of workspaces) {
        await permanentDeleteWorkspace(ws._id);
        console.log(`✅ Permanently deleted: ${ws.name} (${ws._id})`);
      }
    } catch (err) {
      console.error('❌ Cleanup failed:', err);
    }
  });
}