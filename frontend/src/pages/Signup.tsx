import { useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authApi } from '@/api/authApi';

const roles = ['ADMIN', 'HR_MANAGER', 'TEAM_LEAD', 'EMPLOYEE'];

export default function Signup() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('EMPLOYEE');

  const strength = useMemo(() => {
    if (password.length < 8) return 'Weak';
    if (/[A-Z]/.test(password) && /\d/.test(password) && /[^A-Za-z0-9]/.test(password)) return 'Strong';
    return 'Medium';
  }, [password]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    try {
      await authApi.signup({ full_name: fullName, email, password, role });
      toast.success('Account created');
      navigate('/login');
    } catch {
      toast.error('Signup failed');
    }
  };

  return (
    <div className='min-h-screen flex items-center justify-center p-6 bg-slate-50'>
      <form onSubmit={submit} className='card p-6 w-full max-w-lg space-y-4'>
        <h2 className='text-2xl font-semibold'>Create Account</h2>
        <input className='input' placeholder='Full name' value={fullName} onChange={(e) => setFullName(e.target.value)} />
        <input className='input' placeholder='Email' value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className='input' type='password' placeholder='Password' value={password} onChange={(e) => setPassword(e.target.value)} />
        <p className='text-xs text-slate-500'>Password strength: {strength}</p>
        <input className='input' type='password' placeholder='Confirm password' value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
        <select className='input' value={role} onChange={(e) => setRole(e.target.value)}>
          {roles.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <button className='btn-primary w-full' type='submit'>Sign Up</button>
        <Link to='/login' className='text-sm text-indigo-600'>Back to login</Link>
      </form>
    </div>
  );
}
