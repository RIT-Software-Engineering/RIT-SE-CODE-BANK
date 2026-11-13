'use client';

import { CreateUserForm } from "@rit/teambuilding-components";
import { CommunityListWrapper } from "@rit/teambuilding-components";

export default function ManagerPage() {

  return (
    <div>
      <h1>Manager Page</h1>
      <CreateUserForm />
      <CommunityListWrapper></CommunityListWrapper>
    </div>
  );
}
