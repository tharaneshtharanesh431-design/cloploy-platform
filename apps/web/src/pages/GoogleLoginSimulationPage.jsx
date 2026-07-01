import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { googleLogin } from '../app/slices/authSlice';

export function GoogleLoginSimulationPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [step, setStep] = useState(1); // 1: Email, 2: Name/Details
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    if (!email) {
      setError('Enter an email or phone number');
      return;
    }
    if (!email.includes('@')) {
      setError('Enter a valid email address');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    if (!name) {
      setError('Enter your full name');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const resultAction = await dispatch(googleLogin({ email, name }));
      setLoading(false);
      if (googleLogin.fulfilled.match(resultAction)) {
        navigate('/dashboard');
      } else {
        setError(resultAction.payload || 'Authentication failed');
      }
    } catch (err) {
      setLoading(false);
      setError('Google Sign-in failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans px-4">
      <div className="w-full max-w-[450px] bg-white border border-gray-200 rounded-lg p-6 md:p-10 shadow-sm flex flex-col justify-between min-h-[500px]">
        <div>
          {/* Google Logo */}
          <div className="flex justify-start mb-6">
            <svg className="h-8" viewBox="0 0 24 24" width="74" height="24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
          </div>

          {step === 1 ? (
            <div>
              <h1 className="text-2xl font-normal text-[#202124] mb-2">Sign in</h1>
              <p className="text-sm text-[#202124] mb-8">to continue to <span className="font-semibold text-purple-600">Cloploy</span></p>

              {error && (
                <div className="mb-4 text-sm text-red-600 flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-red-600 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleEmailSubmit} className="space-y-6">
                <div className="relative border border-gray-300 rounded-md focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600 transition-colors">
                  <input
                    type="email"
                    className="w-full px-3 py-4 text-base text-gray-900 placeholder-transparent bg-transparent outline-none peer"
                    id="google-email"
                    placeholder="Email or phone"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError('');
                    }}
                    autoFocus
                  />
                  <label
                    htmlFor="google-email"
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-base pointer-events-none transition-all duration-200 peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-base peer-focus:top-2.5 peer-focus:text-xs peer-focus:text-blue-600 peer-[&:not(:placeholder-shown)]:top-2.5 peer-[&:not(:placeholder-shown)]:text-xs"
                  >
                    Email or phone
                  </label>
                </div>

                <div className="flex justify-between items-center text-sm font-semibold mt-4">
                  <span className="text-blue-600 hover:text-blue-700 cursor-pointer">Create account</span>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors tracking-wide"
                  >
                    Next
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div>
              {/* Back button / Account badge */}
              <div
                onClick={() => setStep(1)}
                className="flex items-center gap-2 border border-gray-200 rounded-full px-3 py-1.5 w-fit mb-8 cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600">
                  {email[0]?.toUpperCase()}
                </div>
                <span className="text-sm text-gray-700 font-medium">{email}</span>
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>

              <h1 className="text-2xl font-normal text-[#202124] mb-2">Welcome</h1>
              <p className="text-sm text-[#202124] mb-8">Enter your full name to proceed with Google Login</p>

              {error && (
                <div className="mb-4 text-sm text-red-600 flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-red-600 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleFinalSubmit} className="space-y-6">
                <div className="relative border border-gray-300 rounded-md focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600 transition-colors">
                  <input
                    type="text"
                    className="w-full px-3 py-4 text-base text-gray-900 placeholder-transparent bg-transparent outline-none peer"
                    id="google-name"
                    placeholder="Full Name"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setError('');
                    }}
                    autoFocus
                  />
                  <label
                    htmlFor="google-name"
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-base pointer-events-none transition-all duration-200 peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-base peer-focus:top-2.5 peer-focus:text-xs peer-focus:text-blue-600 peer-[&:not(:placeholder-shown)]:top-2.5 peer-[&:not(:placeholder-shown)]:text-xs"
                  >
                    Full Name
                  </label>
                </div>

                <div className="flex justify-between items-center text-sm font-semibold mt-4">
                  <span className="text-blue-600 hover:text-blue-700 cursor-pointer" onClick={() => setStep(1)}>Back</span>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors tracking-wide disabled:opacity-50 flex items-center gap-2"
                  >
                    {loading ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center text-xs text-[#747775] mt-8">
          <div>
            <select className="bg-transparent outline-none cursor-pointer border-none py-1">
              <option>English (United States)</option>
            </select>
          </div>
          <div className="flex gap-4">
            <span className="hover:underline cursor-pointer">Help</span>
            <span className="hover:underline cursor-pointer">Privacy</span>
            <span className="hover:underline cursor-pointer">Terms</span>
          </div>
        </div>
      </div>
    </div>
  );
}
