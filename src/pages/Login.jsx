import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase/config';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function Login() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(false);
  const setUser = useAuthStore(state => state.setUser);
  const navigate = useNavigate();

  const syncUserRoleAndRedirect = async (firebaseUser) => {
    try {
      // Hit backend untuk fetch custom internal user profile role
      const res = await api.get('/auth/me');
      setUser(firebaseUser, res.data.user.role);
    } catch (err) {
      // Fallback default if not provisioned on db backend yet
      setUser(firebaseUser, 'Viewer');
    }
    navigate('/');
  };

  const onEmailLogin = async (data) => {
    setLoading(true);
    setAuthError('');
    try {
      const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
      await syncUserRoleAndRedirect(userCredential.user);
    } catch (err) {
      setAuthError(err.message.replace('Firebase:', ''));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await syncUserRoleAndRedirect(result.user);
    } catch (err) {
      setAuthError(err.message);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-6 text-white">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-md">
        <h2 className="text-3xl font-extrabold text-center tracking-tight bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
          RayanXWeb MDM Core
        </h2>
        <p className="mt-2 text-center text-sm text-slate-400">Enterprise Device Management Console</p>
        
        {authError && (
          <div className="mt-4 rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400 text-center">
            {authError}
          </div>
        )}

        <form onSubmit={handleSubmit(onEmailLogin)} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400">Email Address</label>
            <input 
              {...register('email', { required: 'Email identity is required' })}
              type="email" 
              className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 p-3 text-white focus:border-blue-500 focus:outline-none"
              placeholder="admin@rayanxweb.app"
            />
            {errors.email && <span className="text-xs text-red-400">{errors.email.message}</span>}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400">Security Password</label>
            <input 
              {...register('password', { required: 'Password is required' })}
              type="password" 
              className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 p-3 text-white focus:border-blue-500 focus:outline-none"
              placeholder="••••••••"
            />
            {errors.password && <span className="text-xs text-red-400">{errors.password.message}</span>}
          </div>

          <button 
            disabled={loading}
            type="submit" 
            className="w-full mt-2 rounded-lg bg-blue-600 p-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Decrypting Session...' : 'Authenticate Access'}
          </button>
        </form>

        <div className="relative my-6 flex items-center justify-center">
          <div className="absolute w-full border-t border-white/10"></div>
          <span className="relative bg-slate-900 px-3 text-xs text-slate-500 uppercase">Or Federated Auth</span>
        </div>

        <button 
          onClick={handleGoogleLogin}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 p-3 font-medium transition hover:bg-white/10"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.61 15.01 1 12 1 7.24 1 3.2 3.74 1.25 7.75l3.83 2.97C6.01 7.27 8.78 5.04 12 5.04z"/>
            <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.29 1.48-1.14 2.73-2.42 3.57v2.97h3.89c2.28-2.1 3.56-5.19 3.56-8.69z"/>
            <path fill="#FBBC05" d="M5.08 14.72c-.24-.72-.38-1.49-.38-2.28s.14-1.56.38-2.28L1.25 7.19C.45 8.79 0 10.59 0 12.5s.45 3.71 1.25 5.31l3.83-3.09z"/>
            <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.92l-3.89-2.97c-1.08.72-2.46 1.16-4.07 1.16-3.22 0-5.99-2.23-6.96-5.23L1.21 16.1C3.16 20.1 7.21 23 12 23z"/>
          </svg>
          Identity Provider Google
        </button>
      </div>
    </div>
  );
        }
