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

export default class App extends React.Component<Props, State> {
  state = { code: "" }
  previewRef: React.RefObject<HTMLDivElement> = React.createRef()

  handleChange(code: String) {
    this.setState({ code: code }, () => this.updatePreview())
  }

  updatePreview() {
    this.previewRef.current.innerHTML = ""

    try {
      const app = new p5(p => new Function("p", this.state.code)(p),
                        this.previewRef.current)
    } catch(e) {
      console.log(e)
    }
  }

  render() {
    return <div>
      <AceEditor
        name="ace"
        theme="github"
        mode="javascript"
        onChange={ code => this.handleChange(code) }
        editorProps={{ $blockScrolling: true }} />
      <div className="preview" ref={ this.previewRef }>
      </div>
    </div>
  }
}