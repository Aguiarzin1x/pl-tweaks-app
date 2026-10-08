import { useEffect } from "react";
import { Navigate, useParams } from "react-router-dom";
import { apiGet } from "@/lib/api";
export default function Referral() {
  const { code } = useParams();
  useEffect(() => {
    if (code) {
      localStorage.setItem("pl_referral_code", code);
      void apiGet(`/ref/${encodeURIComponent(code)}`);
    }
  }, [code]);
  return <Navigate to="/login" replace />;
}
