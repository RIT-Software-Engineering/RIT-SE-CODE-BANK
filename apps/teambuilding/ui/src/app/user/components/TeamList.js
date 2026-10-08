import { getTeammates } from "../utils/userUtils";

export default function TeamList({
    teamsByCommunity,
    username,
    onUserClick,
}) {
    return (
        <div className="user-communities-container">
            {Object.entries(teamsByCommunity).map(([community, teams]) => (
                <div className="user-community-box" key={community}>
                    <h3>{community}</h3>

                    {teams.map(team => (
                        <div className="user-team-box" key={team.id}>
                            <strong>{team.name}</strong>

                            <div className="user-team-teammates">
                                <span className="user-team-teammates-label">
                                    Teammates:
                                </span>

                                <ul className="user-team-teammates-list">
                                    {getTeammates(team).map((user, index) => (
                                        <li
                                            key={index}
                                            className={`user-teammate${
                                                user === username
                                                    ? " user-teammate-self"
                                                    : ""
                                            }`}
                                            onClick={() => onUserClick(user)}
                                        >
                                            {user}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
}
