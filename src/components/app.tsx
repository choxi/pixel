import React from "react"
import AceEditor from "react-ace"

import "ace-builds/src-noconflict/mode-javascript"
import "ace-builds/src-noconflict/theme-tomorrow"

// import p5 from "p5"
import * as acorn from "acorn"

import Debugger from "../lib/debugger"

// Convenient way to load p5 library for iframe
// @ts-ignore
import url from "file-loader!p5"

interface Props {

}

interface State {
  code: string
  snapshots: Array<Snapshot>
  play: boolean
  selectedSnapshot?: Snapshot
  lastSnapshotID?: number
}

const defaultCode = `
function setup() {
  createCanvas(window.innerWidth, window.innerHeight)
  background(255, 0, 0)
}

function draw() {

}
`

function debug() {
  debugger
}

class Snapshot {
  imageURL: string
  state: object
  id: number

  constructor(id: number, imageURL: string, state: object) {
    this.id = id
    this.imageURL = imageURL
    this.state = Debugger.copy(state)
  }
}

export default class App extends React.Component<Props, State> {
  state: State = { code: defaultCode, snapshots: []as Array<Snapshot>, play: false }
  previewRef: React.RefObject<HTMLIFrameElement> = React.createRef()
  framesRef: React.RefObject<HTMLDivElement> = React.createRef()
  // p: p5
  debugState: any = {}

  componentDidMount() {
    //@ts-ignore
    // p5.prototype.registerMethod("post", () => this.handleDraw())
    //@ts-ignore
    // p5.prototype.registerMethod("post", debug)
    // this.updatePreview()

    window.addEventListener('resize', () => this.handleResize(), false)
    window.addEventListener("message", event => {
      if (event.data.event === "draw") {
        const { lastSnapshotID } = this.state
        const id = (lastSnapshotID !== null) ? lastSnapshotID + 1 : 0
        const snapshot = new Snapshot(id, event.data.image, event.data.state)
        this.state.snapshots.push(snapshot)
        this.setState({ snapshots: this.state.snapshots, lastSnapshotID: id }, () => {
          this.framesRef.current.scrollBy(this.framesRef.current.scrollWidth, 0)
        })
      }
    })
  }

  handleResize() {
    this.setState({ snapshots: [] }, () => this.previewRef.current.contentWindow.location.reload())
  }

  handleChange(code: string) {
    this.setState({ code: code, snapshots: [] })
  }

  injectDebugger(code: string) {
    try {
      // const preview = this.previewRef.current
      // const w = { innerWidth: preview.clientWidth, innerHeight: preview.clientHeight }
      // // TODO: If the parse fails, check code for errors anyway so we can
      // // return an error message. The acorn parser won't catch e.g. `ReferenceError`s.
      // //
      // // Error line number is always eval error line minus 3
      // // https://stackoverflow.com/questions/3526902/tracing-the-source-line-of-an-error-in-a-javascript-eval
      const parsed = acorn.parse(code, { ecmaVersion: 2020 })
      //@ts-ignore
      const variables = parsed.body.filter(n => n.type === "VariableDeclaration")
      //@ts-ignore
      const names = variables.map(n => n.declarations.map(d => d.id.name)).flat()
      //@ts-ignore
      const namesToProps = names.map(name => `__debugState.${ name } = ${ name }`)
      const debugCode = `
        ${ namesToProps.join("\n") }
      `

      return debugCode
    } catch(e) {
      console.log(e)
    }
  }

  play() {
    this.setState({ play: true, selectedSnapshot: null, lastSnapshotID: null }, () => {
      this.previewRef.current.contentWindow.postMessage({ event: "play" }, window.location.origin)
    })
  }

  pause() {
    this.setState({ play: false }, () => {
      this.previewRef.current.contentWindow.postMessage({ event: "pause" }, window.location.origin)
    })
  }

  restart() {
    this.setState({ snapshots: [] }, () => this.previewRef.current.contentWindow.location.reload())
  }

  selectSnapshot(snapshot: Snapshot) {
    this.setState({ selectedSnapshot: snapshot })
  }

  snapshotSelectionStyle(snapshot: Snapshot) {
    const { selectedSnapshot } = this.state

    if (!selectedSnapshot) {
      return ""
    }

    return selectedSnapshot.id === snapshot.id ? "timeline-frame--selected" : ""
  }


