export const PREVIEW_HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval' https://unpkg.com https://cdn.tailwindcss.com; style-src 'unsafe-inline'; img-src data: blob:; font-src data:; connect-src 'none'; form-action 'none'; base-uri 'none'" />
<style>
  html, body { margin: 0; }
  body { min-height: 100vh; font-family: ui-sans-serif, system-ui, sans-serif; }
</style>
<script src="https://cdn.tailwindcss.com/3.4.17"></script>
<script src="https://unpkg.com/react@18.3.1/umd/react.development.js"></script>
<script src="https://unpkg.com/react-dom@18.3.1/umd/react-dom.development.js"></script>
<script src="https://unpkg.com/@babel/standalone@7.26.4/babel.min.js"></script>
</head>
<body>
<div id="root"></div>
<script>
(function () {
  var currentId = 0;
  var root = null;
  var renderKey = 0;

  function send(msg) {
    window.parent.postMessage(msg, "*");
  }

  function fail(phase, err) {
    var text = err && err.message ? err.message : String(err);
    send({ type: "error", id: currentId, phase: phase, message: text.slice(0, 2000) });
  }

  if (typeof React === "undefined" || typeof ReactDOM === "undefined" || typeof Babel === "undefined") {
    fail("load", new Error("Could not load the preview libraries. Check your internet connection and press refresh."));
    return;
  }

  // Stops runaway loops (while (true) and friends) before they freeze the page
  var LOOP_LIMIT = 3000000;
  var loopCount = 0;
  var loopResetQueued = false;

  window.__loopGuard = function () {
    loopCount += 1;
    if (!loopResetQueued) {
      loopResetQueued = true;
      // Timers only fire between tasks, so this counts iterations per synchronous run
      setTimeout(function () {
        loopCount = 0;
        loopResetQueued = false;
      }, 0);
    }
    if (loopCount > LOOP_LIMIT) {
      loopCount = 0;
      throw new Error("Possible infinite loop: a loop ran more than 3 million iterations without yielding, so it was stopped.");
    }
  };

  Babel.registerPlugin("loop-guard", function (babel) {
    var t = babel.types;
    return {
      visitor: {
        Loop: function (path) {
          if (path.node.__guarded) return;
          path.node.__guarded = true;

          var body = path.get("body");
          if (!body.isBlockStatement()) {
            body.replaceWith(t.blockStatement([body.node]));
          }
          path.get("body").unshiftContainer(
            "body",
            t.expressionStatement(t.callExpression(t.identifier("__loopGuard"), []))
          );
        }
      }
    };
  });

  // Catches errors thrown while rendering the generated component
  class Boundary extends React.Component {
    constructor(props) {
      super(props);
      this.state = { failed: false };
    }
    static getDerivedStateFromError() {
      return { failed: true };
    }
    componentDidCatch(error) {
      fail("runtime", error);
    }
    render() {
      return this.state.failed ? null : this.props.children;
    }
  }

  function compile(source) {
    return Babel.transform(source, {
      filename: "component.tsx",
      sourceType: "module",
      presets: [["typescript", { isTSX: true, allExtensions: true }], "react"],
      plugins: ["loop-guard", "transform-modules-commonjs"]
    }).code;
  }

  function load(js) {
    var module = { exports: {} };
    function fakeRequire(name) {
      if (name === "react") return React;
      throw new Error('Cannot import "' + name + '". Only "react" is available in the preview.');
    }
    new Function("require", "exports", "module", js)(fakeRequire, module.exports, module);

    var Comp = module.exports.default;
    if (typeof Comp !== "function" && !(Comp && Comp.$$typeof)) {
      throw new Error("No default export found. Use: export default function Component() { ... }");
    }
    return Comp;
  }

  function mount(Comp) {
    if (!root) root = ReactDOM.createRoot(document.getElementById("root"));
    renderKey += 1;
    root.render(
      React.createElement(Boundary, { key: renderKey }, React.createElement(Comp))
    );
  }

  window.addEventListener("message", function (e) {
    if (e.source !== window.parent) return;
    var data = e.data;
    if (!data || data.type !== "render" || typeof data.code !== "string") return;

    currentId = data.id;
    var phase = "compile";
    try {
      var js = compile(data.code);
      phase = "runtime";
      mount(load(js));
      send({ type: "rendered", id: currentId });
    } catch (err) {
      fail(phase, err);
    }
  });

  window.addEventListener("error", function (e) {
    fail("runtime", e.error || new Error(e.message));
  });
  window.addEventListener("unhandledrejection", function (e) {
    fail("runtime", e.reason || new Error("Unhandled promise rejection"));
  });

  // Generated code must not navigate the frame
  document.addEventListener("submit", function (e) {
    e.preventDefault();
  });
  document.addEventListener("click", function (e) {
    var a = e.target && e.target.closest ? e.target.closest("a") : null;
    if (!a) return;
    var href = a.getAttribute("href") || "";
    if (href.length < 2 || href.charAt(0) !== "#") e.preventDefault();
  });

  send({ type: "ready" });

  // Heartbeat: lets the parent restart this frame if it stops responding
  setInterval(function () {
    send({ type: "alive" });
  }, 1000);
})();
</script>
</body>
</html>`;