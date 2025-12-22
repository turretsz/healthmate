import React, { useState } from 'react';
import axios from 'axios';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    axios.post('http://localhost:5000/api/login', { email, password })
      .then(response => {
        console.log('Login successful:', response.data);
        localStorage.setItem('token', response.data.token);
        window.location.href = '/dashboard';
      })
      .catch(error => {
        setErrorMessage('Đăng nhập không thành công. Vui lòng kiểm tra lại thông tin.');
        console.log('Login failed:', error.message);
      });
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <h2 className="text-2xl font-bold text-center">Đăng Nhập</h2>
      {errorMessage && <p className="text-red-500 text-center">{errorMessage}</p>}
      <form onSubmit={handleLogin} className="mt-4">
        <div className="mb-4">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border rounded-md mt-1"
            required
          />
        </div>
        <div className="mb-4">
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">Mật khẩu</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded-md mt-1"
            required
          />
        </div>
        <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded-md mt-4">Đăng nhập</button>
      </form>
    </div>
  );
};

export default Login;
