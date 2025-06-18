import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

// Types
type Assessment = {
    id: string;
    name: string;
    startDate: string;
    dueDate: string;
    questionsCount: number;
    completedByOthers?: number;
    completedQuestions?: number;
    status: "pastDue" | "toDo" | "upcoming";
};

const dummyAssessments: Assessment[] = [
    {
        id: "1",
        name: "Peer Review 1",
        startDate: "2024-06-01",
        dueDate: "2024-06-10",
        questionsCount: 5,
        completedByOthers: 3,
        status: "pastDue",
    },
    {
        id: "2",
        name: "Peer Review 2",
        startDate: "2024-06-11",
        dueDate: "2024-06-20",
        questionsCount: 4,
        completedQuestions: 1,
        status: "toDo",
    },
    {
        id: "3",
        name: "Final Feedback",
        startDate: "2024-06-21",
        dueDate: "2024-06-30",
        questionsCount: 6,
        status: "upcoming",
    },
];

// Helper to split assessments by status
const splitAssessments = (assessments: Assessment[]) => ({
    pastDue: assessments.filter(a => a.status === "pastDue"),
    toDo: assessments.filter(a => a.status === "toDo"),
    upcoming: assessments.filter(a => a.status === "upcoming"),
});

// ...unchanged imports and types...

const Section: React.FC<{
    title: string;
    assessments: Assessment[];
    clickable?: boolean;
    showCompletedByOthers?: boolean;
    showCompletedQuestions?: boolean;
    onAssessmentClick?: (id: string) => void;
    onPeersClick?: (id: string) => void;
}> = ({
    title,
    assessments,
    clickable = false,
    showCompletedByOthers = false,
    showCompletedQuestions = false,
    onAssessmentClick,
    onPeersClick,
}) => (
    <section className="mb-8">
        <h2 className="text-lg font-semibold mb-4">{title}</h2>
        <div className="space-y-2">
            {assessments.length === 0 && (
                <div className="text-gray-500 text-sm">No assessments.</div>
            )}
            {assessments.map((a) => (
                <>
                    <div
                        key={a.id}
                        className={`flex items-center justify-between p-4 rounded border ${
                            clickable
                                ? "cursor-pointer hover:bg-gray-50 transition"
                                : "bg-gray-100"
                        }`}
                        onClick={
                            clickable && onAssessmentClick
                                ? () => onAssessmentClick(a.id)
                                : undefined
                        }
                    >
                        <div className="flex-1">
                            <div className="font-medium">{a.name}</div>
                            <div className="text-xs text-gray-500">
                                {a.startDate} &ndash; {a.dueDate}
                            </div>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="text-sm">
                                <span className="font-semibold">{a.questionsCount}</span> questions
                            </div>
                            {showCompletedQuestions && (
                                <div className="text-sm text-green-700">
                                    <span className="font-semibold">{a.completedQuestions ?? 0}</span> answered
                                </div>
                            )}
                        </div>
                    </div>
                    {showCompletedByOthers && (
                        <PeersBox count={a.completedByOthers ?? 0} clickHandler={() => onPeersClick!!(a.id)} />
                    )}
                </>
            ))}
        </div>
    </section>
);

// New component for the peers box
const PeersBox: React.FC<{ count: number, clickHandler: () => void }> = ({ count, clickHandler }) => (
    <div className="bg-blue-100 text-blue-800 rounded px-3 py-1 text-xs font-semibold text-center min-w-[48px] cursor-pointer"
        onClick={clickHandler}>
        {count} peer submissions
    </div>
);

const ProjectView: React.FC = () => {
    const navigate = useNavigate();

    const { pastDue, toDo, upcoming } = splitAssessments(dummyAssessments);

    const handleBack = () => {
        navigate(-1);
    };

    const handleAssessmentClick = (id: string) => {
        navigate(`/feedbackForm/${id}`);
    };

    const handlePeersClick = (id: string) => {
        navigate(`/receivedFeedback/${id}`);
    };

    return (
        <div className="max-w-3xl mx-auto py-8 px-4">
            {/* Back Arrow */}
            <button
                onClick={handleBack}
                className="mb-6 flex items-center text-gray-700 hover:text-black"
                aria-label="Back"
            >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back
            </button>

            {/* Past Due Assessments Section */}
            <Section
                title="Past Due Assessments"
                assessments={pastDue}
                clickable
                showCompletedByOthers
                onAssessmentClick={handleAssessmentClick}
                onPeersClick={handlePeersClick}
            />

            {/* To Do Assessments Section */}
            <Section
                title="To Do Assessments"
                assessments={toDo}
                clickable
                showCompletedQuestions
                onAssessmentClick={handleAssessmentClick}
            />

            {/* Upcoming Assessments Section */}
            <Section
                title="Upcoming Assessments"
                assessments={upcoming}
            />
        </div>
    );
};

export default ProjectView;
