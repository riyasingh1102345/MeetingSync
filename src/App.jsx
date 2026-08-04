import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import SignIn from './pages/SignIn';
import Dashboard from './pages/Dashboard';
import Meetings from './pages/Meetings';
import Upload from './pages/Upload';
import MeetingDetail from './pages/MeetingDetail';
import Search from './pages/Search';
import History from './pages/History';
import Analytics from './pages/Analytics';
import LiveMeeting from './pages/LiveMeeting';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/signin" element={<SignIn />} />
          
          <Route element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/meetings" element={<Meetings />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/meeting/:id" element={<MeetingDetail />} />
            <Route path="/search" element={<Search />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/history" element={<History />} />
            <Route path="/live" element={<LiveMeeting />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
