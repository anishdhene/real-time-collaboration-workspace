import MainLayout from "./layouts/MainLayout";

import LoginPage from "./pages/LoginPage";

import { useAuth } from "./context/AuthContext";

function App() {
  const { token } = useAuth();

  if (!token) {
    return <LoginPage />;
  }

  return <MainLayout />;
}

export default App;