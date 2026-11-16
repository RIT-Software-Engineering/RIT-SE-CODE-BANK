"use client";
import { CreateUserForm } from "@rit/teambuilding-components";
import { CommunityListWrapper } from "@rit/teambuilding-components";
import { UserPageComp } from "@rit/teambuilding-components";
import { useEffect } from 'react';

export default function DemoPage(){

    useEffect(() => {
    localStorage.setItem("username", "manager1");
  }, []);

    return (<div>
        <UserPageComp></UserPageComp>
        <CreateUserForm></CreateUserForm>
        <CommunityListWrapper></CommunityListWrapper>
        </div>
    );
};