import EquipoWizard from "../components/EquipoWizard";
import { useNavigate } from "react-router-dom";

export default function CrearEquipo() {
  const navigate = useNavigate();

  return (
    <EquipoWizard
      onVolver={() => navigate("/equipos")}
      onEquipoCreado={(equipo) => {
        console.log("Equipo creado:", equipo);
        navigate("/equipos");
      }}
    />
  );
}