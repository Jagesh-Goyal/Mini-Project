import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authApi } from '@/api/authApi';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@')) {
      toast.error('Enter valid email');
      return;
    }
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    try {
      await authApi.login({ email, password });
      navigate('/');
    } catch {
      toast.error('Login failed');
    }
  };

  return (
    <div className='min-h-screen grid md:grid-cols-2 bg-slate-50'>
      <section className='hidden md:flex bg-indigo-600 text-white p-10 items-center'>
        <div>
          <h1 className='text-4xl font-bold'>Dakshtra</h1>
          <p className='mt-3 text-indigo-100'>AI-Based Workforce Planning and Skill Gap Intelligence.</p>
        </div>
      </section>
      <section className='flex items-center justify-center p-6'>
        <form onSubmit={submit} className='card p-6 w-full max-w-md space-y-4'>
          <h2 className='text-2xl font-semibold'>Login</h2>
          <div>
            <label className='text-sm text-slate-600'>Email</label>
            <input className='input mt-1' value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className='text-sm text-slate-600'>Password</label>
            <div className='mt-1 flex gap-2'>
              <input className='input' type={show ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} />
              <button type='button' className='px-3 rounded border border-slate-300' onClick={() => setShow((v) => !v)}>{show ? 'Hide' : 'Show'}</button>
            </div>
          </div>
          <button className='btn-primary w-full' type='submit'>Sign In</button>
          <div className='text-sm text-slate-600 flex justify-between'>
            <Link to='/signup' className='text-indigo-600'>Create account</Link>
            <button type='button' className='text-indigo-600'>Forgot password</button>
          </div>
        </form>
      </section>
    </div>
  );
}
