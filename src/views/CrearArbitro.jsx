import ArbitroWizard from "../components/ArbitroWizard";
import { useNavigate } from "react-router-dom";

export default function CrearArbitro() {
  const navigate = useNavigate();

  return (
    <ArbitroWizard
      onVolver={() => navigate("/arbitros")}
    />
  );
}
