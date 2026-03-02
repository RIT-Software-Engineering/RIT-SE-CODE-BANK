import { useState } from "react"
import CodeEditor from "./components/CodeEditor"
import Header from "./components/Header"
import SidePanel from "./components/SidePanel"
import MemoryPanel from "./components/MemoryPanel"
import RegisterPanel from "./components/RegisterPanel"
import ControlPanel from "./components/ControlPanel"
import {Group, Panel} from "react-resizable-panels"

export default function App() {
  const memory = new Array(256).fill(0)

  const [code, setCode] = useState(`test code :D`)

  return (
    <div className="h-screen w-screen bg-main-primary text-text-muted font-mono flex flex-col">
      <Header></Header>

      <Group>
        {/* left side */}
        <Panel className="flex flex-col h-full">
          <Group orientation="vertical">
            <Panel>
              <CodeEditor code={code} setCode={setCode} />
            </Panel>
            <Panel className="flex flex-col h-full">
              {/* temp border */}
              <div className="bg-border-primary min-h-2 "></div>
              <ControlPanel></ControlPanel>
              <RegisterPanel></RegisterPanel>
              <MemoryPanel memory={memory}></MemoryPanel>
            </Panel>
          </Group>
          
        </Panel>
        {/* right side */}
        <Panel className="flex flex-row flex-1 h-full">
          {/* temp border */}
          <div className="bg-border-primary min-w-2"></div>
          <SidePanel></SidePanel>
        </Panel>
      </Group>

      
    </div>
  )
}
