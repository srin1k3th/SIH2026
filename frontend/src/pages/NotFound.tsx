import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { FileQuestion, Home } from 'lucide-react';

export function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] p-8 text-center">
      <div className="p-4 rounded-full bg-slate-100 text-slate-500 mb-4">
        <FileQuestion className="w-12 h-12" />
      </div>
      <h2 className="text-2xl font-bold text-primary">Page not found</h2>
      <p className="text-sm text-primary-muted max-w-sm mt-1">
        The requested verification document or scrutiny page does not exist or has been moved.
      </p>
      <Button
        className="mt-6"
        variant="primary"
        onClick={() => navigate('/')}
        icon={<Home className="w-4 h-4" />}
      >
        Back to Dashboard
      </Button>
    </div>
  );
}
