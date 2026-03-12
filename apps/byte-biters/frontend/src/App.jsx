import { useState, useRef } from "react"
import CodeEditor from "./components/CodeEditor"
import Header from "./components/Header"
import SidePanel from "./components/SidePanel"
import MemoryPanel from "./components/MemoryPanel"
import RegisterPanel from "./components/RegisterPanel"
import ControlPanel from "./components/ControlPanel"
import {Group, Panel} from "react-resizable-panels"
import { CPU } from "../../backend/cpu"
import { backend } from "../../backend/backend"

export default function App() {
  const [cpuState, setCpuState] = useState(backend.getState())

  const [code, setCode] = useState(`test code :D`)
  const onAssemble = () => {
    const state = backend.loadAssembly(code)
    setCpuState(state)
  }
  const onRun = () => {
    const state = backend.run()
    setCpuState(state)
  }
  const onStepForward = () => {
    const state = backend.step()
    setCpuState(state)
  }
  const onStepBackward = () => {
    alert("Step Backward button clicked! (placeholder)")
  }
  const onRestart = () => {
    const state = backend.reset()
    setCpuState(state)
  }
 

  return (
    <div className="h-screen w-screen bg-main-primary text-text-muted font-mono flex flex-col">
      <Header></Header>

      <Group>
        {/* left side */}
        <Panel className="flex flex-col h-full" collapsible minSize={100}>
          <Group orientation="vertical">
            <Panel>
              <CodeEditor code={code} setCode={setCode} />
            </Panel>
            <Panel className="flex flex-col h-full" collapsible minSize={100}>
              {/* temp border */}
              <div className="bg-border-primary min-h-2 "></div>
              <ControlPanel onAssemble={onAssemble} onRun={onRun} onStepForward={onStepForward} onStepBackward={onStepBackward} onRestart={onRestart}></ControlPanel>
              <RegisterPanel registers={cpuState.registers}></RegisterPanel>
              <MemoryPanel memory={cpuState.memory}></MemoryPanel>
            </Panel>
          </Group>
          
        </Panel>
        {/* right side */}
        <Panel className="flex flex-row flex-1 h-full" collapsible minSize={100}>
          {/* temp border */}
          <div className="bg-border-primary min-w-2"></div>
          <SidePanel></SidePanel>
        </Panel>
      </Group>

      
    </div>
  )
}
