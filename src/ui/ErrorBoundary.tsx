import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  failed: boolean;
}

/**
 * Catches render-time failures in the 3D scene (most commonly a WebGL
 * context that couldn't be created) so the app shows a plain-language
 * message instead of a blank page. React only supports error boundaries as
 * class components — there's no hook equivalent.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="scene-error">
          <h1>This device can't display the 3D showroom</h1>
          <p>
            Your browser couldn't start 3D rendering. Try a recent version of Chrome, Edge, or the Meta Quest
            browser, and make sure hardware acceleration is turned on.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}
