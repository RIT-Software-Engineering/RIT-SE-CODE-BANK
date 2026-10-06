import CommunityCard from "./CommunityCard";

export default function CommunityList({
  communities,
  allUsers,
  communityUsers,
  teamMembers,
  formatUser,
  dragHandlers,
  reloadCommunities,
  setCommunities,
  setUsers,
  setCommunityUsers,
  loadCommunityUsers,
}) {
  if (communities.length === 0) {
    return <div>No communities found.</div>;
  }

  return communities.map((community) => (
    <CommunityCard
      key={community.id}
      community={community}
      allUsers={allUsers}
      members={communityUsers[community.id] || []}
      teamMembers={teamMembers}
      formatUser={formatUser}
      dragHandlers={dragHandlers}
      reloadCommunities={reloadCommunities}
      onDeleted={(communityId) =>
        setCommunities((prev) => prev.filter((c) => c.id !== communityId))
      }
      setUsers={setUsers}
      setCommunityUsers={setCommunityUsers}
      loadCommunityUsers={loadCommunityUsers}
    />
  ));
}
