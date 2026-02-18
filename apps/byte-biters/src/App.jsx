import { useState } from "react"
import Editor from "./components/Editor"
import Header from "./components/Header"
import SidePanel from "./components/SidePanel"
import MemoryPanel from "./components/MemoryPanel"
import RegisterPanel from "./components/RegisterPanel"
import ControlPanel from "./components/ControlPanel"

export default function App() {
  const [code, setCode] = useState(`test code :D`)

  //purple background is placeholder to see better
  return (
    <div className="h-screen w-screen bg-purple-900 text-text-muted font-mono flex flex-col">
      <Header></Header>
      <div className="flex flex-row flex-1">
        <div className="flex flex-col flex-1">
          <Editor code={code} setCode={setCode} />
          <ControlPanel></ControlPanel>
          <RegisterPanel></RegisterPanel>
          <MemoryPanel></MemoryPanel>
        </div>
        <SidePanel></SidePanel>
      </div>
    </div>
  )
}
