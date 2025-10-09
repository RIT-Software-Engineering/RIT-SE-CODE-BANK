import { useEffect, useState } from "react";
import { getGrants } from "../api/api_imports";

export default function GrantsPage() {
  const [grants, setGrants] = useState([]);

  useEffect(() => {
    getGrants().then(setGrants);
  }, []);

  return (
    <div className="p-6">
      <ul>
        {grants.map(g => (
          <li key={g.grant_id}>
            <strong>{g.title}</strong> 
          </li>
        ))}
      </ul>
    </div>
  );
}