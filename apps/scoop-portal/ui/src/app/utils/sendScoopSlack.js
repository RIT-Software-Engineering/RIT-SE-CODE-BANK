export const sendScoopSlack = async (recipient, subject, message) => {
    if (!recipient || !subject || !message){
        return {success: false, message: "Please fill in all fields."};
    }

    try{
        const res = await fetch(`${process.env.NEXT_PUBLIC_NOTIFICATION}/dispatch/scoop-portal`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                userEmail: recipient,
                subject: subject,
                message: message,
                notifySlack: true,//tells dispatch to use Slack
                notifyEmail: false//This is so the email deosnt get notified when testing slack noti's
            })
        });

        if(res.ok){
            return {success: true, message: `Slack message successfully sent to ${recipient}!`};
        }else{
            const err = await res.json();
            return {success: false, message: err.error || "Failed to send Slack message."};
        }
    }catch (err){
        return {success: false, message: "Something went wrong. Please try again."};
    }
};