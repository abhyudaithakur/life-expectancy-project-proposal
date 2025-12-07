// Ensure App.js actually runs (creates window.App)
import './App.js';

// Use React/ReactDOM globals from index.html and mount *window.App*.
function mountWhenReady() {
  if (window.React && window.ReactDOM && window.App) {
    const root = ReactDOM.createRoot(
      document.getElementById('root'),
    );
    root.render(React.createElement(window.App));
  } else {
    setTimeout(mountWhenReady, 0);
  }
}
mountWhenReady();
