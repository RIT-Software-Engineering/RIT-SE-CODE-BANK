import { deleteCommunity } from "../api/managerApi";
import useCommunityCsvImport from "../hooks/useCommunityCsvImport";
import CommunityMembers from "./CommunityMembers";
import TeamsSection from "./TeamsSection";

export default function CommunityCard({
  community,
  allUsers,
  members,
  teamMembers,
  formatUser,
  dragHandlers,
  reloadCommunities,
  onDeleted,
  setUsers,
  setCommunityUsers,
  loadCommunityUsers,
}) {
  const csvImport = useCommunityCsvImport({
    communityId: community.id,
    members,
    setUsers,
    setCommunityUsers,
  });

  const handleDelete = async () => {
    try {
      const res = await deleteCommunity(community.id);
      const data = await res.json();
      if (!res.ok) {
        console.log("Failed to delete community:", data.error);
      } else {
        onDeleted(community.id);
      }
    } catch {
      console.log("Server error deleting community");
    }
  };

  return (
    <div className="manager-class-box">
      <p className="manager-class-header">
        <strong>{community.name}</strong>
        <button
          onClick={csvImport.openFilePicker}
          disabled={csvImport.importing}
          title="Import users from CSV file to this community"
        >
          {csvImport.importing ? "Importing..." : "Import Users"}
        </button>
        <button
          className="manager-delete-community-btn"
          onClick={handleDelete}
          title="Delete this community"
        >
          Delete Community
        </button>
      </p>
      <div>
        <CommunityMembers
          communityId={community.id}
          allUsers={allUsers}
          members={members}
          formatUser={formatUser}
          setCommunityUsers={setCommunityUsers}
          loadCommunityUsers={loadCommunityUsers}
        />
        <TeamsSection
          community={community}
          communityMembers={members}
          teamMembers={teamMembers}
          formatUser={formatUser}
          dragHandlers={dragHandlers}
          reloadCommunities={reloadCommunities}
        />
      </div>
    </div>
  );
}
