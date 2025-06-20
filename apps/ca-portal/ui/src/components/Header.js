import { Link } from "react-router";
export default function Header() {
  return (
    // Add childen prop to allow passing components inside header eg links
    <div class="bg-rit-orange p-4 flex flex-row">
      <div id="Logo" class="text-left pl-10">
        <h1 className="text-4xl font-bold">Course Assistant Portal</h1>
        <h3>Department of software engineering, RIT </h3>
      </div>
      <nav className="pb-2 mt-2 text-white text-lg text-right flex-grow">
        <Link to="/">Home</Link> | <Link to="/users">Users</Link> | <Link to="/messaging">Messaging</Link>
      </nav>
    </div>
  );
}
