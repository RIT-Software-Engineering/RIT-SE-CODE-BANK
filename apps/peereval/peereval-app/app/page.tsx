import Image from "next/image";


export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <h1 className="text-5xl font-bold mb-4 text-orange-600">Peer Eval</h1>
        <p className="text-xl text-gray-600 mb-8">Empower Every Voice.</p>
        <div className="grid grid-cols-2 gap-4">
          <button className="px-6 py-3 bg-orange-500 text-white rounded-lg shadow hover:bg-orange-600 transition">
            Start as a Peer
          </button>
          <button className="px-6 py-3 bg-orange-500 text-white rounded-lg shadow hover:bg-orange-600 transition">
            Start as an Overseer
          </button>
        </div>

      </div>
    </main>
  );

}
