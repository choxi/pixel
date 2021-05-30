// @ts-nocheck

import React from "react"
import AceEditor from "react-ace"

import "ace-builds/src-noconflict/mode-javascript"
import "ace-builds/src-noconflict/theme-github"

import p5 from "p5"

interface Props {

}

interface State {
  code: String
  images: [any]
}

const defaultCode = `
p.setup = () => {
  p.createCanvas(200, 200)
  p.background(255, 0, 0)
}
`

export default class App extends React.Component<Props, State> {
  state = { code: defaultCode, images: [] }
  previewRef: React.RefObject<HTMLDivElement> = React.createRef()
  framesRef: React.RefObject<HTMLDivElement> = React.createRef()
  p: p5 = new p5(() => {})
  images: [any] = []

  componentDidMount() {
    p5.prototype.registerMethod("post", () => this.handleDraw())
    this.updatePreview()
  }

  handleDraw() {
    const canvas = this.previewRef.current.querySelector("canvas")
    // this.images.push(canvas.toDataURL())
    this.state.images.push(canvas.toDataURL())
    this.setState({ images: this.state.images }, () => {

      this.framesRef.current.scrollBy(this.framesRef.current.scrollWidth, 0)
    })
  }

  saveTimeline() {
    this.setState({ images: this.images }, () => this.images = [])
  }

  handleChange(code: String) {
    this.setState({ code: code }, () => this.updatePreview())
  }

  updatePreview() {
    const preview = this.previewRef.current
    const w = { innerWidth: preview.clientWidth, innerHeight: preview.clientHeight }

    try {
      const sketch = new Function("p", "window", this.state.code)
      this.p.remove()
      this.p = new p5(p => sketch(p, w), this.previewRef.current)
    } catch(e) {
      console.log(e)
    }
  }

  render() {
    // We need to set useWorker=false to fix the `Failed to
    // execute 'importScripts' on 'WorkerGlobalScope'` error
    // https://github.com/securingsincity/react-ace/issues/725
    const timelineFrames = this.state.images.map((image, index) => {
      return <div key={ index } className="timeline-frame">
        <img src={ image } />
      </div>
    })

    return <div className="layout-vstack">
      <div className="layout-split">
        <div className="layout-split-halfpanel">
          <AceEditor
            name="ace"
            theme="github"
            mode="javascript"
            defaultValue={ this.state.code }
            width="100%"
            height="100%"
            showPrintMargin={ false }
            onChange={ code => this.handleChange(code) }
            editorProps={{ $blockScrolling: true }}
            setOptions={{ useWorker: false }} />
        </div>
        <div className="layout-split-halfpanel">
          <div className="preview" style={{ height: "100%" }} ref={ this.previewRef }> </div>
        </div>
      </div>
      <div className="timeline">
        <h1>Timeline</h1>
        <button onClick={ () => this.saveTimeline() }>Debug</button>
        <div className="layout-hstack layout-hstack-anchorRight" ref={ this.framesRef }>
          { timelineFrames }
        </div>
      </div>
    </div>
  }
}