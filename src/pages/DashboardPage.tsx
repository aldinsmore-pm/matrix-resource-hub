
import Dashboard from "../components/dashboard/Dashboard";
import ParticleBackground from "../components/ParticleBackground";

const DashboardPage = () => {
  return (
    <>
      <ParticleBackground particleCount={60} opacity={0.5} />
      <Dashboard />
    </>
  );
};

export default DashboardPage;
