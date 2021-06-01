import React from "react"
import AceEditor from "react-ace"

import "ace-builds/src-noconflict/mode-javascript"
import "ace-builds/src-noconflict/theme-tomorrow"

import p5 from "p5"
import * as acorn from "acorn"

interface Props {

}

interface State {
  code: String
  snapshots: Array<Snapshot>
  play: Boolean
}

const defaultCode = `
const point = { x: 0, y: 0 }
let x, y = 10

p.setup = () => {
  p.createCanvas(window.innerWidth, window.innerHeight)
  p.background(255, 0, 0)
}

p.draw = () => {
  p.ellipse(point.x, point.y, 10)
  point.x += 1
  point.y += 1
}
`

function debug() {
  debugger
}

class Snapshot {
  imageURL: string
  state: string

  constructor(imageURL: string, state: object) {
    this.imageURL = imageURL
    this.state = JSON.stringify(state)
  }
}

export default class App extends React.Component<Props, State> {
  state = { code: defaultCode, snapshots: []as Array<Snapshot>, play: false }
  previewRef: React.RefObject<HTMLDivElement> = React.createRef()
  framesRef: React.RefObject<HTMLDivElement> = React.createRef()
  p: p5
  debugState: any = {}

  componentDidMount() {
    //@ts-ignore
    p5.prototype.registerMethod("post", () => this.handleDraw())
    //@ts-ignore
    // p5.prototype.registerMethod("post", debug)
    this.updatePreview()
  }

  handleDraw() {
    const canvas = this.previewRef.current.querySelector("canvas")
    const snapshot = new Snapshot(canvas.toDataURL(), this.debugState)

    this.state.snapshots.push(snapshot)
    this.setState({ snapshots: this.state.snapshots }, () => {
      this.framesRef.current.scrollBy(this.framesRef.current.scrollWidth, 0)
    })
  }

  handleChange(code: String) {
    this.setState({ code: code }, () => this.updatePreview())
  }

  updatePreview() {
    console.log("updatePreview")
    try {
      const preview = this.previewRef.current
      const w = { innerWidth: preview.clientWidth, innerHeight: preview.clientHeight }
      const { code, play } = this.state
      const parsed = acorn.parse(code, { ecmaVersion: 2020 })
      //@ts-ignore
      const variables = parsed.body.filter(n => n.type === "VariableDeclaration")
      //@ts-ignore
      const names = variables.map(n => n.declarations.map(d => d.id.name)).flat()
      //@ts-ignore
      const namesToProps = names.map(name => `__debugState.${ name } = ${ name }`)
      const debugCode = `
        ${ code }
        ${ namesToProps.join("\n") }
      `

      const sketch = new Function("p", "window", "__debugState", debugCode)
      this.p?.remove()
      console.log("new sketch")
      this.p = new p5(p => sketch(p, w, this.debugState), preview)

      if (!play) {
        this.p.noLoop()
      }
    } catch(e) {
      console.log(e)
    }
  }

  play() {
    this.setState({ play: true }, () => this.p.loop())
  }

  pause() {
    this.setState({ play: false }, () => this.p.noLoop())
  }

  restart() {

  }

  render() {
    // We need to set useWorker=false to fix the `Failed to
    // execute 'importScripts' on 'WorkerGlobalScope'` error
    // https://github.com/securingsincity/react-ace/issues/725
    const timelineFrames = this.state.snapshots.map((snapshot, index) => {
      return <div key={ index } className="timeline-frame">
        <img src={ snapshot.imageURL } />
        <div>{ snapshot.state }</div>
      </div>
    })

    return <div className="layout-vstack">
      <div className="layout-vstack-top">
        <div className="layout-split">
          <div className="layout-split-halfpanel scroll-y">
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
          <div className="layout-split-halfpanel">
            <div className="preview" style={{ height: "100%" }} ref={ this.previewRef }> </div>
          </div>
        </div>
      </div>
      <div className="layout-vstack-bottom timeline">
        <div className="layout-hstack-centered pad-n-l">
          <button onClick={ () => this.restart() }>
            <i className="fas fa-redo text-light text-large spc"></i>
          </button>
          <button onClick={ () => this.play() }>
            <i className="fas fa-play text-light text-large spc"></i>
          </button>
          <button onClick={ () => this.pause() }>
            <i className="fas fa-pause text-light text-large spc"></i>
          </button>
        </div>

        <div className="layout-hstack" ref={ this.framesRef }>
          { timelineFrames }
        </div>
      </div>
    </div>
  }
}