  render() {
    const { selectedSnapshot, play, code } = this.state
    // We need to set useWorker=false to fix the `Failed to
    // execute 'importScripts' on 'WorkerGlobalScope'` error
    // https://github.com/securingsincity/react-ace/issues/725
    const timelineFrames = this.state.snapshots.map((snapshot, index) => {
      return <div key={ index } className={ `timeline-frame ${ this.snapshotSelectionStyle(snapshot) }` }>
        <img src={ snapshot.imageURL } onClick={ () => this.selectSnapshot(snapshot) } />
      </div>
    })


    let playPausePartial
    if (play) {
      playPausePartial = <button onClick={ () => this.pause() }>
        <i className="fas fa-pause text-light text-large spc"></i>
      </button>
    } else {
      playPausePartial = <button onClick={ () => this.play() }>
        <i className="fas fa-play text-light text-large spc"></i>
      </button>
    }

    let snapshot
    if (selectedSnapshot) {
      snapshot = <img className="layout-absolute-over" style={{ height: "100%", width: "100%" }} src={ selectedSnapshot.imageURL } />
    }

    const debugCode = this.injectDebugger(code)

    return <div className="layout-vstack">
      <div className="layout-fill">
        <div className="layout-split">
          <div className="layout-split-halfpanel">
            <div className="layout-vert">
              <div className="layout-vert-top scroll-y">
                <AceEditor
                  name="ace"
                  theme="tomorrow"
                  mode="javascript"
                  defaultValue={ this.state.code }
                  width="100%"
                  height="100%"
                  showPrintMargin={ false }
                  onChange={ code => this.handleChange(code) }
                  editorProps={{ $blockScrolling: true }}
                  setOptions={{ useWorker: false }}
                  fontSize={ 14 } />
              </div>

              <div className="console layout-vert-bottom">
                <p className="spc-n-zero">Console</p>
                {
                  JSON.stringify(selectedSnapshot?.state)
                }
              </div>
            </div>
          </div>
          <div className="layout-split-halfpanel">
            <div className="layout-absolute" style={{ height: "100%", width: "100%" }} >
              <div className="preview layout-absolute-over" style={{ height: "100%", width: "100%" }}>
                <iframe
                  ref={ this.previewRef }
                  scrolling="no"
                  srcDoc={`
                    <html>
                      <style>
                        html, body {
                          padding: 0;
                          margin: 0;
                        }
                      </style>

                      <body>
                        <script src="${ url }"></script>
                        <script>
                          function __copy(object, level=0) {
                            if (level > 3) {
                              return null
                            }

                            const newObj = {}

                            Object.keys(object).forEach(key => {
                              const value = object[key]

                              if (key === "p5") {
                                return
                              }

                              if (value._pInst) {
                                return
                              }

                              if (typeof value === "function") {
                                return
                              }

                              if (value && typeof value === "object") {
                                newObj[key] = __copy(value, level + 1)
                              } else {
                                newObj[key] = value
                              }
                            })

                            return newObj
                          }

                          window.addEventListener("message", message => {
                            if (message.data.event === "pause") {
                              noLoop()
                            }

                            if (message.data.event === "play") {
                              loop()
                            }
                          })

                          const __debugState = {}
                          let init = false
                          let time = -1

                          p5.prototype.registerMethod("post", () => {
                            time++

                            if (time % 100 !== 0) {
                              return
                            }

                            ${ debugCode }
                            const pushState = __copy(__debugState)

                            const data = this.canvas.toDataURL()
                            try {
                              window.parent.postMessage({ event: "draw", image: data, state: pushState })
                            } catch(e) {
                              console.log(e)
                            }

                            if (!init) {
                              noLoop()
                              init = true
                            }
                          })

                          ${ code }
                        </script>
                      </body>
                    </html>
                  `} />
              </div>
              { snapshot }
            </div>
          </div>
        </div>
      </div>
      <div className="timeline">
        <div className="layout-hstack pad-n" ref={ this.framesRef } style={{ minHeight: "80px" }}>
          { timelineFrames }
        </div>
        <div className="layout-hstack-centered">
          <button onClick={ () => this.restart() }>
            <i className="fas fa-redo text-light text-large spc"></i>
          </button>
          { playPausePartial }
        </div>
      </div>
    </div>
  }
}