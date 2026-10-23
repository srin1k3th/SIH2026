import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';
import { Button } from './ui/Button';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in UI component tree:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center bg-surface m-6 rounded-card border border-red-200">
          <div className="p-3 rounded-full bg-red-100 text-red-600 mb-4">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-primary">Something went wrong</h2>
          <p className="text-sm text-primary-muted max-w-md mt-1">
            {this.state.error?.message || 'An unexpected rendering error occurred.'}
          </p>
          <Button
            className="mt-6"
            variant="primary"
            onClick={() => window.location.reload()}
            icon={<RefreshCcw className="w-4 h-4" />}
          >
            Reload application
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
