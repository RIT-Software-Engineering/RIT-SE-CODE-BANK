import { useState, useRef } from "react"
import CodeEditor from "./components/CodeEditor"
import Header from "./components/Header"
import SidePanel from "./components/SidePanel"
import MemoryPanel from "./components/MemoryPanel"
import RegisterPanel from "./components/RegisterPanel"
import ControlPanel from "./components/ControlPanel"
import {Group, Panel} from "react-resizable-panels"
import { backend } from "../../backend/backend"

export default function App() {
  const [cpuState, setCpuState] = useState(backend.getState())
  const [code, setCode] = useState(`Write your code here...`)

  // connects frontend to backend assemble function
  const onAssemble = () => {
    const state = backend.loadAssembly(code)
    setCpuState(state)
  }
  // connects frontend to backend run function
  const onRun = () => {
    const state = backend.run()
    setCpuState(state)
  }
  //connects frontend to backend forward step function
  const onStepForward = () => {
    const state = backend.step()
    setCpuState(state)
  }
  //connects frontend to backend backward step function
  const onStepBackward = () => {
    const state = backend.backStep()
    setCpuState(state)
  }
  //connects frontend to backend restart function
  const onRestart = () => {
    const state = backend.reset()
    setCpuState(state)
  }

  return (
    // the main layout/format of the entire webpage
    <div className="h-screen w-screen bg-main-primary text-text-muted font-mono flex flex-col">
      {/* refer to Header Component */}
      <Header code={code} setCode={setCode}></Header>

      {/* uses react resizeable panels, so the html tags are Group and Panel */}
      <Group>
        {/* left side */}
        <Panel className="flex flex-col h-full" collapsible minSize={100}>
          <Group orientation="vertical">

            <Panel>
              {/* refer to CodeEditor Component */}
              <CodeEditor code={code} setCode={setCode} />
            </Panel>

            <Panel className="flex flex-col h-full min-h-0 w-full" collapsible minSize={100}>
              
              <div className="bg-border-primary min-h-2 "></div>
              {/* refer to ControlPanel component */}
              <ControlPanel onAssemble={onAssemble} onRun={onRun} onStepForward={onStepForward} onStepBackward={onStepBackward} onRestart={onRestart}></ControlPanel>

              {/* refer to RegisterPanel component */}
              <RegisterPanel registers={cpuState.registers} flags={cpuState.flags}></RegisterPanel>

              <div className="flex min-h-0 w-full">
                {/* refer to MemoryPanel component */}
                <MemoryPanel memory={cpuState.memory}/>
              </div>

            </Panel>

          </Group>
        </Panel>

        {/* right side */}
        <Panel className="flex flex-row flex-1 h-full" collapsible minSize={100}>
          <div className="bg-border-primary min-w-2"></div>
          {/* refer to SidePanel component */}
          <SidePanel></SidePanel>
        </Panel>

      </Group>
  
    </div>
  )
}
