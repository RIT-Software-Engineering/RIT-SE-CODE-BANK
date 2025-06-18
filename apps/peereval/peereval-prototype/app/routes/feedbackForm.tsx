import FeedbackFormPast from "./feedbackFormPast";
import FeedbackFormCurrent from "./feedbackFormCurrent";
import type { Route } from "../+types/root";

export async function loader({ params }: Route.LoaderArgs) { }

const FeedbackForm = ({ params }: Route.LoaderArgs) => {

    const fid = params.fid;
    console.log('fid = ' + fid);

    if (`${fid}` == '1') {
        return <FeedbackFormPast/>
    }
    return <FeedbackFormCurrent/>
}

export default FeedbackForm;