import Footer from "./Footer";
import Header from "./Header";

export default function Landing() {
  return (
    <div class="bg-white">
      <Header />
      <div className="bg-rit-light-gray h-screen rounded-lg p-5 m-10 justify-center items-center flex flex-col">
        <div className="text-center text-3xl w-1/2">
          Welcome to the RIT Course Assistant Portal
          <br />
          <br />
          Sign in with your RIT Account
        </div>

        <button className="bg-black text-white w-40 rounded-lg p-3 text-lg mt-20 hover:bg-gray-800">Sign In</button>
      </div>
      <Footer/>
    </div>
  );
}
