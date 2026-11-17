import { resetStuckNotifications, runDueNotifications } from "./notifier.js";

const INTERVAL = 60_000;

export async function startRunner(){
    if (process.env.NOTIFICATION_RUNNER_ENABLED !== 'true'){
        console.log("Runner off");
        return null;
    }

    async function tick(){
        try{
            await runDueNotifications();
        } catch(error){
            console.log("Failed to run due notifications:", error.message);
        }finally{
            setTimeout(tick, INTERVAL);
        }
    }
    await resetStuckNotifications();
    setTimeout(tick, INTERVAL);
}