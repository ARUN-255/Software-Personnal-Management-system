import React from 'react';
export default class ErrorBoundary extends React.Component {
  state = {
    error: null
  };
  static getDerivedStateFromError(error) {
    return {
      error
    };
  }
  componentDidCatch(error, info) {
    console.error('Page error', error, info);
  }
  render() {
    if (this.state.error) return <div className="loader">
    <div className="panel">
      <h2>Page could not load</h2>
      <p>
        {this.state.error.message}
      </p>
      <button className="btn" onClick={() => {
          this.setState({
            error: null
          });
          window.location.href = '/';
        }}>Return home</button>
    </div>
  </div>;
    return this.props.children;
  }
}
