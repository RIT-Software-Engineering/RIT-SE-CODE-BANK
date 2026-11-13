//Community Page buttons and 
"use client";
import { deleteCommunity } from "./api/managerApi";
import useCommunityCsvImport from "./hooks/useCommunityCsvImport";
import CommunityMembers from "./CommunityMembers";
import TeamsSection from "./TeamsSection";
import './styles/CommunityCard.css';

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
    <div className="manager-class-box community-card">
      <div className="manager-class-header community-card-header">
        <h2 className="community-card-title">{community.name}</h2>
        <div className="community-card-actions">
        <button
          className="community-card-button community-import-button"
          onClick={csvImport.openFilePicker}
          disabled={csvImport.importing}
          title="Import users from CSV file to this community"
        >
          {csvImport.importing ? "Importing..." : "Import Users"}
        </button>
        <button
          className="manager-delete-community-btn community-card-button community-delete-button"
          onClick={handleDelete}
          title="Delete this community"
        >
          Delete Community
        </button>
        </div>
      </div>
      <div className="community-card-content">
        <div className="community-card-members">
        <CommunityMembers
          communityId={community.id}
          allUsers={allUsers}
          members={members}
          formatUser={formatUser}
          setCommunityUsers={setCommunityUsers}
          loadCommunityUsers={loadCommunityUsers}
        />
        </div>
        <div className="community-card-teams">
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
    </div>
  );
}
