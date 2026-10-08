export function getTeammates(team) {
    if (!team || !team.users) {
        return [];
    }

    return team.users.map(user => user.username);
}

export function groupTeamsByCommunity(teams) {
    return teams.reduce((acc, team) => {
        const communityName =
            team.community?.name || "Unknown Community";

        if (!acc[communityName]) {
            acc[communityName] = [];
        }

        acc[communityName].push(team);

        return acc;
    }, {});
}