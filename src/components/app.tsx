import React from "react"
import AceEditor from "react-ace"

import "ace-builds/src-noconflict/mode-javascript"
import "ace-builds/src-noconflict/theme-github"

import p5 from "p5"

interface Props {

}

interface State {
  code: String
}

const defaultCode = `
p.setup = () => {
  p.createCanvas(200, 200)
  p.background(255, 0, 0)
}
`

export default class App extends React.Component<Props, State> {
  state = { code: defaultCode }
  previewRef: React.RefObject<HTMLDivElement> = React.createRef()
  p: p5 = new p5(() => {})

  componentDidMount() {
    this.updatePreview()
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
    return <div className="layout-split">
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
          editorProps={{ $blockScrolling: true }} />
      </div>
      <div className="layout-split-halfpanel">
        <div className="preview" style={{ height: "100%" }} ref={ this.previewRef }> </div>
      </div>
    </div>
  }
}