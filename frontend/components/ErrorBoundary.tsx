'use client';

import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary Component
 *
 * Catches React errors and displays a fallback UI
 */
export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught error:', error, errorInfo);

    // In production, you might want to log to an error tracking service
    // e.g., Sentry, LogRocket, etc.
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="error-boundary">
          <div className="error-content">
            <h1>Oops! Something went wrong</h1>
            <p>
              We encountered an unexpected error. This has been logged and we'll look into it.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="error-details">
                <summary>Error Details (Development Only)</summary>
                <pre>{this.state.error.toString()}</pre>
                {this.state.error.stack && (
                  <pre className="stack-trace">{this.state.error.stack}</pre>
                )}
              </details>
            )}

            <div className="error-actions">
              <button onClick={this.handleReset} className="retry-button">
                Try Again
              </button>
              <button
                onClick={() => (window.location.href = '/')}
                className="home-button"
              >
                Go Home
              </button>
            </div>
          </div>

          <style jsx>{`
            .error-boundary {
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              padding: 2rem;
              background-color: #f7fafc;
            }

            .error-content {
              max-width: 600px;
              background: white;
              border-radius: 8px;
              padding: 2rem;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }

            h1 {
              color: #e53e3e;
              margin-bottom: 1rem;
              font-size: 1.5rem;
            }

            p {
              color: #4a5568;
              margin-bottom: 1.5rem;
              line-height: 1.6;
            }

            .error-details {
              background-color: #f7fafc;
              padding: 1rem;
              border-radius: 4px;
              margin-bottom: 1.5rem;
              border: 1px solid #e2e8f0;
            }

            summary {
              cursor: pointer;
              font-weight: 600;
              color: #2d3748;
              margin-bottom: 0.5rem;
            }

            pre {
              overflow-x: auto;
              font-size: 0.875rem;
              color: #e53e3e;
              margin-top: 0.5rem;
            }

            .stack-trace {
              color: #718096;
              font-size: 0.75rem;
              margin-top: 1rem;
            }

            .error-actions {
              display: flex;
              gap: 1rem;
            }

            button {
              padding: 0.75rem 1.5rem;
              border-radius: 4px;
              font-weight: 500;
              cursor: pointer;
              transition: all 0.2s;
              border: none;
            }

            .retry-button {
              background-color: #3182ce;
              color: white;
            }

            .retry-button:hover {
              background-color: #2c5282;
            }

            .home-button {
              background-color: #e2e8f0;
              color: #2d3748;
            }

            .home-button:hover {
              background-color: #cbd5e0;
            }
          `}</style>
        </div>
      );
    }

    return this.props.children;
  }
}
