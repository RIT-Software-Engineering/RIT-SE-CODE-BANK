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

  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "info",
  })

  const showToast = (message, type = "info") => {
    setToast({
      show: true,
      message,
      type,
    })

    setTimeout(() => {
      setToast((prev) => ({
        ...prev,
        show: false,
      }))
    }, 1500)
  }

  const canAssemble = code.trim().length > 0
  const canRun = cpuState?.isAssembled && !cpuState?.halted
  const canStepForward = cpuState?.isAssembled && !cpuState?.halted
  const canStepBackward = cpuState?.canBackStep
  const canRestart = cpuState?.isAssembled || cpuState?.canBackStep

  // connects frontend to backend assemble function
  const onAssemble = () => {
    const state = backend.loadAssembly(code)
    setCpuState(state)
    showToast("Assembly successful", "success")
  }
  // connects frontend to backend run function
  const onRun = () => {
    const state = backend.run()
    setCpuState(state)
    showToast("Running program...", "warning")
  }
  //connects frontend to backend forward step function
  const onStepForward = () => {
    const state = backend.step()
    setCpuState(state)
    showToast("Stepped forward", "warning")
  }
  //connects frontend to backend backward step function
  const onStepBackward = () => {
    const state = backend.backStep()
    setCpuState(state)
    showToast("Stepped backward", "warning")
  }
  //connects frontend to backend restart function
  const onRestart = () => {
    const state = backend.reset()
    setCpuState(state)
    showToast("Cleared program", "warning")
  }

  return (
    // the main layout/format of the entire webpage
    <div className="h-screen w-screen bg-main-primary text-text-muted font-mono flex flex-col">
      {/* refer to Header Component */}
      <Header code={code} setCode={setCode}></Header>

      {/* uses react resizeable panels, so the html tags are Group and Panel */}
      <Group>
        {/* left side */}
        <Panel className="flex flex-col h-full" defaultSize={70} minSize={200}>
          <Group orientation="vertical">

            <Panel minSize={100} className="relative">
              {/* refer to CodeEditor Component */}
              <CodeEditor code={code} setCode={setCode} />
              <div
                className={`
                  absolute bottom-3 left-1/2 -translate-x-1/2 z-20
                  px-4 py-2 rounded-md shadow-md text-sm font-medium
                  transition-all duration-300
                  ${toast.show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"}
                  ${
                    toast.type === "success"
                      ? "bg-green-600 text-white"
                      : "bg-orange-500 text-white"
                  }
                `}
              >
                {toast.message}
              </div>
            </Panel>

            <Panel className="flex flex-col h-full min-h-0 w-full" minSize={200}>
              
              <div className="bg-border-primary min-h-2 "></div>
              {/* refer to ControlPanel component */}
              <ControlPanel 
                onAssemble={onAssemble} 
                onRun={onRun} 
                onStepForward={onStepForward} 
                onStepBackward={onStepBackward} 
                onRestart={onRestart}
                canAssemble={canAssemble}
                canRun={canRun}
                canStepForward={canStepForward}
                canStepBackward={canStepBackward}
                canRestart={canRestart}
              ></ControlPanel>

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
        <Panel className="flex flex-row flex-1 h-full" defaultSize={30} minSize={200}>
          <div className="bg-border-primary min-w-2"></div>
          {/* refer to SidePanel component */}
          <SidePanel></SidePanel>
        </Panel>

      </Group>
  
    </div>
  )
}
