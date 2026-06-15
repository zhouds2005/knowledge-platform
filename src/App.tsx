import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, RequireAuth } from "./providers/AuthProvider";
import AppLayout from "./components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import KnowledgeDetail from "./pages/KnowledgeDetail";
import DocumentCreate from "./pages/DocumentCreate";
import DocumentDetail from "./pages/DocumentDetail";
import WikiCreate from "./pages/WikiCreate";
import WikiDetail from "./pages/WikiDetail";
import WikiEdit from "./pages/WikiEdit";
import DriveView from "./pages/DriveView";
import ReviewQueue from "./pages/ReviewQueue";
import NotificationCenter from "./pages/NotificationCenter";
import SpaceView from "./pages/SpaceView";
import SpaceManagement from "./pages/SpaceManagement";
import UserManagement from "./pages/UserManagement";
import DepartmentManagement from "./pages/DepartmentManagement";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/space/:spaceId" element={<SpaceView />} />
              <Route path="/knowledge/:id" element={<KnowledgeDetail />} />
              <Route path="/knowledge/:id/edit" element={<WikiEdit />} />
              <Route path="/documents/new" element={<DocumentCreate />} />
              <Route path="/documents/:id" element={<DocumentDetail />} />
              <Route path="/wiki/new" element={<WikiCreate />} />
              <Route path="/wiki/:id" element={<WikiDetail />} />
              <Route path="/drive" element={<DriveView />} />
              <Route path="/review" element={<ReviewQueue />} />
              <Route path="/notifications" element={<NotificationCenter />} />
              <Route path="/admin/users" element={<UserManagement />} />
              <Route path="/admin/departments" element={<DepartmentManagement />} />
              <Route path="/admin/spaces" element={<SpaceManagement />} />
            </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
