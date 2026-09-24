import { Component } from 'react';

/** Stops one broken render from blanking the whole app. */
export class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Unhandled UI error:', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="spinner-page">
        <p className="empty-state-icon" aria-hidden="true">💥</p>
        <p className="empty-state-title">This screen hit an error</p>
        <p className="empty-state-text">{this.state.error.message}</p>
        <button type="button" className="btn btn-ghost" onClick={() => window.location.reload()}>
          Reload the app
        </button>
      </div>
    );
  }
}
