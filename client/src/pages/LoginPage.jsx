import { useState } from "react";

import api from "../services/api";
import { useAuth } from "../context/AuthContext";

function LoginPage() {
  const [email, setEmail] = useState("");

  const [password, setPassword] =
    useState("");

  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await api.post(
        "/auth/login",
        {
          email,
          password,
        }
      );

      login(
        response.data.token,
        response.data.user
      );
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-black text-white">
      <form
        onSubmit={handleLogin}
        className="bg-zinc-900 p-8 rounded-2xl w-96 space-y-4"
      >
        <h1 className="text-3xl font-bold">
          Login
        </h1>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
          className="w-full p-3 rounded-lg bg-zinc-800"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
          className="w-full p-3 rounded-lg bg-zinc-800"
        />

        <button className="w-full bg-blue-600 hover:bg-blue-700 p-3 rounded-lg">
          Login
        </button>
      </form>
    </div>
  );
}

export default LoginPage;