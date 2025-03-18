import React, { useState } from 'react';
import { LogIn, Lock, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import axios from 'axios';

export default function LoginForm() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  const fields = [
    { id: 'email', type: 'email', icon: Mail, placeholder: 'Enter your email' },
    { id: 'password', type: 'password', icon: Lock, placeholder: 'Enter password' }
  ];

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [id]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/login', formData);
      console.log('Login Response:', response.data); // Debug log
      
      if (response.data.token) {
        const userRole = response.data.user.role.toLowerCase(); // Normalize role to lowercase
        console.log('Setting user role:', userRole); // Debug log
        
        // Store token and user info in localStorage
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('userRole', userRole);
        localStorage.setItem('userName', response.data.user.name);
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('userEmail', formData.email);
        
        // Store profile photo URLs in localStorage with detailed logging
        const profilePhotoUrl = response.data.user.profilePhotoUrl || '';
        const localPhotoUrl = response.data.user.localPhotoUrl || '';
        
        console.log('Profile photo URLs from login response:', { 
          profilePhotoUrl, 
          localPhotoUrl,
          rawProfilePhotoUrl: response.data.user.profilePhotoUrl,
          rawLocalPhotoUrl: response.data.user.localPhotoUrl
        });
        
        localStorage.setItem('profilePhotoUrl', profilePhotoUrl);
        localStorage.setItem('localPhotoUrl', localPhotoUrl);
        
        // Log what was actually stored in localStorage
        console.log('Stored in localStorage:', {
          profilePhotoUrl: localStorage.getItem('profilePhotoUrl'),
          localPhotoUrl: localStorage.getItem('localPhotoUrl')
        });
        
        // Navigate based on role
        switch (userRole) {
          case 'superadmin':
          case 'admin':
            navigate('/');
            break;
          default:
            navigate('/');
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ background: "linear-gradient(to bottom right, #ffcc0075, #fff)" }} className="min-h-screen flex bg-gradient-to-br from-#ffcc00/20 to-#ffcc00/10 flex-col items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="card backdrop-blur-sm bg-white p-8 form-appear">
          <div className="flex flex-col items-center justify-center mb-12">
            <img 
              src="https://static.wixstatic.com/shapes/abaee8_dc6d6d64fba440848d2b9769e4f2e998.svg" 
              alt="Inkstall Logo" 
              className="w-48 h-auto mb-6"
            />
            <p className="mt-2 text-sm text-gray-600">Education Dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {fields.map(({ id, type, icon: Icon, placeholder }) => (
              <div key={id} className="relative">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Icon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id={id}
                    type={type}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder={placeholder}
                    onChange={handleChange}
                    value={formData[id]}
                    required
                  />
                </div>
              </div>
            ))}

            {error && (
              <div className="text-red-500 text-sm mt-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#ffcc00] hover:bg-[#ffcc09] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              disabled={isLoading}
            >
              <LogIn className="h-5 w-5 mr-2" />
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
