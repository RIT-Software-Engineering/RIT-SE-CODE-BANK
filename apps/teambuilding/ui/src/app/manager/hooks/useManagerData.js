import { useState, useEffect, useCallback } from "react";
import {
  getUserRole,
  getUser,
  getCommunities,
  getCommunityUsers,
  getAllUsers,
  getTeamUsers,
} from "../api/managerApi";

// Owns the core server data for the manager page: manager identity,
// communities, users, community members and team members.
export default function useManagerData() {
  const [managerId, setManagerId] = useState(null);
  const [communities, setCommunities] = useState([]);
  const [users, setUsers] = useState([]);
  const [communityUsers, setCommunityUsers] = useState({}); // { [communityId]: [user, ...] }
  const [teamMembers, setTeamMembers] = useState({}); // { [teamId]: [user, ...] }
  const [loading, setLoading] = useState(true);

  const loadCommunityUsers = useCallback((communityId) => {
    return getCommunityUsers(communityId)
      .then((res) => res.json())
      .then((data) =>
        setCommunityUsers((prev) => ({ ...prev, [communityId]: data.users || [] }))
      );
  }, []);

  // Initial load: verify manager role, then fetch communities + users
  useEffect(() => {
    const username = typeof window !== "undefined" ? localStorage.getItem("username") : null;
    if (!username) {
      setLoading(false);
      return;
    }
    getUserRole(username)
      .then((res) => res.json())
      .then(async (data) => {
        if (data.role !== "MANAGER") {
          setLoading(false);
          return;
        }
        const userRes = await getUser(username);
        const userData = await userRes.json();
        if (!userData || !userData.id) {
          setLoading(false);
          return;
        }
        setManagerId(userData.id);
        getCommunities(userData.id)
          .then((res) => res.json())
          .then((commData) => {
            setCommunities(commData.communities || []);
            setLoading(false);
            // Fetch users for each community
            (commData.communities || []).forEach((c) => loadCommunityUsers(c.id));
          });
        getAllUsers()
          .then((res) => res.json())
          .then((userList) => setUsers(userList.users || []));
      });
  }, [loadCommunityUsers]);

  // Fetch team members when communities load or change
  useEffect(() => {
    if (!communities.length) return;
    communities.forEach((community) => {
      (community.teams || []).forEach((team) => {
        getTeamUsers(team.id)
          .then((res) => res.json())
          .then((data) =>
            setTeamMembers((prev) => ({ ...prev, [team.id]: data.users || [] }))
          );
      });
    });
  }, [communities]);

  const reloadCommunities = async () => {
    if (!managerId) return;
    setLoading(true);
    const res = await getCommunities(managerId);
    const data = await res.json();
    setCommunities(data.communities || []);
    setLoading(false);
    // Reload users for each community
    (data.communities || []).forEach((c) => loadCommunityUsers(c.id));
  };

  return {
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
  };
}
