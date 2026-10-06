import TeamCard from "./TeamCard";
import CreateTeamsForm from "./CreateTeamsForm";

// "Teams" heading, the list of teams, and the team creation forms.
export default function TeamsSection({
  community,
  communityMembers,
  teamMembers,
  formatUser,
  dragHandlers,
  reloadCommunities,
}) {
  return (
    <>
      <h3>Teams</h3>
      {community.teams && community.teams.length > 0 ? (
        community.teams.map((team) => (
          <TeamCard
            key={team.id}
            team={team}
            communityMembers={communityMembers}
            members={teamMembers[team.id] || []}
            formatUser={formatUser}
            dragHandlers={dragHandlers}
            reloadCommunities={reloadCommunities}
          />
        ))
      ) : (
        <div>No teams</div>
      )}
      <CreateTeamsForm
        communityId={community.id}
        communityMembers={communityMembers}
        reloadCommunities={reloadCommunities}
      />
    </>
  );
}
