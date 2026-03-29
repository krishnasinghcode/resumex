import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ErrorBanner } from '@/components/common/ErrorBanner';
import { companyApi } from '@/api/company.api';
import { useCompanyStore } from '@/store/company.store';
import { getErrorMessage } from '@/api/axios';
import { cn } from '@/lib/utils';

const schema = z.object({
  name:     z.string().min(2, 'Company name must be at least 2 characters'),
  email:    z.string().email('Valid email required'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[0-9]/, 'Must contain a number'),
  website:  z.string().url('Must be a valid URL').optional().or(z.literal('')),
  industry: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function CompanyRegisterPage() {
  const navigate = useNavigate();
  const setAuth  = useCompanyStore(s => s.setAuth);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (values: FormData) => {
    setError(null);
    try {
      const { data } = await companyApi.register(values);
      setAuth(data.data.accessToken, data.data.company);
      navigate('/company/dashboard');
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const fields = [
    { name: 'name'     as const, label: 'Company Name',        type: 'text',     placeholder: 'Stripe Inc.'                },
    { name: 'email'    as const, label: 'Work Email',           type: 'email',    placeholder: 'recruiting@stripe.com'      },
    { name: 'password' as const, label: 'Password',             type: 'password', placeholder: ''                           },
    { name: 'website'  as const, label: 'Website (optional)',   type: 'url',      placeholder: 'https://stripe.com'         },
    { name: 'industry' as const, label: 'Industry (optional)',  type: 'text',     placeholder: 'FinTech'                    },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold">Create Company Account</h1>
          <p className="text-sm text-muted-foreground">Start hiring smarter with ResumeX</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {fields.map(({ name, label, type, placeholder }) => (
            <div key={name} className="space-y-1.5">
              <Label htmlFor={name}>{label}</Label>
              <Input
                id={name}
                type={type}
                placeholder={placeholder}
                {...register(name)}
                className={cn(errors[name] && 'border-destructive')}
              />
              {errors[name] && <p className="text-xs text-destructive">{errors[name]?.message}</p>}
            </div>
          ))}

          {error && <ErrorBanner message={error} />}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Creating account…' : 'Create account'}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link to="/company/login" className="text-primary hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
