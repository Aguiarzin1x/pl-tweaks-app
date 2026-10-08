import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import DashboardHome from "@/pages/app/DashboardHome";
import Tweaks from "@/pages/app/Tweaks";
import Games from "@/pages/app/Games";
import Hardware from "@/pages/app/Hardware";
import Benchmark from "@/pages/app/Benchmark";
import History from "@/pages/app/History";
import Cleanup from "@/pages/app/Cleanup";
import About from "@/pages/app/About";
import Admin from "@/pages/Admin";
import Referral from "@/pages/Referral";

// One <Route> per page in src/pages; BrowserRouter already wraps this in main.tsx.
export default function App() {
  return (
    <>
      <Toaster position="bottom-right" richColors />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/app" element={<DashboardHome />} />
        <Route path="/app/ajustes" element={<Tweaks />} />
        <Route path="/app/jogos" element={<Games />} />
        <Route path="/app/hardware" element={<Hardware />} />
        <Route path="/app/benchmark" element={<Benchmark />} />
        <Route path="/app/historico" element={<History />} />
        <Route path="/app/limpeza" element={<Cleanup />} />
        <Route path="/app/sobre" element={<About />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/ref/:code" element={<Referral />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
