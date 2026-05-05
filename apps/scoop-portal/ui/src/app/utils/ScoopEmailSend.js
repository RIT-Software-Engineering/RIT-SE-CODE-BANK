export const sendScoopEmail = async (recipient, subject, message) => {
    //Validate inputs
    if(!recipient || !subject || !message){
        return {success: false, message: "Please fill in all fields."};
    }

    try{
        const res = await fetch(`${process.env.NEXT_PUBLIC_NOTIFICATION}/api/notifications/dispatch/scoop-portal`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                userEmail: recipient,
                subject: subject,
                message: message
            })
        });

        if(res.ok){
            return {success: true, message: `Email successfully sent to ${recipient}!`};
        }else{
            const err = await res.json();
            return {success: false, message: err.error || "Failed to send email."};
        }
    }catch (err){
        return {success: false, message: "Something went wrong. Please try again."};
    }
};