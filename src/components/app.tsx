import React from "react"
import AceEditor from "react-ace"

import "ace-builds/src-noconflict/mode-javascript";
import "ace-builds/src-noconflict/theme-github";

export default class App extends React.Component {
  render() {
    return <div>
      <AceEditor
        mode="javascript"
        theme="github"
        name="ace"
        editorProps={{ $blockScrolling: true }} />,
    </div>
  }
}