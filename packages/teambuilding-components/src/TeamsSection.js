"use client";
import TeamCard from "./TeamCard";
import CreateTeamsForm from "./CreateTeamsForm";
import './styles/TeamSection.css';

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
    <section className="teams-section">
      <h3 className="teams-section-title">Teams</h3>
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
        <div className="teams-section-empty">No teams</div>
      )}
      <div className="teams-section-create">
      <CreateTeamsForm
        communityId={community.id}
        communityMembers={communityMembers}
        reloadCommunities={reloadCommunities}
      />
      </div>
    </section>
  );
}
