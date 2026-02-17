import { useState } from "react"
import Editor from "./components/Editor"
import Header from "./components/Header"
import SidePanel from "./components/SidePanel"

export default function App() {
  const [code, setCode] = useState(`test code :D`)

  //purple background is placeholder to see better
  return (
    <div className="min-h-screen bg-purple-900 text-gray-100 flex flex-col">
      <Header></Header>
      <div className="flex flex-row">
        <Editor code={code} setCode={setCode} />
        <SidePanel></SidePanel>  
      </div>
      
    </div>
  )
}
