import { useEffect, useState } from "react";
import {
    fetchUserDetails,
    fetchUserByUsername,
    fetchUserTeams,
} from "../api/userApi";
import { groupTeamsByCommunity } from "../utils/userUtils";

const EMPTY_USER_INFO = {
    firstName: "",
    lastName: "",
    email: "",
};

export function useUser() {
    const [username, setUsername] = useState("");
    const [userTeams, setUserTeams] = useState([]);
    const [userInfo, setUserInfo] = useState(EMPTY_USER_INFO);

    useEffect(() => {
        const storedUsername =
            typeof window !== "undefined"
                ? localStorage.getItem("username")
                : "";

        setUsername(storedUsername || "");

        if (!storedUsername) {
            return;
        }

        fetchUserDetails(storedUsername)
            .then(userData => {
                if (userData) {
                    setUserInfo({
                        firstName: userData.firstName || "",
                        lastName: userData.lastName || "",
                        email: userData.email || "",
                    });
                }
            })
            .catch(error =>
                console.log("Error fetching user details:", error)
            );

        fetchUserByUsername(storedUsername)
            .then(userData => {
                if (!userData || !userData.id) {
                    return;
                }

                return fetchUserTeams(userData.id);
            })
            .then(data => {
                if (data) {
                    setUserTeams(data.teams || []);
                }
            })
            .catch(error =>
                console.log("Error fetching user teams:", error)
            );
    }, []);

    const teamsByCommunity = groupTeamsByCommunity(userTeams);

    return {
        username,
        userTeams,
        userInfo,
        setUserInfo,
        teamsByCommunity,
    };
}
