import { BG, TEAL, TEXT } from "../theme"

export default function GlobalStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&display=swap');
      *{box-sizing:border-box;margin:0;padding:0}
      ::-webkit-scrollbar{width:3px;height:3px}::-webkit-scrollbar-track{background:${BG}}::-webkit-scrollbar-thumb{background:#282828}
      @keyframes ticker{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
      @keyframes spin{to{transform:rotate(360deg)}}
      @keyframes pulse{0%,100%{opacity:.2}50%{opacity:1}}
      @keyframes fadeUp{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
      .ri:hover{background:rgba(0,194,168,.07)!important;cursor:pointer}.ri.sel{background:rgba(0,194,168,.1)!important}
      .mo:hover{background:rgba(0,194,168,.12)!important;color:${TEAL}!important}
      .tb:hover{color:${TEXT}!important}.fb:hover{color:${TEXT}!important}
      .sb:hover{border-color:${TEAL}!important;color:${TEAL}!important}
      .vc:hover{background:rgba(0,194,168,.06)!important;cursor:pointer}
      .yb:hover{border-color:${TEAL}!important;color:${TEAL}!important}
      .rb:hover{border-color:${TEAL}!important;color:${TEAL}!important}
      input:focus{outline:none;border-color:${TEAL}!important}
    `}</style>
  )
}
