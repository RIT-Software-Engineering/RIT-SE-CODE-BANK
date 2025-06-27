import Link from "next/link";
import SelectionCard from "@/components/SelectionCard";
import { DASHBOARD_OPTIONS, ROLES } from "@/configuration/dashboard.config";


export default function LandingDashboard({ userRole }) {
  // filter options based on user role
  const PersonalOptions = DASHBOARD_OPTIONS.filter(
    (option) =>
      option.roles.includes(userRole) && option.category === "Personal"
  );

  return (
    <>
      <div className="bg-white h-screen p-10 pl-10 mb-10">
        <div>
          <h1 className="text-3xl ">Personal</h1>
          <div className="grid grid-cols-4">
            {PersonalOptions.map((option, index) => (
                <SelectionCard text={option.text} link={option.link} key={index}/>
            ))}
          </div>
        </div>
        <div>
          <h1 className="text-3xl">Explore</h1>
          <div className="flex justify-center">
            <Link href={"/Positions"} className="w-full flex justify-center">
              <button className="bg-white border-2 border-rit-light-gray min-h-44 rounded-xl p-6 m-8 flex flex-col items-center justify-center w-4/5 shadow hover:bg-[#fff4e6] hover:scale-105  transition duration-200 ease-in-out hover:shadow-lg cursor-pointer">
                <span className="text-xl font-semibold text-rit-orange">
                  Find Positions
                </span>
              </button>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
