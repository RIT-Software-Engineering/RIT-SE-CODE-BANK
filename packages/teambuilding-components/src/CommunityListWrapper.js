//Community List class with Create Community form to update community information and loading information from the useManagerData hook
"use client";
import { useEffect, useState } from 'react';
import CommunityList from './CommunityList';
import CreateCommunityForm from './CreateCommunityForm';
import useManagerData from './hooks/useManagerData';
import useTeamDragAndDrop from "./hooks/useTeamDragAndDrop";
import DisplayFormatSelect from './DisplayFormatSelect';
import { formatUser } from "./utils/formatUser";

export default function CommunityListWrapper(){
  const [userDisplayFormat, setUserDisplayFormat] = useState("username");

  const {
    managerId,
    communities,
    setCommunities,
    users,
    setUsers,
    communityUsers,
    setCommunityUsers,
    teamMembers,
    setTeamMembers,
    loading,
    reloadCommunities,
    loadCommunityUsers,
  } = useManagerData();

  const dragHandlers = useTeamDragAndDrop({ setTeamMembers });

  return <div>
        <CreateCommunityForm
        managerId={managerId}
        onCommunityCreated={(community) => setCommunities((prev) => [...prev, community])}
        reloadCommunities={reloadCommunities}
      />
      <DisplayFormatSelect value={userDisplayFormat} onChange={setUserDisplayFormat} />
        <CommunityList
          communities={communities}
          allUsers={users}
          communityUsers={communityUsers}
          teamMembers={teamMembers}
          formatUser={(user) => formatUser(user, userDisplayFormat)}
          dragHandlers={dragHandlers}
          reloadCommunities={reloadCommunities}
          setCommunities={setCommunities}
          setUsers={setUsers}
          setCommunityUsers={setCommunityUsers}
          loadCommunityUsers={loadCommunityUsers}
        />
  </div>
}